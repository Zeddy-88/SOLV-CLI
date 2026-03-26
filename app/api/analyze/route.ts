import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { parseReport } from '@/lib/parsers'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/claude/prompts'
import { withRetry } from '@/lib/claude/retry'
import type { AnalysisResult } from '@/types/analysis'

export const maxDuration = 60

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { analysisId?: string }
  const { analysisId } = body

  if (!analysisId) {
    return NextResponse.json({ error: 'analysisId가 필요합니다.' }, { status: 400 })
  }

  // user_id 조건 포함 조회 (RLS 이중 보호)
  const { data: record, error: fetchError } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !record) {
    return NextResponse.json({ error: '분석 레코드를 찾을 수 없습니다.' }, { status: 404 })
  }

  // processing 상태로 업데이트
  await supabase
    .from('analyses')
    .update({ status: 'processing' })
    .eq('id', analysisId)

  try {
    // Supabase Storage에서 PDF 다운로드
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('reports')
      .download(record.file_path)

    if (downloadError || !fileData) {
      throw new Error('PDF 파일 다운로드 실패')
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // PDF 파싱
    const financialData = await parseReport(buffer)

    // pdf_format 업데이트
    await supabase
      .from('analyses')
      .update({ pdf_format: financialData.format })
      .eq('id', analysisId)

    // Claude API 호출 (재시도 포함)
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const result = await withRetry(async () => {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: buildSystemPrompt(),
        messages: [
          { role: 'user', content: buildUserPrompt(financialData) },
        ],
      })

      const content = message.content[0]
      if (content.type !== 'text') throw new Error('예상치 못한 응답 타입')

      // JSON 파싱 (코드 블록으로 감싸진 경우 처리)
      const jsonMatch =
        content.text.match(/```json\n?([\s\S]*?)\n?```/) ??
        content.text.match(/(\{[\s\S]*\})/)

      if (!jsonMatch) throw new Error('JSON 파싱 실패')

      return JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as AnalysisResult
    })

    // 분석 결과 저장
    await supabase
      .from('analyses')
      .update({
        status: 'done',
        analysis_result: result,
        company_name: result.company.name,
        biz_number: result.company.bizNumber,
        ceo_name: result.company.ceo,
        industry: result.company.industry,
      })
      .eq('id', analysisId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류'

    await supabase
      .from('analyses')
      .update({ status: 'error', error_message: errorMessage })
      .eq('id', analysisId)

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

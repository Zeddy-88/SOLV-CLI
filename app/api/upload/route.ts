import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectFormat } from '@/lib/parsers/detect'
import { extractTextFromPdf } from '@/lib/parsers/extract'

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }
  if (file.type !== 'application/pdf') {
    return NextResponse.json(
      { error: 'PDF 파일만 업로드 가능합니다.' },
      { status: 400 }
    )
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json(
      { error: '파일 크기는 20MB 이하여야 합니다.' },
      { status: 400 }
    )
  }

  const analysisId = crypto.randomUUID()
  const filePath = `${user.id}/${analysisId}.pdf`

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // 포맷 감지 (빠른 텍스트 추출 시도)
  let pdfFormat: 'cretop' | 'nice' | 'generic' = 'generic'
  try {
    const text = await extractTextFromPdf(buffer)
    pdfFormat = detectFormat(text)
  } catch {
    // 스캔본 등 텍스트 추출 실패 시 generic으로 처리
  }

  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(filePath, bytes, { contentType: 'application/pdf' })

  if (uploadError) {
    return NextResponse.json({ error: '파일 업로드 실패' }, { status: 500 })
  }

  const { error: insertError } = await supabase.from('analyses').insert({
    id: analysisId,
    user_id: user.id,
    file_name: file.name,
    file_path: filePath,
    pdf_format: pdfFormat,
    status: 'pending',
  })

  if (insertError) {
    // Storage 업로드는 성공했지만 DB 실패 — 고아 파일 정리
    await supabase.storage.from('reports').remove([filePath])
    return NextResponse.json({ error: '분석 레코드 생성 실패' }, { status: 500 })
  }

  // 백그라운드 분석 트리거 (응답 기다리지 않음)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  fetch(`${appUrl}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId }),
  }).catch(() => {
    // fire-and-forget — 실패해도 업로드 응답에 영향 없음
  })

  return NextResponse.json({ analysisId })
}

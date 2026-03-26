import { createClient } from '@/lib/supabase/server'
import type { AnalysisResult } from '@/types/analysis'

export const maxDuration = 60

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { data: record } = await supabase
    .from('analyses')
    .select('analysis_result, created_at, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!record || record.status !== 'done' || !record.analysis_result) {
    return new Response('Not found', { status: 404 })
  }

  const analysis = record.analysis_result as AnalysisResult
  const companyName = analysis.company.name || '재무분석'
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `${companyName}_재무분석보고서_${dateStr}.pdf`

  // Lazy import to prevent react-pdf reconciler from affecting build-time rendering
  const { renderToBuffer } = await import('@react-pdf/renderer')
  const { createElement } = await import('react')
  const { default: ReportDocument } = await import('@/lib/pdf/ReportDocument')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = createElement(ReportDocument as any, { analysis, createdAt: record.created_at }) as any
  const buffer = await renderToBuffer(element)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  })
}

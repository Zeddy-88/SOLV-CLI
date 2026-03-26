import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { AnalysisResult } from '@/types/analysis'
import ReportPreview from '@/components/report/ReportPreview'

type Props = {
  params: Promise<{ id: string }>
}

export default async function ReportPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: record } = await supabase
    .from('analyses')
    .select('analysis_result, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!record || record.status !== 'done' || !record.analysis_result) notFound()

  const analysis = record.analysis_result as AnalysisResult

  return <ReportPreview analysisId={id} analysis={analysis} />
}

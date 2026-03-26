import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import DashboardView from '@/components/dashboard/DashboardView'
import AnalysisLoading from '@/components/dashboard/AnalysisLoading'
import type { AnalysisStatus } from '@/types/analysis'

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('analyses')
    .select('company_name')
    .eq('id', id)
    .single()

  return {
    title: data?.company_name
      ? `${data.company_name} — Solve AI`
      : 'Solve AI',
  }
}

export default async function DashboardPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: record } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!record) notFound()

  if (record.status === 'pending' || record.status === 'processing') {
    return (
      <AnalysisLoading
        analysisId={id}
        initialStatus={record.status as AnalysisStatus}
      />
    )
  }

  if (record.status === 'error') {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-red-700 mb-3">
          분석 중 오류가 발생했습니다{record.error_message ? `: ${record.error_message}` : '.'}
        </p>
        <Link href="/" className="text-sm text-blue-700 underline">다시 시도하기</Link>
      </div>
    )
  }

  return <DashboardView analysis={record} />
}

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import type { AnalysisResult } from '@/types/analysis'

type Props = {
  params: Promise<{ id: string }>
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
    redirect('/?analysisId=' + id)
  }

  if (record.status === 'error') {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-red-700">분석 중 오류가 발생했습니다: {record.error_message}</p>
      </div>
    )
  }

  const result = record.analysis_result as AnalysisResult

  return (
    <div className="px-5 py-6 max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">{result.company.name}</h1>
      <p className="text-sm text-gray-500 mb-6">{result.company.industry}</p>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">회사 요약</h2>
        <p className="text-sm text-gray-600 whitespace-pre-line">{result.summary}</p>
      </section>

      <section className="mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-2">주요 이슈</h2>
        <ul className="space-y-2">
          {result.issues.map((issue, i) => (
            <li
              key={i}
              className={`rounded-md px-3 py-2 text-sm ${
                issue.severity === 'critical'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-yellow-50 text-yellow-800'
              }`}
            >
              <span className="font-medium">{issue.title}</span>
              {issue.value && <span className="ml-2 text-xs opacity-70">{issue.value}</span>}
              <p className="mt-0.5 text-xs opacity-80">{issue.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-medium text-gray-700 mb-2">영업 멘트</h2>
        <div className="space-y-3">
          {[
            { label: '오프닝', text: result.salesScripts.opening },
            { label: '문제 구체화', text: result.salesScripts.problemDetail },
            { label: '위기감 조성', text: result.salesScripts.urgency },
            { label: '클로징', text: result.salesScripts.closing },
          ].map(({ label, text }) => (
            <div key={label} className="border rounded-md px-3 py-2">
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

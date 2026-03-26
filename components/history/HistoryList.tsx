import Link from 'next/link'

type Analysis = {
  id: string
  company_name: string | null
  created_at: string
  status: string
  pdf_format: string
}

export default function HistoryList({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) {
    return (
      <p className="text-sm text-gray-500">아직 분석한 기업이 없습니다.</p>
    )
  }

  return (
    <div className="space-y-2">
      {analyses.map((a) => (
        <Link
          key={a.id}
          href={a.status === 'done' ? `/dashboard/${a.id}` : '#'}
          className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {a.company_name ?? '(기업명 미확인)'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(a.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                {' · '}
                {a.pdf_format === 'cretop'
                  ? 'CRETOP'
                  : a.pdf_format === 'nice'
                    ? 'NICE BizLine'
                    : '일반'}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        </Link>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'done') {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">
        완료
      </span>
    )
  }
  if (status === 'processing') {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
        분석 중
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">
        오류
      </span>
    )
  }
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
      대기
    </span>
  )
}

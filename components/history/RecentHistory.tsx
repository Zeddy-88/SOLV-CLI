import Link from 'next/link'

type Item = {
  id: string
  company_name: string | null
  created_at: string
  status: string
}

export default function RecentHistory({ analyses }: { analyses: Item[] }) {
  return (
    <div className="space-y-1.5">
      {analyses.map((a) => (
        <Link
          key={a.id}
          href={`/dashboard/${a.id}`}
          className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium">
            {a.company_name ?? '(기업명 미확인)'}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(a.created_at).toLocaleDateString('ko-KR', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        </Link>
      ))}
    </div>
  )
}

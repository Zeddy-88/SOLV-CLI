import type { AnalysisResult } from '@/types/analysis'

type IssuesListProps = {
  issues: AnalysisResult['issues']
}

export default function IssuesList({ issues }: IssuesListProps) {
  return (
    <div>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">핵심 이슈</h2>
      {issues.length === 0 ? (
        <p className="text-sm text-gray-500">특별한 위험 이슈가 발견되지 않았습니다.</p>
      ) : (
        <ul className="space-y-2">
          {issues.map((issue, i) => (
            <li
              key={i}
              className={`rounded-r-md px-4 py-3 ${
                issue.severity === 'critical'
                  ? 'border-l-4 border-red-400 bg-red-50'
                  : 'border-l-4 border-amber-400 bg-amber-50'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className={`text-sm font-medium ${issue.severity === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>
                  {issue.title}
                </span>
                {issue.value && (
                  <span className="text-xs text-gray-500">{issue.value}</span>
                )}
              </div>
              <p className="text-xs mt-0.5 text-gray-600">{issue.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

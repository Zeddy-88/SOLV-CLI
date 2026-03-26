import type { AnalysisResult } from '@/types/analysis'

type CompanyHeaderProps = {
  company: AnalysisResult['company']
  format: string
  createdAt: string
}

const FORMAT_LABEL: Record<string, string> = {
  cretop: 'CRETOP',
  nice: 'NICE BizLine',
  generic: '일반 재무제표',
}

export default function CompanyHeader({ company, format, createdAt }: CompanyHeaderProps) {
  const date = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-medium">{company.name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{company.industry}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {company.creditGrade && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
              {company.creditGrade}
            </span>
          )}
          {company.industryRank && (
            <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
              업계 {company.industryRank}위
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
        {company.employeeCount > 0 && <span>종업원 {company.employeeCount.toLocaleString('ko-KR')}명</span>}
        <span>{date} 분석</span>
        <span>{FORMAT_LABEL[format] ?? format}</span>
      </div>
    </div>
  )
}

import type { AnalysisResult } from '@/types/analysis'
import { getDiagnosisColor } from '@/utils/format'

type DiagnosisSectionProps = {
  diagnosis: NonNullable<AnalysisResult['diagnosis']>
}

const ITEMS = [
  { key: 'growth', label: '성장성' },
  { key: 'profitability', label: '수익성' },
  { key: 'financialStructure', label: '재무구조' },
  { key: 'debtRepayment', label: '부채상환능력' },
  { key: 'activity', label: '활동성' },
] as const

export default function DiagnosisSection({ diagnosis }: DiagnosisSectionProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">재무진단 등급</h2>
      <div className="grid grid-cols-5 gap-2">
        {ITEMS.map(({ key, label }) => (
          <div key={key} className="text-center">
            <p className="text-xs text-gray-500">{label}</p>
            <p className={`text-sm font-medium mt-1 ${getDiagnosisColor(diagnosis[key])}`}>
              {diagnosis[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

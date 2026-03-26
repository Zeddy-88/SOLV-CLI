import type { AnalysisResult } from '@/types/analysis'
import { formatKRW, formatPercent } from '@/utils/format'

type FinancialTrendProps = {
  financials: AnalysisResult['financials']
}

type RowConfig = {
  label: string
  values: (number | null)[]
  format: (v: number) => string
  isNegativeGood: boolean
}

export default function FinancialTrend({ financials }: FinancialTrendProps) {
  const years = financials.years
  const last = years.length - 1

  const rows: RowConfig[] = [
    { label: '매출', values: financials.revenue, format: formatKRW, isNegativeGood: false },
    { label: '영업이익', values: financials.operatingProfit, format: formatKRW, isNegativeGood: false },
    { label: '당기순이익', values: financials.netIncome, format: formatKRW, isNegativeGood: false },
    { label: '영업이익률', values: financials.operatingMargin, format: (v) => formatPercent(v), isNegativeGood: false },
    { label: 'ROE', values: financials.roe, format: (v) => formatPercent(v), isNegativeGood: false },
    { label: '부채비율', values: financials.debtRatio, format: (v) => formatPercent(v), isNegativeGood: true },
  ]

  function getCellColor(row: RowConfig, colIdx: number): string {
    if (colIdx === 0) return ''
    const curr = row.values[colIdx]
    const prev = row.values[colIdx - 1]
    if (curr == null || prev == null) return ''
    const worsened = row.isNegativeGood ? curr > prev : curr < prev
    return worsened ? 'text-red-600' : ''
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">3개년 재무 추이</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-gray-500 font-medium pb-2 pr-3">항목</th>
              {years.map((y, i) => (
                <th
                  key={y}
                  className={`text-right pb-2 pl-3 ${i === last ? 'font-medium text-gray-900' : 'text-gray-500 font-normal'}`}
                >
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row) => (
              <tr key={row.label}>
                <td className="text-gray-500 py-2 pr-3">{row.label}</td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`text-right py-2 pl-3 ${getCellColor(row, i)} ${i === last ? 'font-medium' : ''}`}
                  >
                    {v != null ? row.format(v) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

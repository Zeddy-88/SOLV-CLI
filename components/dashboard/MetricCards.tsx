import type { AnalysisResult } from '@/types/analysis'
import { formatKRW, formatPercent, formatChange } from '@/utils/format'

type MetricCardsProps = {
  financials: AnalysisResult['financials']
}

type CardConfig = {
  label: string
  value: string
  change: string
  isNegativeGood: boolean
  changeValue: number
}

export default function MetricCards({ financials }: MetricCardsProps) {
  const last = financials.years.length - 1
  const prev = last - 1

  const revenueChange =
    prev >= 0 && financials.revenue[prev] !== 0
      ? ((financials.revenue[last] - financials.revenue[prev]) / Math.abs(financials.revenue[prev])) * 100
      : 0

  const netIncomeChange =
    prev >= 0 && financials.netIncome[prev] !== 0
      ? ((financials.netIncome[last] - financials.netIncome[prev]) / Math.abs(financials.netIncome[prev])) * 100
      : 0

  const operatingMarginChange =
    prev >= 0 ? financials.operatingMargin[last] - financials.operatingMargin[prev] : 0

  const debtRatioChange =
    prev >= 0 ? financials.debtRatio[last] - financials.debtRatio[prev] : 0

  const cards: CardConfig[] = [
    {
      label: '연 매출',
      value: formatKRW(financials.revenue[last]),
      change: formatChange(revenueChange),
      isNegativeGood: false,
      changeValue: revenueChange,
    },
    {
      label: '영업이익률',
      value: formatPercent(financials.operatingMargin[last]),
      change: formatChange(operatingMarginChange, '%p'),
      isNegativeGood: false,
      changeValue: operatingMarginChange,
    },
    {
      label: '당기순이익',
      value: formatKRW(financials.netIncome[last]),
      change: formatChange(netIncomeChange),
      isNegativeGood: false,
      changeValue: netIncomeChange,
    },
    {
      label: '부채비율',
      value: formatPercent(financials.debtRatio[last]),
      change: formatChange(debtRatioChange, '%p'),
      isNegativeGood: true,
      changeValue: debtRatioChange,
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((card) => {
        const isPositive = card.isNegativeGood ? card.changeValue < 0 : card.changeValue > 0
        const isNeutral = card.changeValue === 0
        const changeColor = isNeutral
          ? 'text-gray-400'
          : isPositive
          ? 'text-blue-600'
          : 'text-red-600'
        const arrow = isNeutral ? '' : isPositive ? '▲ ' : '▼ '

        return (
          <div key={card.label} className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-500">{card.label}</p>
            <p className="text-base font-medium mt-1">{card.value}</p>
            {prev >= 0 && (
              <p className={`text-xs mt-1 ${changeColor}`}>
                {arrow}{card.change} 전년 대비
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

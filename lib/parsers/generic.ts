import type { FinancialData } from '@/types/financial'

function extractYears(text: string): number[] {
  const found = new Set<number>()
  const pattern = /20(\d{2})년/g
  let match
  while ((match = pattern.exec(text)) !== null) {
    const year = 2000 + parseInt(match[1])
    if (year >= 2015 && year <= 2030) found.add(year)
  }
  const years = Array.from(found).sort()
  return years.length > 0 ? years : [new Date().getFullYear() - 1]
}

function extractCompanyName(text: string): string {
  const patterns = [
    /상호명?\s*[:\s]+([^\n\r]+)/,
    /기업명\s*[:\s]+([^\n\r]+)/,
    /회사명\s*[:\s]+([^\n\r]+)/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim()
  }
  return '기업명 미확인'
}

function extractTableRow(text: string, label: string): number[] {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}[\\s\\S]{0,50}?([\\d,]+(?:\\.\\d+)?)\\s+([\\d,]+(?:\\.\\d+)?)`)
  const match = text.match(pattern)
  if (match) {
    return [match[1], match[2]].map(v => parseFloat(v.replace(/,/g, '')) || 0)
  }
  return [0]
}

export function parseGeneric(text: string): FinancialData {
  const years = extractYears(text)

  const tryExtract = (labels: string[]) => {
    for (const label of labels) {
      const result = extractTableRow(text, label)
      if (result.some(v => v > 0)) return result
    }
    return Array(years.length).fill(0)
  }

  const revenue = tryExtract(['매출액', '매출'])
  const operatingProfit = tryExtract(['영업이익'])
  const netIncome = tryExtract(['당기순이익', '순이익'])
  const totalAssets = tryExtract(['자산총계', '총자산'])
  const totalDebt = tryExtract(['부채총계', '총부채'])
  const equity = tryExtract(['자본총계', '총자본'])

  const operatingMargin = revenue.map((r, i) =>
    r > 0 ? Math.round((operatingProfit[i] / r) * 1000) / 10 : 0
  )
  const debtRatio = equity.map((e, i) =>
    e > 0 ? Math.round((totalDebt[i] / e) * 1000) / 10 : 0
  )

  return {
    format: 'generic',
    company: {
      name: extractCompanyName(text),
    },
    financials: {
      years,
      revenue,
      operatingProfit,
      netIncome,
      totalAssets,
      totalDebt,
      equity,
      operatingMargin,
      debtRatio,
      roe: [],
      roa: [],
      interestCoverage: [],
    },
    rawText: text,
  }
}

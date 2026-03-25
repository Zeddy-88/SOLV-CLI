import type { FinancialData } from '@/types/financial'

function extractYears(text: string): number[] {
  const patterns = [/20(\d{2})년/g, /20(\d{2})\.12/g]
  const found = new Set<number>()
  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(text)) !== null) {
      const year = 2000 + parseInt(match[1])
      if (year >= 2015 && year <= 2030) found.add(year)
    }
  }
  return Array.from(found).sort()
}

function extractCompanyName(text: string): string {
  const patterns = [
    /기업명\s*[:\s]+([^\n\r]+)/,
    /상호\s*[:\s]+([^\n\r]+)/,
    /\(주\)\s*([가-힣a-zA-Z0-9\s]+)/,
    /주식회사\s+([가-힣a-zA-Z0-9\s]+)/,
  ]
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) return match[1].trim().replace(/\s+/g, ' ')
  }
  return '기업명 미확인'
}

function extractBizNumber(text: string): string | undefined {
  const match = text.match(/사업자\s*(?:등록)?번호\s*[:\s]*(\d{3}-\d{2}-\d{5})/)
  return match?.[1]
}

function extractCeo(text: string): string | undefined {
  const match = text.match(/대표(?:자|이사)?\s*[:\s]+([가-힣]{2,5})\s/)
  return match?.[1]
}

function extractIndustry(text: string): string | undefined {
  const match = text.match(/(?:주요\s*)?업종\s*[:\s]+([^\n\r]+)/)
  if (match?.[1]) return match[1].trim()
  return undefined
}

function extractEmployeeCount(text: string): number | undefined {
  const match = text.match(/종업원\s*수?\s*[:\s]*(\d{1,5})\s*명/)
  if (match?.[1]) return parseInt(match[1])
  return undefined
}

// NICE 기업평가등급 추출 (최신 등급)
function extractCreditGrade(text: string): string | undefined {
  // "기업평가등급 BBB+" 또는 등급이력 테이블에서 최신 값
  const match = text.match(/기업평가등급\s*[:\s]*([A-Da-d][A-Za-z+\-]*)/)
  if (match?.[1]) return match[1]
  // 등급이력에서 가장 마지막 등급
  const gradeHistory = [...text.matchAll(/([A-D][+\-]?)\s+(?:20\d{2})/g)]
  if (gradeHistory.length > 0) return gradeHistory[gradeHistory.length - 1][1]
  return undefined
}

// WATCH 등급
function extractWatchStatus(text: string): string | undefined {
  const match = text.match(/WATCH\s*[:\s]*([^\n\r]+)/)
  if (match?.[1]) return match[1].trim()
  if (text.includes('WATCH-') || text.includes('Watch-')) return 'Watch-'
  if (text.includes('WATCH+') || text.includes('Watch+')) return 'Watch+'
  return undefined
}

function detectUnit(text: string): 'million' | 'billion' {
  if (text.includes('(단위: 억원)') || text.includes('단위:억원') || text.includes('단위 : 억원')) {
    return 'billion'
  }
  return 'million'
}

function extractTableRow(text: string, label: string): number[] {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}[\\s\\S]{0,50}?([\\d,]+(?:\\.\\d+)?)\\s+([\\d,]+(?:\\.\\d+)?)\\s+([\\d,]+(?:\\.\\d+)?)`)
  const match = text.match(pattern)
  if (match) {
    return [match[1], match[2], match[3]].map(v => parseFloat(v.replace(/,/g, '')) || 0)
  }
  return []
}

function extractRatio(text: string, label: string): number[] {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}[\\s\\S]{0,50}?(-?[\\d.]+)\\s+(-?[\\d.]+)\\s+(-?[\\d.]+)`)
  const match = text.match(pattern)
  if (match) {
    return [match[1], match[2], match[3]].map(v => parseFloat(v) || 0)
  }
  return []
}

function extractDiagnosis(text: string): FinancialData['diagnosis'] {
  if (!text.includes('재무진단') && !text.includes('진단등급')) return undefined

  function findGrade(section: string): string {
    const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`${escaped}[\\s\\S]{0,20}?(양호|보통이하|보통|열위|우수)`)
    const match = text.match(pattern)
    return match?.[1] ?? '보통'
  }

  return {
    growth: findGrade('성장성'),
    profitability: findGrade('수익성'),
    financialStructure: findGrade('재무구조'),
    debtRepayment: findGrade('부채상환'),
    activity: findGrade('활동성'),
  }
}

function extractIndustryComparison(text: string): FinancialData['industryComparison'] {
  // NICE 산업평균 / 한은평균 섹션
  const opMarginMatch = text.match(/(?:산업|업종)\s*평균.*?영업이익률[:\s]*(-?[\d.]+)/)
  const debtRatioMatch = text.match(/(?:산업|업종)\s*평균.*?부채비율[:\s]*(-?[\d.]+)/)
  const roaMatch = text.match(/(?:산업|업종)\s*평균.*?ROA[:\s]*(-?[\d.]+)/i)

  if (!opMarginMatch && !debtRatioMatch && !roaMatch) return undefined

  return {
    operatingMarginAvg: parseFloat(opMarginMatch?.[1] ?? '0'),
    debtRatioAvg: parseFloat(debtRatioMatch?.[1] ?? '0'),
    roaAvg: parseFloat(roaMatch?.[1] ?? '0'),
  }
}

export function parseNice(text: string): FinancialData {
  const unit = detectUnit(text)
  const years = extractYears(text)

  function tryExtract(labels: string[]): number[] {
    for (const label of labels) {
      const result = extractTableRow(text, label)
      if (result.length > 0) return result
    }
    return []
  }

  const rawRevenue = tryExtract(['매출액', '매출'])
  const rawOpProfit = tryExtract(['영업이익'])
  const rawNetIncome = tryExtract(['당기순이익', '순이익'])
  const rawTotalAssets = tryExtract(['자산총계', '총자산'])
  const rawTotalDebt = tryExtract(['부채총계', '총부채'])
  const rawEquity = tryExtract(['자본총계', '총자본'])

  const toMillion = (arr: number[]) =>
    arr.map(v => unit === 'billion' ? Math.round(v * 100) : Math.round(v))

  const revenue = toMillion(rawRevenue)
  const operatingProfit = toMillion(rawOpProfit)
  const netIncome = toMillion(rawNetIncome)
  const totalAssets = toMillion(rawTotalAssets)
  const totalDebt = toMillion(rawTotalDebt)
  const equity = toMillion(rawEquity)

  const opMarginRaw = extractRatio(text, '영업이익률')
  const operatingMargin = opMarginRaw.length > 0
    ? opMarginRaw
    : revenue.map((r, i) => r > 0 ? Math.round((operatingProfit[i] / r) * 1000) / 10 : 0)

  const debtRatioRaw = extractRatio(text, '부채비율')
  const debtRatio = debtRatioRaw.length > 0
    ? debtRatioRaw
    : equity.map((e, i) => e > 0 ? Math.round((totalDebt[i] / e) * 1000) / 10 : 0)

  const roe = extractRatio(text, 'ROE').length > 0
    ? extractRatio(text, 'ROE')
    : extractRatio(text, '자기자본이익률')

  const roa = extractRatio(text, 'ROA').length > 0
    ? extractRatio(text, 'ROA')
    : extractRatio(text, '총자산이익률')

  const interestCoverage = extractRatio(text, '이자보상배수')

  const dataLen = Math.max(revenue.length, operatingProfit.length, 1)
  const finalYears = years.length >= dataLen
    ? years.slice(-dataLen)
    : Array.from({ length: dataLen }, (_, i) => new Date().getFullYear() - (dataLen - 1 - i))

  return {
    format: 'nice',
    company: {
      name: extractCompanyName(text),
      bizNumber: extractBizNumber(text),
      ceo: extractCeo(text),
      industry: extractIndustry(text),
      employeeCount: extractEmployeeCount(text),
      creditGrade: extractCreditGrade(text),
      watchStatus: extractWatchStatus(text),
    },
    financials: {
      years: finalYears,
      revenue,
      operatingProfit,
      netIncome,
      totalAssets,
      totalDebt,
      equity,
      operatingMargin,
      debtRatio,
      roe,
      roa,
      interestCoverage,
    },
    diagnosis: extractDiagnosis(text),
    industryComparison: extractIndustryComparison(text),
    rawText: text,
  }
}

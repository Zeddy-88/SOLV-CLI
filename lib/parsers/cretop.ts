import type { FinancialData } from '@/types/financial'

// 텍스트에서 연도 추출 (20XX년 또는 20XX.12 패턴)
function extractYears(text: string): number[] {
  const patterns = [
    /20(\d{2})년/g,
    /20(\d{2})\.12/g,
    /20(\d{2})\s*\(결산\)/g,
  ]
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
    /상호명?\s*[:\s]+([^\n\r]+)/,
    /기업명\s*[:\s]+([^\n\r]+)/,
    /회사명\s*[:\s]+([^\n\r]+)/,
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

function extractCreditGrade(text: string): string | undefined {
  // CRETOP 신용등급 패턴: BBB+, BB-, A, B 등
  const match = text.match(/신용\s*(?:평가\s*)?등급\s*[:\s]*([A-Da-d][A-Za-z+\-]*)/)
  return match?.[1]
}

function extractIndustryRank(text: string): number | undefined {
  const match = text.match(/업계\s*순위\s*[:\s]*(\d+)\s*위/)
  if (match?.[1]) return parseInt(match[1])
  return undefined
}

// 단위 감지 (백만원 / 억원)
function detectUnit(text: string): 'million' | 'billion' {
  if (text.includes('(단위: 억원)') || text.includes('단위:억원') || text.includes('단위 : 억원')) {
    return 'billion'
  }
  return 'million'
}

// 재무 테이블에서 행 데이터 추출
function extractTableRow(text: string, label: string): number[] {
  // "매출액 1,234 2,345 3,456" 패턴
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}[\\s\\S]{0,50}?([\\d,]+(?:\\.\\d+)?)\\s+([\\d,]+(?:\\.\\d+)?)\\s+([\\d,]+(?:\\.\\d+)?)`)
  const match = text.match(pattern)
  if (match) {
    return [match[1], match[2], match[3]].map(v => parseFloat(v.replace(/,/g, '')) || 0)
  }
  return []
}

// 재무비율 추출
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
  const grades = ['양호', '보통이하', '보통', '열위', '우수']

  function findGrade(section: string): string {
    for (const grade of grades) {
      if (text.includes(section + grade) || text.includes(section + ' ' + grade)) {
        return grade
      }
    }
    // 섹션 주변 텍스트에서 등급 검색
    const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const pattern = new RegExp(`${escaped}[\\s\\S]{0,20}?(양호|보통이하|보통|열위|우수)`)
    const match = text.match(pattern)
    return match?.[1] ?? '보통'
  }

  if (!text.includes('재무진단') && !text.includes('진단등급')) return undefined

  return {
    growth: findGrade('성장성'),
    profitability: findGrade('수익성'),
    financialStructure: findGrade('재무구조'),
    debtRepayment: findGrade('부채상환'),
    activity: findGrade('활동성'),
  }
}

export function parseCretop(text: string): FinancialData {
  const unit = detectUnit(text)
  const years = extractYears(text)

  // 재무 데이터 추출 (여러 표기 시도)
  const revenueLabels = ['매출액', '매출']
  const opProfitLabels = ['영업이익', '영업 이익']
  const netIncomeLabels = ['당기순이익', '순이익']
  const totalAssetsLabels = ['자산총계', '총자산', '자산 총계']
  const totalDebtLabels = ['부채총계', '총부채', '부채 총계']
  const equityLabels = ['자본총계', '총자본', '자본 총계']

  function tryExtract(labels: string[]): number[] {
    for (const label of labels) {
      const result = extractTableRow(text, label)
      if (result.length > 0) return result
    }
    return []
  }

  const rawRevenue = tryExtract(revenueLabels)
  const rawOpProfit = tryExtract(opProfitLabels)
  const rawNetIncome = tryExtract(netIncomeLabels)
  const rawTotalAssets = tryExtract(totalAssetsLabels)
  const rawTotalDebt = tryExtract(totalDebtLabels)
  const rawEquity = tryExtract(equityLabels)

  const toMillion = (arr: number[]) =>
    arr.map(v => unit === 'billion' ? Math.round(v * 100) : Math.round(v))

  const revenue = toMillion(rawRevenue)
  const operatingProfit = toMillion(rawOpProfit)
  const netIncome = toMillion(rawNetIncome)
  const totalAssets = toMillion(rawTotalAssets)
  const totalDebt = toMillion(rawTotalDebt)
  const equity = toMillion(rawEquity)

  // 영업이익률 계산 또는 추출
  const opMarginRaw = extractRatio(text, '영업이익률')
  const operatingMargin = opMarginRaw.length > 0
    ? opMarginRaw
    : revenue.map((r, i) => r > 0 ? Math.round((operatingProfit[i] / r) * 1000) / 10 : 0)

  // 부채비율
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

  // 연도 보정: 추출된 값 배열 길이에 맞춤
  const dataLen = Math.max(revenue.length, operatingProfit.length, 1)
  const finalYears = years.length >= dataLen
    ? years.slice(-dataLen)
    : Array.from({ length: dataLen }, (_, i) => new Date().getFullYear() - (dataLen - 1 - i))

  return {
    format: 'cretop',
    company: {
      name: extractCompanyName(text),
      bizNumber: extractBizNumber(text),
      ceo: extractCeo(text),
      industry: extractIndustry(text),
      employeeCount: extractEmployeeCount(text),
      creditGrade: extractCreditGrade(text),
      industryRank: extractIndustryRank(text),
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
    rawText: text,
  }
}

export type PdfFormat = 'cretop' | 'nice' | 'generic'

export type FinancialData = {
  format: PdfFormat
  company: {
    name: string
    bizNumber?: string
    ceo?: string
    industry?: string
    address?: string
    employeeCount?: number
    foundedYear?: number
    creditGrade?: string       // 신용등급 (예: BBB-, bb)
    industryRank?: number      // 업계 순위
    watchStatus?: string       // NICE 전용 (예: 정상)
  }
  financials: {
    years: number[]            // [2022, 2023, 2024]
    revenue: number[]          // 매출액 (백만원)
    operatingProfit: number[]
    netIncome: number[]
    totalAssets: number[]
    totalDebt: number[]
    equity: number[]
    operatingMargin: number[]  // 영업이익률 (%)
    debtRatio: number[]        // 부채비율 (%)
    roe: number[]
    roa: number[]
    interestCoverage: number[]
  }
  diagnosis?: {
    growth: string
    profitability: string
    financialStructure: string
    debtRepayment: string
    activity: string
  }
  industryComparison?: {
    operatingMarginAvg: number
    debtRatioAvg: number
    roaAvg: number
  }
  rawText: string
}

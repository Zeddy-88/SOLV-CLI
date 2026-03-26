export type AnalysisStatus = 'pending' | 'processing' | 'done' | 'error'

export type PersonaOpinion = {
  name: string       // 예: "재무 컨설턴트"
  role: string       // 예: "숫자 뒤의 진짜 의미를 읽는다"
  opinion: string    // 3~5문장
  keyPoint: string   // 한 줄 핵심 메시지
}

export type AnalysisResult = {
  company: {
    name: string
    bizNumber: string
    ceo: string
    industry: string
    address: string
    employeeCount: number
    foundedYear: number
    creditGrade?: string
    industryRank?: number
  }

  financials: {
    years: number[]
    revenue: number[]
    operatingProfit: number[]
    netIncome: number[]
    totalAssets: number[]
    totalDebt: number[]
    equity: number[]
    operatingMargin: number[]
    debtRatio: number[]
    roe: number[]
    roa: number[]
    interestCoverage: number[]
  }

  diagnosis: {
    growth: string
    profitability: string
    financialStructure: string
    debtRepayment: string
    activity: string
  } | null

  industryComparison: {
    operatingMarginAvg: number
    debtRatioAvg: number
    roaAvg: number
  } | null

  summary: string

  issues: Array<{
    severity: 'critical' | 'warning'
    title: string
    description: string
    metric?: string
    value?: string
  }>

  strengths: Array<{
    title: string
    description: string
  }>

  salesScripts: {
    opening: string
    problemDetail: string
    urgency: string
    closing: string
  }

  personas: {
    financialConsultant: PersonaOpinion
    salesExpert: PersonaOpinion
    communicationExpert: PersonaOpinion
    psychologist: PersonaOpinion
    integrated: string
  }
}

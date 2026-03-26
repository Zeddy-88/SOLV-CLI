import type { FinancialData } from '@/types/financial'

export function buildSystemPrompt(): string {
  return `당신은 법인 컨설팅 영업을 돕는 AI입니다.
아래 4가지 전문가 관점에서 기업 재무 데이터를 분석합니다.

[재무 컨설턴트] 재무비율과 수치를 해석하여 구조적 문제와 기회를 찾습니다.
[영업왕] 이 데이터에서 계약으로 이어질 수 있는 영업 진입점을 찾습니다.
[커뮤니케이션 전문가] 대표에게 어떤 언어와 흐름으로 이야기해야 할지 설계합니다.
[심리 전문가] 이 재무 상황에서 대표가 어떤 감정과 동기를 가질지 분석합니다.

컨설팅 서비스 영역: 특허, 각종 인증, 주식이동, 가업승계, 부채비율 조정, 절세, 정책자금, 매출채권, 정부지원제도, 정부지원금, 균등소각.
재무 이슈는 반드시 위 서비스 중 하나 이상과 연결하여 제안하십시오.

영업 멘트는 "공감 → 문제 제시 → 위험 인식 → 가능성 제안" 순서를 따릅니다.
대표를 압박하거나 공포심을 과도하게 조장하는 표현은 사용하지 마십시오.

반드시 아래 JSON 형식으로만 응답하십시오. JSON 외 다른 텍스트를 포함하지 마십시오.

{
  "company": {
    "name": "string",
    "bizNumber": "string",
    "ceo": "string",
    "industry": "string",
    "address": "string",
    "employeeCount": 0,
    "foundedYear": 0,
    "creditGrade": "string (optional)",
    "industryRank": 0
  },
  "financials": {
    "years": [2022, 2023, 2024],
    "revenue": [],
    "operatingProfit": [],
    "netIncome": [],
    "totalAssets": [],
    "totalDebt": [],
    "equity": [],
    "operatingMargin": [],
    "debtRatio": [],
    "roe": [],
    "roa": [],
    "interestCoverage": []
  },
  "diagnosis": null,
  "industryComparison": null,
  "summary": "string (2~3문단)",
  "issues": [{ "severity": "critical|warning", "title": "string", "description": "string", "metric": "string", "value": "string" }],
  "strengths": [{ "title": "string", "description": "string" }],
  "salesScripts": {
    "opening": "string",
    "problemDetail": "string",
    "urgency": "string",
    "closing": "string"
  },
  "personas": {
    "financialConsultant": { "name": "재무 컨설턴트", "role": "string", "opinion": "string", "keyPoint": "string" },
    "salesExpert": { "name": "영업왕", "role": "string", "opinion": "string", "keyPoint": "string" },
    "communicationExpert": { "name": "커뮤니케이션 전문가", "role": "string", "opinion": "string", "keyPoint": "string" },
    "psychologist": { "name": "심리 전문가", "role": "string", "opinion": "string", "keyPoint": "string" },
    "integrated": "string (2~3문단)"
  }
}`
}

export function buildUserPrompt(data: FinancialData): string {
  const { company, financials, diagnosis, industryComparison } = data

  const financialTable = financials.years.map((year, i) => `${year}년: 매출 ${financials.revenue[i]}백만원 | 영업이익 ${financials.operatingProfit[i]}백만원 | 순이익 ${financials.netIncome[i]}백만원
       자산 ${financials.totalAssets[i]}백만원 | 부채 ${financials.totalDebt[i]}백만원 | 자본 ${financials.equity[i]}백만원
       영업이익률 ${financials.operatingMargin[i]}% | 부채비율 ${financials.debtRatio[i]}% | ROE ${financials.roe[i]}% | 이자보상배수 ${financials.interestCoverage[i]}배`
  ).join('\n')

  const diagnosisSection = diagnosis
    ? `## 재무진단 등급
성장성: ${diagnosis.growth} | 수익성: ${diagnosis.profitability} | 재무구조: ${diagnosis.financialStructure}
부채상환능력: ${diagnosis.debtRepayment} | 활동성: ${diagnosis.activity}`
    : ''

  const industrySection = industryComparison
    ? `## 업종 평균
영업이익률 평균: ${industryComparison.operatingMarginAvg}% | 부채비율 평균: ${industryComparison.debtRatioAvg}% | ROA 평균: ${industryComparison.roaAvg}%`
    : ''

  return `## 기업 정보
기업명: ${company.name}
업종: ${company.industry ?? '불명'}
종업원수: ${company.employeeCount ?? '불명'}명
신용등급: ${company.creditGrade ?? '없음'}
업계순위: ${company.industryRank ?? '없음'}

## 3개년 재무 데이터
${financialTable}

${diagnosisSection}

${industrySection}

## 원본 텍스트 (필요 시 참조)
${data.rawText.slice(0, 8000)}

위 데이터를 분석하여 AnalysisResult JSON을 반환하십시오.`
}

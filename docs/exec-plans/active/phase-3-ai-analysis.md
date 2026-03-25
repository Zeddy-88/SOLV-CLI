# Phase 3 — AI 분석

- 시작일: -
- 목표 완료일: -
- 담당: 에이전트
- 상태: 대기

---

## 목표

파싱된 재무 데이터를 Claude API로 분석하고 `AnalysisResult` JSON을 DB에 저장.
업로드 화면에서 실시간 진행 상태를 표시하고, 완료 시 `/dashboard/[id]`로 자동 이동.

---

## 전제 조건

- [ ] Phase 2 완료 (업로드, 파싱, analyses 테이블 정상 동작)
- [ ] `.env.local`에 `ANTHROPIC_API_KEY` 입력 완료

---

## 작업 목록

### T1. Anthropic SDK 설치

```bash
npm install @anthropic-ai/sdk
```

---

### T2. AnalysisResult 타입 정의

`types/analysis.ts`

```typescript
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

  summary: string   // 회사 히스토리 및 현황 요약 (2~3문단)

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
    integrated: string   // 4인 통합 의견 (2~3문단)
  }
}
```

---

### T3. Claude 시스템 프롬프트

`lib/claude/prompts.ts`

프롬프트 구성 원칙 (`AGENTS.md`, `docs/design-docs/core-beliefs.md` 참조):
- 단일 호출로 4개 페르소나 + 통합 의견 + 영업 멘트 생성
- 반드시 JSON으로만 응답하도록 명시
- 재무 이슈는 반드시 컨설팅 서비스 제안으로 연결
- 강압적·공포심 유발 표현 지양 명시

```typescript
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

반드시 아래 JSON 형식으로만 응답하십시오. JSON 외 다른 텍스트를 포함하지 마십시오.`
}

export function buildUserPrompt(data: FinancialData): string {
  const { company, financials, diagnosis, industryComparison } = data

  const financialTable = financials.years.map((year, i) => `
${year}년: 매출 ${financials.revenue[i]}백만원 | 영업이익 ${financials.operatingProfit[i]}백만원 | 순이익 ${financials.netIncome[i]}백만원
       자산 ${financials.totalAssets[i]}백만원 | 부채 ${financials.totalDebt[i]}백만원 | 자본 ${financials.equity[i]}백만원
       영업이익률 ${financials.operatingMargin[i]}% | 부채비율 ${financials.debtRatio[i]}% | ROE ${financials.roe[i]}% | 이자보상배수 ${financials.interestCoverage[i]}배`
  ).join('\n')

  return `## 기업 정보
기업명: ${company.name}
업종: ${company.industry ?? '불명'}
종업원수: ${company.employeeCount ?? '불명'}명
신용등급: ${company.creditGrade ?? '없음'}
업계순위: ${company.industryRank ?? '없음'}

## 3개년 재무 데이터
${financialTable}

${diagnosis ? `## 재무진단 등급
성장성: ${diagnosis.growth} | 수익성: ${diagnosis.profitability} | 재무구조: ${diagnosis.financialStructure}
부채상환능력: ${diagnosis.debtRepayment} | 활동성: ${diagnosis.activity}` : ''}

${industryComparison ? `## 업종 평균
영업이익률 평균: ${industryComparison.operatingMarginAvg}% | 부채비율 평균: ${industryComparison.debtRatioAvg}% | ROA 평균: ${industryComparison.roaAvg}%` : ''}

## 원본 텍스트 (필요 시 참조)
${data.rawText.slice(0, 8000)}

위 데이터를 분석하여 AnalysisResult JSON을 반환하십시오.`
}
```

---

### T4. 재시도 로직

`lib/claude/retry.ts`

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2
): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < maxRetries) {
        // 재시도 전 잠깐 대기
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }
  throw lastError
}
```

---

### T5. /api/analyze 라우트

`app/api/analyze/route.ts`

```typescript
export const maxDuration = 60  // Vercel Pro 필요
```

처리 흐름:
1. 세션 검증
2. `analysisId`로 analyses 레코드 조회 (user_id 조건 포함)
3. `status: 'processing'`으로 업데이트
4. Supabase Storage에서 PDF 다운로드
5. `parseReport(buffer)` 호출 → `FinancialData`
6. `pdf_format` 업데이트
7. Claude API 호출 (withRetry 사용):
   - `model`: `claude-sonnet-4-6` (또는 최신 Sonnet)
   - `max_tokens`: 4096
   - `system`: `buildSystemPrompt()`
   - `messages`: `[{ role: 'user', content: buildUserPrompt(financialData) }]`
8. 응답 텍스트에서 JSON 파싱 → `AnalysisResult` 타입 검증
9. `status: 'done'`, `analysis_result: result` 저장
10. 실패 시 `status: 'error'`, `error_message` 저장

JSON 파싱 방법:
```typescript
// Claude가 코드 블록으로 감싸는 경우 처리
const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/)
                  ?? content.match(/\{[\s\S]*\}/)
if (!jsonMatch) throw new Error('JSON 파싱 실패')
const result = JSON.parse(jsonMatch[1] ?? jsonMatch[0]) as AnalysisResult
```

---

### T6. Realtime 구독 훅

`hooks/useAnalysisStatus.ts` (`'use client'` 전제)

```typescript
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AnalysisStatus } from '@/types/analysis'

export function useAnalysisStatus(analysisId: string) {
  const [status, setStatus] = useState<AnalysisStatus>('pending')

  useEffect(() => {
    const supabase = createClient()

    // 초기 상태 조회
    supabase
      .from('analyses')
      .select('status')
      .eq('id', analysisId)
      .single()
      .then(({ data }) => {
        if (data) setStatus(data.status as AnalysisStatus)
      })

    // Realtime 구독
    const channel = supabase
      .channel(`analysis-${analysisId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'analyses',
        filter: `id=eq.${analysisId}`,
      }, (payload) => {
        setStatus(payload.new.status as AnalysisStatus)
      })
      .subscribe()

    // Realtime 실패 시 폴백: 5초 간격 폴링
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('analyses')
        .select('status')
        .eq('id', analysisId)
        .single()
      if (data) setStatus(data.status as AnalysisStatus)
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [analysisId])

  return status
}
```

---

### T7. 업로드 화면 실시간 상태 연동

`components/upload/AnalysisProgress.tsx` (`'use client'`)

업로드 완료 후 `analysisId`를 받아 실시간 상태를 표시하는 컴포넌트.

```
pending     → "파일을 업로드하고 있어요..."
processing  → "AI가 분석하고 있어요. 잠깐만 기다려주세요." + 프로그레스 인디케이터
done        → router.push('/dashboard/{analysisId}') 자동 이동
error       → "분석 중 문제가 발생했어요." + "다시 시도" 버튼
```

`app/page.tsx`에서 업로드 완료 시 `AnalysisProgress` 렌더링.

---

## 완료 기준 체크리스트

```
[ ] CRETOP PDF 업로드 후 60초 이내 analysis_result JSON DB 저장 확인
[ ] NICE BizLine PDF 업로드 후 60초 이내 동일 확인
[ ] 분석 완료 시 /dashboard/{id}로 자동 이동 확인
[ ] 업로드 화면에서 pending → processing → done 상태 변화 표시 확인
[ ] analysis_result에 summary, issues(1개 이상), salesScripts, personas 포함 확인
[ ] Claude 응답 JSON 파싱 실패 시 status: error 저장 확인
[ ] analyses 테이블에 user_id 조건 포함 조회 확인 (코드 리뷰)
[ ] ANTHROPIC_API_KEY 클라이언트 번들에 미포함 확인 (NEXT_PUBLIC_ 없음)
[ ] npx tsc --noEmit → 에러 0개
```

---

## 완료 후

이 파일을 `docs/exec-plans/completed/` 로 이동.
`docs/PLANS.md`의 Phase 3 상태를 `✅ 완료`로 업데이트.
다음: `docs/exec-plans/active/phase-4-dashboard.md`

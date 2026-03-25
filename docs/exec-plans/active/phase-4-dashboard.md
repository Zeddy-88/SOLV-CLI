# Phase 4 — 브리핑 화면

- 시작일: -
- 목표 완료일: -
- 담당: 에이전트
- 상태: 대기

---

## 목표

영업사원이 분석 결과를 한눈에 파악하고 영업 멘트를 확인·복사할 수 있는 브리핑 화면 완성.
모든 섹션이 정상 렌더링되고, 데이터 없는 섹션은 자동으로 숨겨진다.

---

## 전제 조건

- [ ] Phase 3 완료 (AnalysisResult JSON이 DB에 저장됨)
- [ ] `types/analysis.ts`의 `AnalysisResult` 타입 완성

---

## 참조 문서

화면 스펙 상세: `docs/product-specs/analysis-dashboard.md`
디자인 규칙: `docs/DESIGN.md`
프론트엔드 컨벤션: `docs/FRONTEND.md`

---

## 작업 목록

### T1. 유틸 함수

`utils/format.ts`

```typescript
// 매출, 자산 등 큰 금액 (입력: 백만원)
export function formatKRW(millions: number): string {
  if (millions >= 10000) return `${(millions / 10000).toFixed(1)}억 원`
  return `${millions.toLocaleString('ko-KR')}백만 원`
}

// 퍼센트
export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

// 전년 대비 증감 (부호 포함)
export function formatChange(value: number, unit = '%'): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}${unit}`
}

// 등급 → 색상 클래스 반환
export function getDiagnosisColor(grade: string): string {
  if (['우수', '양호'].includes(grade)) return 'text-green-700'
  if (['보통'].includes(grade)) return 'text-amber-700'
  return 'text-red-700'  // 보통이하, 열위
}
```

---

### T2. 페이지 라우트 및 데이터 fetching

`app/dashboard/[id]/page.tsx` (서버 컴포넌트)

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardView from '@/components/dashboard/DashboardView'
import AnalysisLoading from '@/components/dashboard/AnalysisLoading'

export default async function DashboardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user!.id)   // 반드시 user_id 조건 포함
    .single()

  if (!analysis) notFound()

  // 분석 진행 중이면 로딩 화면 (클라이언트 컴포넌트로 Realtime 구독)
  if (analysis.status !== 'done') {
    return <AnalysisLoading analysisId={params.id} initialStatus={analysis.status} />
  }

  return <DashboardView analysis={analysis} />
}
```

`app/dashboard/[id]/not-found.tsx` — 존재하지 않는 분석에 대한 404 페이지

---

### T3. 분석 로딩 화면

`components/dashboard/AnalysisLoading.tsx` (`'use client'`)

- `useAnalysisStatus` 훅으로 실시간 상태 구독
- 상태별 메시지 (`docs/product-specs/analysis-dashboard.md` T3 로딩 상태 참조)
- `done`이 되면 `router.refresh()` 호출 → 서버 컴포넌트 재실행 → DashboardView 렌더링
- `error`이면 오류 메시지 + "다시 시도" 버튼

---

### T4. 회사 헤더

`components/dashboard/CompanyHeader.tsx`

props: `company: AnalysisResult['company']`, `format: string`, `createdAt: string`

표시 요소:
- 기업명 (18px font-medium)
- 업종 (13px text-gray-500)
- 종업원수
- 신용등급 배지 — `creditGrade`가 있을 때만 렌더링
- 업계 순위 배지 — `industryRank`가 있을 때만 렌더링
- 분석 기준일
- 보고서 출처 (CRETOP / NICE BizLine / 일반 재무제표)

배지 스타일: `rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700`

---

### T5. 핵심 지표 카드

`components/dashboard/MetricCards.tsx`

4개 카드를 `grid grid-cols-4 gap-3`으로 배열.

각 카드:
- 지표명 (12px text-gray-500)
- 수치 (크게, 15px font-medium)
- 전년 대비 증감: `formatChange()` + 방향 화살표
  - 증가: `text-blue-600` (▲)
  - 감소: `text-red-600` (▼)
  - 부채비율은 증가가 나쁨 → 반전 처리

카드 4개:
1. 연 매출 — `formatKRW(revenue[last])`
2. 영업이익률 — `formatPercent(operatingMargin[last])`
3. 당기순이익 — `formatKRW(netIncome[last])`
4. 부채비율 — `formatPercent(debtRatio[last])` (증가 = 빨강)

---

### T6. 3개년 재무 추이 테이블

`components/dashboard/FinancialTrend.tsx`

```
| 항목        | 2022   | 2023   | 2024 (최신, bold) |
|-------------|--------|--------|-------------------|
| 매출 (억원) |        |        |                   |
| 영업이익    |        |        |                   |
| 당기순이익  |        |        |                   |
| 영업이익률  |        |        |                   |
| ROE         |        |        |                   |
| 부채비율    |        |        |                   |
```

- 최신 연도 컬럼: `font-medium`
- 전년 대비 악화된 수치: `text-red-600`
  - 매출, 영업이익, 순이익, 영업이익률, ROE → 감소 시 빨강
  - 부채비율 → 증가 시 빨강

---

### T7. 재무진단 등급

`components/dashboard/DiagnosisSection.tsx`

props: `diagnosis: AnalysisResult['diagnosis']`

`diagnosis`가 `null`이면 이 컴포넌트를 렌더링하지 않는다 (부모에서 조건부 렌더링).

5개 항목을 `grid grid-cols-5 gap-2`로 배열:
- 성장성 / 수익성 / 재무구조 / 부채상환능력 / 활동성
- 항목명 (12px) + 등급 텍스트 (`getDiagnosisColor(grade)`)

---

### T8. 핵심 이슈 리스트

`components/dashboard/IssuesList.tsx`

props: `issues: AnalysisResult['issues']`

이슈 0개: "특별한 위험 이슈가 발견되지 않았습니다." 안내 메시지

이슈 카드 스타일 (`docs/DESIGN.md` 이슈 카드 참조):
- `critical`: `border-l-4 border-red-400 bg-red-50 px-4 py-3`
- `warning`: `border-l-4 border-amber-400 bg-amber-50 px-4 py-3`
- 제목 (14px font-medium) + 설명 (13px)

---

### T9. 4인 전문가 분석

`components/dashboard/PersonasSection.tsx`

props: `personas: AnalysisResult['personas']`

상단 2×2 그리드: 개별 의견 카드 4개
- 페르소나 아이콘 원 (SVG 인라인) + 이름
- 역할 한 줄 (12px text-gray-500)
- 의견 본문 (13px)
- 핵심 메시지 (14px font-medium, 카드 하단)

페르소나별 배경색 (`docs/DESIGN.md` 페르소나 색상 참조):
- 재무 컨설턴트: `bg-blue-50`
- 영업왕: `bg-green-50`
- 커뮤니케이션 전문가: `bg-purple-50`
- 심리 전문가: `bg-amber-50`

하단 통합 의견:
- 구분선 (`border-t my-4`)
- 제목: "4인 전문가 통합 의견"
- 본문: `bg-gray-50 rounded-lg p-4 text-sm`

---

### T10. 영업 추천 멘트

`components/dashboard/SalesScripts.tsx` (`'use client'`, 복사 기능 필요)

props: `salesScripts: AnalysisResult['salesScripts']`

4단계 카드:

| 단계 | 키 | 태그 |
|------|-----|------|
| 1단계 | opening | 오프닝 |
| 2단계 | problemDetail | 문제 구체화 |
| 3단계 | urgency | 위기감 조성 |
| 4단계 | closing | 클로징 |

각 카드:
- 단계 번호 + 태그 (12px rounded-full bg-gray-100)
- 멘트 본문 (13px)
- 우측 상단 복사 버튼 (SVG 아이콘)

복사 버튼 동작:
```typescript
const handleCopy = async (text: string) => {
  await navigator.clipboard.writeText(text)
  setToastVisible(true)
  setTimeout(() => setToastVisible(false), 2000)
}
```

토스트 메시지: "복사됨" (화면 하단 중앙, 2초 후 사라짐)

---

### T11. PDF 보고서 생성 버튼

`components/dashboard/ReportButton.tsx`

```tsx
<a href={`/dashboard/${analysisId}/report`}>
  <button className="bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800">
    대표 제출용 보고서 만들기
  </button>
  <p className="text-xs text-gray-500 mt-1">
    영업 멘트를 제외한 재무 요약본 · A4 1~2페이지
  </p>
</a>
```

---

### T12. 전체 DashboardView 조립

`components/dashboard/DashboardView.tsx`

```tsx
export default function DashboardView({ analysis }: { analysis: Analysis }) {
  const result = analysis.analysis_result as AnalysisResult

  return (
    <div className="px-5 py-6 space-y-6">
      <CompanyHeader company={result.company} format={analysis.pdf_format} createdAt={analysis.created_at} />
      <MetricCards financials={result.financials} />
      <div className="grid grid-cols-2 gap-3">
        {result.diagnosis && <DiagnosisSection diagnosis={result.diagnosis} />}
        <FinancialTrend financials={result.financials} />
      </div>
      <IssuesList issues={result.issues} />
      <PersonasSection personas={result.personas} />
      <SalesScripts salesScripts={result.salesScripts} analysisId={analysis.id} />
      <ReportButton analysisId={analysis.id} />
    </div>
  )
}
```

---

## 완료 기준 체크리스트

```
[ ] /dashboard/[id] 접속 시 모든 섹션 정상 렌더링
[ ] diagnosis 없는 분석 → DiagnosisSection 숨겨짐 (빈 공간 없음)
[ ] 영업 멘트 복사 버튼 클릭 → "복사됨" 토스트 표시 확인
[ ] status: 'processing' 상태에서 접속 → 로딩 화면 표시 확인
[ ] status: 'error' 상태에서 접속 → 에러 메시지 + 재시도 버튼 표시 확인
[ ] 존재하지 않는 id 접속 → 404 페이지 확인
[ ] 타인의 analysisId 접속 → 404 처리 확인 (user_id 조건)
[ ] 전년 대비 하락 수치 → 빨강, 상승 → 파랑 표시 확인
[ ] 숫자 한국 표기법 확인 (억원, 백만원, 천 단위 콤마)
[ ] npx tsc --noEmit → 에러 0개
```

---

## 완료 후

이 파일을 `docs/exec-plans/completed/` 로 이동.
`docs/PLANS.md`의 Phase 4 상태를 `✅ 완료`로 업데이트.
다음: `docs/exec-plans/active/phase-5-pdf-report.md`

# FRONTEND.md — 프론트엔드 코딩 컨벤션

## 기본 원칙

- **서버 컴포넌트 기본.** 인터랙션이 필요할 때만 `'use client'`를 붙인다.
- **타입 안전성 우선.** `any` 사용 금지. 타입 추론이 안 되면 명시적으로 정의한다.
- **단순하게 유지.** 추상화는 같은 코드가 3번 반복될 때 한다. 그 전에는 하지 않는다.

---

## 컴포넌트 규칙

### 파일 위치

```
/components/ui/           - 재사용 가능한 기본 UI (버튼, 카드, 배지, 토스트 등)
/components/dashboard/    - 브리핑 화면 전용 컴포넌트
/components/report/       - PDF 보고서 전용 컴포넌트
/components/upload/       - 업로드 화면 전용 컴포넌트
```

### 네이밍

- 컴포넌트 파일명: PascalCase (`CompanyHeader.tsx`)
- 유틸/훅 파일명: camelCase (`useAnalysisStatus.ts`)
- 페이지 파일: Next.js 컨벤션 따름 (`page.tsx`, `layout.tsx`)

### 구조

```tsx
// 1. imports
// 2. types (props 타입 정의)
// 3. 컴포넌트 함수
// 4. export default

type CompanyHeaderProps = {
  name: string
  creditGrade?: string | null
  industryRank?: number | null
}

export default function CompanyHeader({ name, creditGrade, industryRank }: CompanyHeaderProps) {
  return (
    // ...
  )
}
```

### 조건부 렌더링

데이터가 없는 섹션은 렌더링하지 않는다. 빈 상태 UI나 "데이터 없음" 표시 금지.

```tsx
// ✅ 올바른 방식
{diagnosis && <DiagnosisSection data={diagnosis} />}

// ❌ 잘못된 방식
<DiagnosisSection data={diagnosis ?? {}} />
```

---

## 스타일링 (Tailwind CSS)

### 기본 규칙

- 인라인 style 속성 사용 금지. 모든 스타일은 Tailwind 클래스로.
- 반복되는 클래스 조합은 컴포넌트로 추출하거나 `cn()` 유틸로 관리.
- 다크모드 대응: `dark:` 접두어 활용. 색상을 하드코딩하지 않는다.

### 색상 사용 원칙

의미에 따라 색상을 고정해서 쓴다. 임의로 색상을 선택하지 않는다.

| 의미 | Tailwind 클래스 |
|---|---|
| 위험 / 심각 이슈 | `text-red-700`, `bg-red-50`, `border-red-400` |
| 주의 이슈 | `text-amber-700`, `bg-amber-50`, `border-amber-400` |
| 양호 / 긍정 | `text-green-700`, `bg-green-50` |
| 정보 / 중립 | `text-blue-700`, `bg-blue-50` |
| 전년 대비 상승 | `text-blue-600` |
| 전년 대비 하락 | `text-red-600` |

### 반응형

MVP는 데스크톱(1280px+) 기준. 모바일 최적화는 Post-MVP.  
단, 기본 레이아웃이 모바일에서 깨지지 않도록 `max-w-*`와 `overflow-hidden`은 챙긴다.

---

## 데이터 패칭

### 서버 컴포넌트에서 (기본)

```tsx
// app/dashboard/[id]/page.tsx
export default async function DashboardPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!analysis) notFound()

  return <DashboardView analysis={analysis} />
}
```

### 클라이언트에서 실시간 구독 (분석 상태 폴링)

```tsx
'use client'

// hooks/useAnalysisStatus.ts
export function useAnalysisStatus(analysisId: string) {
  const [status, setStatus] = useState<AnalysisStatus>('pending')

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel('analysis-status')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'analyses',
        filter: `id=eq.${analysisId}`
      }, (payload) => {
        setStatus(payload.new.status)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [analysisId])

  return status
}
```

---

## 숫자 포맷팅

한국 표기법을 일관되게 사용한다. 포맷팅 함수는 `utils/format.ts`에서 관리.

```typescript
// utils/format.ts

// 매출, 자산 등 큰 금액: 억/백만 단위로 표시
export function formatKRW(millions: number): string {
  if (millions >= 10000) {
    return `${(millions / 10000).toFixed(1)}억 원`
  }
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
```

사용 예:
```tsx
<span>{formatKRW(analysis.financials.revenue[2])}</span>   // 21.1억 원
<span>{formatPercent(analysis.financials.operatingMargin[2])}</span>  // 1.3%
```

---

## 에러 처리

### 페이지 레벨

```tsx
// app/dashboard/[id]/not-found.tsx — 존재하지 않는 분석
// app/error.tsx — 전역 에러 바운더리
```

### 컴포넌트 레벨

API 호출 실패, 분석 오류 등은 인라인 에러 상태로 처리.  
전체 페이지를 에러 화면으로 바꾸지 말고, 해당 섹션만 에러 상태를 표시한다.

```tsx
{analysis.status === 'error' && (
  <ErrorState
    message="분석 중 문제가 발생했어요."
    onRetry={() => retryAnalysis(analysis.id)}
  />
)}
```

---

## 로딩 상태

스켈레톤 UI를 사용한다. 빈 화면이나 스피너만 표시하지 않는다.

```tsx
// 브리핑 화면 로딩 스켈레톤
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-16 bg-gray-100 rounded-lg" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-lg" />
        ))}
      </div>
      {/* ... */}
    </div>
  )
}
```

---

## 접근성 최소 요건

MVP 범위에서 지켜야 할 최소한의 접근성 규칙.

- 버튼과 링크에는 명확한 텍스트 또는 `aria-label` 제공
- 색상만으로 의미를 전달하지 않는다 (위험 이슈에는 색상 + 아이콘 또는 텍스트 레이블 병행)
- 이미지/아이콘에는 `alt` 속성 또는 `aria-hidden="true"` 명시

---

## 금지 사항

| 항목 | 이유 |
|---|---|
| `any` 타입 | 런타임 오류를 컴파일 타임에 잡을 수 없다 |
| 인라인 `style` 속성 | Tailwind로 대체. 일관성 유지 |
| 클라이언트에서 직접 DB 접근 | 보안 위반. 서버 액션 또는 API Route 경유 |
| `console.log` 커밋 | 디버깅 후 반드시 제거 |
| 하드코딩된 색상값 (`#3b82f6`) | Tailwind 클래스 사용 |
| 빈 `catch` 블록 | 최소한 `console.error`라도 남긴다 |

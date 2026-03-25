# Phase 6 — 마무리

- 시작일: -
- 목표 완료일: -
- 담당: 에이전트
- 상태: 대기

---

## 목표

실제 영업사원이 일상적으로 사용할 수 있는 수준의 완성도.
이력 관리, 에러 처리, 안정화, 프로덕션 배포까지 완료.

---

## 전제 조건

- [ ] Phase 5 완료 (PDF 다운로드 정상 동작)
- [ ] Vercel 프로젝트 생성 완료 및 GitHub 연동

---

## 참조 문서

전체 Phase 로드맵: `docs/PLANS.md`
품질 체크리스트: `docs/QUALITY_SCORE.md`
보안 체크리스트: `docs/SECURITY.md`

---

## 작업 목록

### T1. 분석 이력 페이지

`app/history/page.tsx` (서버 컴포넌트)

```typescript
import { createClient } from '@/lib/supabase/server'
import HistoryList from '@/components/history/HistoryList'

export default async function HistoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, company_name, created_at, status, pdf_format')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="px-5 py-6">
      <h1 className="text-lg font-medium mb-4">분석 이력</h1>
      <HistoryList analyses={analyses ?? []} />
    </div>
  )
}
```

`components/history/HistoryList.tsx`

```typescript
import Link from 'next/link'

type Analysis = {
  id: string
  company_name: string | null
  created_at: string
  status: string
  pdf_format: string
}

export default function HistoryList({ analyses }: { analyses: Analysis[] }) {
  if (analyses.length === 0) {
    return (
      <p className="text-sm text-gray-500">아직 분석한 기업이 없습니다.</p>
    )
  }

  return (
    <div className="space-y-2">
      {analyses.map((a) => (
        <Link
          key={a.id}
          href={a.status === 'done' ? `/dashboard/${a.id}` : '#'}
          className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {a.company_name ?? '(기업명 미확인)'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date(a.created_at).toLocaleDateString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
                {' · '}
                {a.pdf_format === 'cretop' ? 'CRETOP' : a.pdf_format === 'nice' ? 'NICE BizLine' : '일반'}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </div>
        </Link>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'done') {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">
        완료
      </span>
    )
  }
  if (status === 'processing') {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-700">
        분석 중
      </span>
    )
  }
  if (status === 'error') {
    return (
      <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">
        오류
      </span>
    )
  }
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
      대기
    </span>
  )
}
```

---

### T2. 메인 화면 최근 이력 3건 표시

`app/page.tsx` 수정 — 업로드 UI 하단에 최근 이력 추가.

```typescript
import { createClient } from '@/lib/supabase/server'
import UploadZone from '@/components/upload/UploadZone'
import RecentHistory from '@/components/history/RecentHistory'

export default async function HomePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: recent } = await supabase
    .from('analyses')
    .select('id, company_name, created_at, status')
    .eq('user_id', user!.id)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="px-5 py-6">
      <h1 className="text-lg font-medium mb-4">재무 분석 시작</h1>
      <UploadZone />
      {recent && recent.length > 0 && (
        <div className="mt-8">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            최근 분석
          </p>
          <RecentHistory analyses={recent} />
        </div>
      )}
    </div>
  )
}
```

`components/history/RecentHistory.tsx` — `HistoryList`와 동일한 타입, 간결한 스타일:

```typescript
import Link from 'next/link'

type Item = { id: string; company_name: string | null; created_at: string; status: string }

export default function RecentHistory({ analyses }: { analyses: Item[] }) {
  return (
    <div className="space-y-1.5">
      {analyses.map((a) => (
        <Link
          key={a.id}
          href={`/dashboard/${a.id}`}
          className="flex items-center justify-between border border-gray-200 rounded-md px-4 py-3 hover:bg-gray-50 transition-colors"
        >
          <span className="text-sm font-medium">{a.company_name ?? '(기업명 미확인)'}</span>
          <span className="text-xs text-gray-400">
            {new Date(a.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        </Link>
      ))}
    </div>
  )
}
```

---

### T3. 에러 바운더리

`app/error.tsx` (전역 에러 바운더리, `'use client'` 필수)

```typescript
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="px-5 py-6">
      <h2 className="text-base font-medium text-red-700 mb-2">오류가 발생했습니다</h2>
      <p className="text-sm text-gray-500 mb-4">
        {error.message || '잠시 후 다시 시도해주세요.'}
      </p>
      <button
        onClick={reset}
        className="bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800"
      >
        다시 시도
      </button>
    </div>
  )
}
```

`app/dashboard/[id]/error.tsx` — 동일한 패턴으로 대시보드 전용 에러 페이지 생성.

---

### T4. 브리핑 화면 스켈레톤 UI

`components/dashboard/DashboardSkeleton.tsx`

```typescript
export default function DashboardSkeleton() {
  return (
    <div className="px-5 py-6 space-y-6 animate-pulse">
      {/* 회사 헤더 스켈레톤 */}
      <div>
        <div className="h-5 w-48 bg-gray-100 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>

      {/* 지표 카드 4개 */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-5 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* 테이블 스켈레톤 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-3 flex-1 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
```

`app/dashboard/[id]/loading.tsx` — Next.js 자동 로딩 상태 파일:

```typescript
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton'

export default function Loading() {
  return <DashboardSkeleton />
}
```

---

### T5. 메타데이터 설정

`app/layout.tsx` 수정 — `metadata` export 추가:

```typescript
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Solve AI — 법인 재무 분석',
  description: '기업 재무 보고서를 업로드하면 AI가 영업 브리핑을 자동으로 만들어드립니다.',
}
```

`app/dashboard/[id]/page.tsx` — 동적 메타데이터:

```typescript
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('analyses')
    .select('company_name')
    .eq('id', params.id)
    .single()

  return {
    title: data?.company_name
      ? `${data.company_name} — Solve AI`
      : 'Solve AI',
  }
}
```

`public/favicon.ico` — 파비콘 파일 배치 (기본 Next.js 파비콘 교체 선택사항).

---

### T6. Vercel 환경변수 등록

Vercel 대시보드 → Project Settings → Environment Variables에 아래 항목 등록:

```
NEXT_PUBLIC_SUPABASE_URL        (Preview + Production)
NEXT_PUBLIC_SUPABASE_ANON_KEY   (Preview + Production)
SUPABASE_SERVICE_ROLE_KEY       (Production only)
ANTHROPIC_API_KEY               (Production only)
NEXT_PUBLIC_APP_URL             (각 환경에 맞는 URL)
```

> **주의:** `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 `NEXT_PUBLIC_` 접두어 없이 등록.
> Preview 환경에는 테스트용 Supabase 프로젝트 사용 권장.

---

### T7. 최종 E2E 검증

아래 시나리오를 프로덕션 또는 Preview 환경에서 직접 실행:

**시나리오 A — CRETOP 전체 플로우:**
1. 신규 계정 회원가입
2. CRETOP PDF 업로드
3. `pending → processing → done` 상태 변화 확인
4. 브리핑 화면 모든 섹션 렌더링 확인
5. 영업 멘트 복사 → 클립보드 내용 확인
6. PDF 다운로드 → 파일 열어서 한글, 레이아웃 확인
7. `/history` 에서 방금 분석 항목 확인

**시나리오 B — NICE BizLine 전체 플로우:**
- 시나리오 A와 동일, NICE BizLine PDF 사용

**시나리오 C — 보안 검증:**
1. 다른 계정으로 로그인 후 타 계정의 `analysisId`로 `/dashboard/{id}` 접근 → 404 확인
2. 미인증 상태로 `/` 접근 → `/auth/login` 리디렉트 확인
3. 20MB 초과 파일 업로드 시도 → 에러 메시지 확인
4. PDF 아닌 파일 (예: `.jpg`) 업로드 시도 → 에러 메시지 확인

---

## 완료 기준 체크리스트

```
[ ] /history 페이지에서 분석 이력 목록 표시 확인
[ ] 메인 화면 하단에 최근 분석 3건 표시 확인
[ ] 새 분석 완료 후 메인 화면 새로고침 시 목록에 추가됨 확인
[ ] app/error.tsx 에러 바운더리 동작 확인
[ ] /dashboard/[id]/loading.tsx 스켈레톤 표시 확인
[ ] 페이지 타이틀에 기업명 표시 확인 (/dashboard/[id])
[ ] Vercel 환경변수 모두 등록 완료
[ ] 프로덕션 URL에서 회원가입 → 분석 → PDF 다운로드 전체 플로우 통과
[ ] 타 계정 analysisId 접근 → 404 확인 (프로덕션)
[ ] npx tsc --noEmit → 에러 0개
[ ] npm run lint → 에러 0개
```

---

## 완료 후

이 파일을 `docs/exec-plans/completed/` 로 이동.
`docs/PLANS.md`의 Phase 6 상태를 `✅ 완료`로 업데이트.

**MVP 개발 완료.**
Post-MVP 백로그 항목은 `docs/PLANS.md` 하단 참조.

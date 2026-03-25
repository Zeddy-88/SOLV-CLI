# Phase 1 — 기반 세팅

- 시작일: -
- 목표 완료일: -
- 담당: 에이전트
- 상태: 대기

---

## 목표

로그인한 사용자가 앱에 접근할 수 있는 상태.
회원가입 → 로그인 → 메인 화면 진입 → 로그아웃이 정상 동작.

---

## 전제 조건

작업 시작 전 사람이 완료해야 하는 것들. 에이전트가 대신할 수 없음.

- [ ] Supabase 프로젝트 생성 완료
- [ ] Supabase 대시보드에서 이메일/패스워드 Auth 활성화 확인
- [ ] `.env.local` 파일에 아래 4개 환경변수 입력 완료

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

---

## 작업 목록

### T1. 프로젝트 생성

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

생성 후 확인:
- `app/` 디렉토리 존재
- `tsconfig.json`에 `"strict": true` 포함
- `tailwind.config.ts` 존재

---

### T2. 의존성 설치

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

### T3. 디렉토리 구조 생성

아래 디렉토리를 미리 만들어둔다. 파일은 이후 작업에서 채운다.

```
/app
  /api/upload/
  /api/analyze/
  /api/report/
  /dashboard/
  /history/
  /auth/
    /login/
    /signup/

/components
  /ui/
  /dashboard/
  /report/
  /upload/

/lib
  /supabase/
  /claude/
  /parsers/

/types/
/utils/
```

---

### T4. Supabase 클라이언트 초기화

#### `lib/supabase/server.ts`
서버 컴포넌트, API Route, Server Action에서 사용하는 클라이언트.

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  )
}
```

#### `lib/supabase/client.ts`
클라이언트 컴포넌트에서 사용하는 브라우저 클라이언트.

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

---

### T5. 미들웨어 설정

`middleware.ts` (루트에 생성)

비인증 사용자가 보호된 페이지에 접근하면 `/auth/login`으로 리디렉트.
인증된 사용자가 `/auth/login`, `/auth/signup`에 접근하면 `/`으로 리디렉트.

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')

  if (!user && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

### T6. 로그인 페이지

`app/auth/login/page.tsx`

- 이메일 + 패스워드 입력 폼
- "로그인" 버튼 클릭 시 Supabase `signInWithPassword()` 호출
- 성공 시 `/`로 router.push
- 실패 시 인라인 에러 메시지 표시 ("이메일 또는 비밀번호가 올바르지 않습니다.")
- 회원가입 페이지 링크 포함
- `'use client'` 사용 (폼 인터랙션 필요)

디자인 규칙 (`docs/DESIGN.md` 참조):
- 버튼: `bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800`
- 에러: `text-red-700 text-sm`
- 폼 너비: 최대 400px, 화면 중앙 정렬

---

### T7. 회원가입 페이지

`app/auth/signup/page.tsx`

- 이메일 + 패스워드 + 패스워드 확인 입력 폼
- "회원가입" 버튼 클릭 시 Supabase `signUp()` 호출
- 성공 시 "확인 이메일을 보냈습니다" 안내 또는 자동 로그인 후 `/`로 이동
  (Supabase 이메일 확인 설정에 따라 분기)
- 실패 시 인라인 에러 메시지 표시
- 로그인 페이지 링크 포함
- `'use client'` 사용

---

### T8. 루트 레이아웃

`app/layout.tsx`

- 사이드바(20%) + 메인(80%) 2단 구조 (`docs/DESIGN.md` 참조)
- 상단 톱바 44px 고정
- 사이드바: 네비게이션 링크 (로고, 업로드(`/`), 이력(`/history`)), 하단 로그아웃 버튼
- 로그아웃 클릭 시 Supabase `signOut()` → `/auth/login`으로 이동
- `/auth` 경로에서는 사이드바 숨김 (로그인/회원가입 화면은 전체 너비 사용)

```tsx
// 레이아웃 분기 예시
const isAuthPage = pathname.startsWith('/auth')

return isAuthPage
  ? <>{children}</>
  : <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
```

사이드바 컴포넌트: `components/ui/Sidebar.tsx`
- 너비: `w-[20%]` 또는 고정 `w-56`
- 배경: `bg-white border-r border-gray-200`
- 로그아웃 버튼: Server Action 또는 클라이언트에서 처리

---

### T9. 메인 페이지 (업로드 플레이스홀더)

`app/page.tsx`

Phase 1에서는 업로드 UI 없이 플레이스홀더만 작성.
Phase 2에서 실제 업로드 기능으로 교체.

```tsx
export default function HomePage() {
  return (
    <div className="px-5 py-6">
      <h1 className="text-lg font-medium">재무 분석 시작</h1>
      <p className="text-sm text-gray-500 mt-1">
        Phase 2에서 업로드 기능이 추가됩니다.
      </p>
    </div>
  )
}
```

---

### T10. .gitignore 확인

`.gitignore`에 반드시 포함 확인:

```
.env.local
.env*.local
```

---

### T11. 타입 에러 및 린트 확인

```bash
npx tsc --noEmit
npm run lint
```

에러 0개 상태로 Phase 완료.

---

## 완료 기준 체크리스트

아래 시나리오를 직접 실행하여 모두 통과해야 완료.

```
[ ] npm run dev 실행 후 localhost:3000 접속 → /auth/login 리디렉트 확인
[ ] 회원가입 폼에서 신규 계정 생성 → / 로 이동 확인
[ ] /auth/login 접속 시 / 로 리디렉트 확인 (이미 로그인 상태)
[ ] 사이드바에서 로그아웃 클릭 → /auth/login 으로 이동 확인
[ ] 로그아웃 후 / 직접 접속 → /auth/login 리디렉트 확인
[ ] 잘못된 이메일/패스워드 입력 → 에러 메시지 표시 확인
[ ] npx tsc --noEmit → 에러 0개
[ ] npm run lint → 에러 0개
[ ] .env.local 이 .gitignore 에 포함되어 있음
```

---

## 완료 후

이 파일을 `docs/exec-plans/completed/` 로 이동.
`docs/PLANS.md`의 Phase 1 상태를 `✅ 완료`로 업데이트.
다음: `docs/exec-plans/active/phase-2-parser.md` 생성 후 Phase 2 시작.

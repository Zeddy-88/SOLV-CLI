# SECURITY.md — 보안 가이드

이 앱은 기업의 민감한 재무 정보가 담긴 PDF를 다룬다.  
보안 실수는 사용자 신뢰를 영구적으로 잃는 결과로 이어진다.  
아래 항목들은 선택이 아니라 배포 전 필수 확인 사항이다.

---

## 인증 및 세션

### 규칙

- 모든 보호된 라우트는 미들웨어(`middleware.ts`)에서 세션을 검증한다.
- API Route 진입 시 항상 `auth.getUser()`로 세션을 재확인한다. 미들웨어 통과만으로 신뢰하지 않는다.
- 세션 만료 후 재요청 시 `/auth/login`으로 리디렉트한다.

### 구현 패턴

```typescript
// API Route에서 세션 검증 (매번 반드시 포함)
const supabase = createServerClient()
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 데이터 접근 제어 (RLS)

### 규칙

- 모든 테이블에 Row Level Security를 활성화한다.
- `analyses` 테이블: `user_id = auth.uid()` 조건으로 본인 데이터만 접근 가능.
- Supabase Storage: 업로드한 본인만 파일에 접근 가능하도록 버킷 정책 설정.
- RLS가 비활성화된 테이블이 있으면 배포하지 않는다.

### 확인 쿼리

```sql
-- RLS 활성화 여부 확인
select tablename, rowsecurity
from pg_tables
where schemaname = 'public';
-- rowsecurity 컬럼이 모두 true여야 한다.
```

---

## 환경변수 및 API 키

### 규칙

| 변수 | 사용 위치 | 주의 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 가능 | 공개 값. 노출 무방 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 가능 | 공개 값. RLS로 보호 |
| `SUPABASE_SERVICE_ROLE_KEY` | 서버 전용 | **절대 클라이언트에 노출 금지** |
| `ANTHROPIC_API_KEY` | 서버 전용 | **절대 클라이언트에 노출 금지** |

- `NEXT_PUBLIC_` 접두어가 없는 변수는 자동으로 서버 전용. 실수로 클라이언트 컴포넌트에서 참조하면 `undefined`가 되어 API 호출이 실패한다.
- `.env.local`은 `.gitignore`에 포함되어 있는지 반드시 확인한다.
- 키를 실수로 커밋한 경우: 즉시 Supabase/Anthropic 콘솔에서 키를 재발급한다. 커밋 히스토리에서 삭제하는 것만으로는 부족하다.

---

## 파일 업로드 보안

### 규칙

- MIME 타입 검증은 클라이언트와 서버 **양쪽**에서 수행한다. 클라이언트 검증만으로는 우회 가능하다.
- 파일 크기 제한(20MB)도 서버에서 재검증한다.
- 업로드된 파일은 Supabase Storage에 저장하고, 직접 서버 파일시스템에 저장하지 않는다.
- Storage 경로는 `{userId}/{analysisId}.pdf` 형식으로 구성하여 경로 예측을 어렵게 한다.
- 파일명은 사용자 입력값을 그대로 사용하지 않는다. 서버에서 `{analysisId}.pdf`로 고정한다.

```typescript
// ✅ 올바른 Storage 경로
const filePath = `${user.id}/${analysisId}.pdf`

// ❌ 잘못된 방식 — 사용자 파일명 그대로 사용
const filePath = `uploads/${file.name}`
```

---

## 타인 데이터 접근 방지

### 규칙

- API Route에서 `analysisId`로 데이터를 조회할 때, 반드시 `user_id` 조건을 함께 건다. RLS만 믿지 않는다.
- 타인 데이터에 접근하면 `403`을 반환하고, 이유를 구체적으로 노출하지 않는다 (`"Not found"` 또는 `"Forbidden"` 중 하나로 통일).

```typescript
// ✅ user_id 조건 함께 사용
const { data } = await supabase
  .from('analyses')
  .select('*')
  .eq('id', analysisId)
  .eq('user_id', user.id)   // 반드시 포함
  .single()

if (!data) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

---

## 배포 전 보안 체크리스트

배포 전 아래 항목을 순서대로 확인한다.

```
[ ] .env.local이 .gitignore에 포함되어 있다
[ ] SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY가 NEXT_PUBLIC_ 없이 선언되어 있다
[ ] analyses 테이블에 RLS가 활성화되어 있다
[ ] Storage 버킷에 사용자별 접근 정책이 설정되어 있다
[ ] 모든 API Route에서 auth.getUser()로 세션을 검증한다
[ ] 파일 업로드 시 MIME 타입과 크기를 서버에서 재검증한다
[ ] 데이터 조회 시 user_id 조건이 포함되어 있다
[ ] console.log로 민감한 데이터(키, 개인정보)가 출력되지 않는다
[ ] Vercel 환경변수에 프로덕션 값이 올바르게 등록되어 있다
```

---

## 보안 문제 발견 시

개발 중 보안 취약점을 발견하면:

1. 즉시 작업을 멈추고 해당 코드를 배포하지 않는다.
2. `docs/exec-plans/active/` 에 이슈를 기록한다.
3. 수정 후 위 체크리스트를 재확인한다.

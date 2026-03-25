# ARCHITECTURE.md

## 시스템 개요

법인 컨설팅 영업사원이 기업 종합 보고서 PDF를 업로드하면,
AI가 재무 데이터를 파싱·분석하여 영업 브리핑 화면과 대표 제출용 PDF 보고서를 자동 생성하는 웹앱.

```
사용자(영업사원)
    │
    │  PDF 업로드
    ▼
┌─────────────────────────────────────────┐
│           Next.js (Vercel)              │
│                                         │
│  ┌──────────┐      ┌──────────────────┐ │
│  │  App     │      │   API Routes     │ │
│  │  Router  │◄────►│  /upload         │ │
│  │  (UI)    │      │  /analyze        │ │
│  └──────────┘      │  /report         │ │
│                    └────────┬─────────┘ │
└─────────────────────────────┼───────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌──────────────┐ ┌─────────────┐ ┌────────────┐
     │   Supabase   │ │  Anthropic  │ │  Supabase  │
     │  PostgreSQL  │ │ Claude API  │ │  Storage   │
     │   (데이터)    │ │  (AI 분석)  │ │ (PDF 파일) │
     └──────────────┘ └─────────────┘ └────────────┘
```


## 기술 스택 상세

### Frontend

| 기술 | 버전 | 용도 |
|---|---|---|
| Next.js | 14+ | 풀스택 프레임워크, App Router |
| TypeScript | 5+ | 전체 타입 안전성 |
| Tailwind CSS | 3+ | 스타일링 |
| Recharts | 2+ | 재무 데이터 차트 |
| @react-pdf/renderer | 3+ | 대표 제출용 PDF 생성 |

### Backend (Next.js 내 서버사이드)

| 기술 | 버전 | 용도 |
|---|---|---|
| Next.js API Routes | 14+ | REST 엔드포인트 |
| pdf-parse | 1+ | PDF 텍스트 추출 |
| Anthropic SDK | latest | Claude API 호출 |

### Infrastructure

| 기술 | 용도 |
|---|---|
| Supabase | DB (PostgreSQL) + Storage + Auth |
| Vercel | 배포 및 서버리스 함수 |


## 데이터베이스 스키마

### users (Supabase Auth 기본 테이블 활용)
Supabase Auth가 자동 관리. 별도 users 테이블 불필요.

### analyses
업로드된 PDF 1건 = 분석 1건.

```sql
create table analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),

  -- 업로드 파일 정보
  file_name     text not null,
  file_path     text not null,           -- Supabase Storage 경로
  pdf_format    text not null,           -- 'cretop' | 'nice' | 'generic'

  -- 파싱된 기업 기본 정보
  company_name  text,
  biz_number    text,
  ceo_name      text,
  industry      text,
  employee_count int,

  -- AI 분석 상태
  status        text default 'pending',  -- 'pending' | 'processing' | 'done' | 'error'
  error_message text,

  -- AI 분석 결과 (JSON)
  analysis_result jsonb                  -- AnalysisResult 타입 전체를 저장
);

-- RLS: 본인 데이터만 접근
alter table analyses enable row level security;
create policy "own data only" on analyses
  using (auth.uid() = user_id);
```

### analysis_result JSON 구조 (jsonb 컬럼)

```typescript
type AnalysisResult = {
  company: {
    name: string
    bizNumber: string
    ceo: string
    industry: string
    address: string
    employeeCount: number
    foundedYear: number
    creditGrade?: string          // 신용등급 (BBB-, bb 등)
    industryRank?: number         // 업계 순위
  }

  financials: {
    years: number[]               // [2022, 2023, 2024]
    revenue: number[]             // 매출액 (백만원)
    operatingProfit: number[]     // 영업이익
    netIncome: number[]           // 당기순이익
    totalAssets: number[]         // 자산총계
    totalDebt: number[]           // 부채총계
    equity: number[]              // 자본총계
    operatingMargin: number[]     // 영업이익률 (%)
    debtRatio: number[]           // 부채비율 (%)
    roe: number[]                 // ROE (%)
    roa: number[]                 // ROA (%)
    interestCoverage: number[]    // 이자보상배수
  }

  diagnosis: {                    // 재무진단 등급 (있는 경우)
    growth: string                // '양호' | '보통' | '보통이하' | '열위'
    profitability: string
    financialStructure: string
    debtRepayment: string
    activity: string
  } | null

  industryComparison: {           // 업종 평균 대비 (있는 경우)
    operatingMarginAvg: number
    debtRatioAvg: number
    roaAvg: number
  } | null

  summary: string                 // 회사 히스토리 및 현황 요약 (2~3문단)

  issues: Array<{
    severity: 'critical' | 'warning'
    title: string
    description: string
    metric?: string               // 관련 지표명
    value?: string                // 수치
  }>

  strengths: Array<{
    title: string
    description: string
  }>

  salesScripts: {
    opening: string               // 오프닝 — 공감 유도
    problemDetail: string         // 문제 구체화
    urgency: string               // 위기감 조성
    closing: string               // 클로징 — 컨설팅 연결
  }

  personas: {
    financialConsultant: PersonaOpinion   // 재무 컨설턴트
    salesExpert: PersonaOpinion           // 영업왕
    communicationExpert: PersonaOpinion   // 커뮤니케이션 전문가
    psychologist: PersonaOpinion          // 심리 전문가
    integrated: string                    // 4인 통합 의견 (2~3문단)
  }
}

type PersonaOpinion = {
  name: string          // 페르소나 이름 (예: "재무 컨설턴트")
  role: string          // 한 줄 역할 설명 (예: "숫자 뒤의 진짜 의미를 읽는다")
  opinion: string       // 이 페르소나의 핵심 분석 의견 (3~5문장)
  keyPoint: string      // 한 줄 핵심 메시지
}
```


## API Routes 설계

### POST /api/upload
PDF 파일을 받아 Supabase Storage에 저장하고, analyses 레코드를 생성한 뒤 분석을 트리거한다.

**Request:** `multipart/form-data` — `file: File`

**Response:**
```json
{ "analysisId": "uuid" }
```

**처리 흐름:**
1. 파일 유효성 검사 (PDF 여부, 최대 20MB)
2. Supabase Storage에 업로드 (`{userId}/{analysisId}.pdf`)
3. `analyses` 레코드 생성 (status: 'pending')
4. `/api/analyze` 비동기 호출 (백그라운드)
5. `analysisId` 즉시 반환 → 클라이언트는 폴링 또는 실시간 구독으로 상태 확인

---

### POST /api/analyze
PDF를 파싱하고 Claude API를 호출하여 분석 결과를 DB에 저장한다.

**Request:** `{ analysisId: string }`

**처리 흐름:**
1. Supabase Storage에서 PDF 파일 다운로드
2. `pdf-parse`로 텍스트 추출
3. 포맷 자동 감지 → 해당 파서 실행 → `FinancialData` 정규화
4. Claude API 호출 (system prompt + 정규화된 데이터)
5. JSON 응답 파싱 → `AnalysisResult` 타입 검증
6. `analyses` 레코드 업데이트 (status: 'done', analysis_result: JSON)

---

### POST /api/report
완료된 분석 결과를 바탕으로 대표 제출용 PDF를 생성하여 반환한다.

**Request:** `{ analysisId: string }`

**Response:** `application/pdf` 스트림

**처리 흐름:**
1. `analyses` 레코드에서 `analysis_result` 조회
2. `@react-pdf/renderer`로 PDF 렌더링
3. PDF 바이너리 반환


## PDF 파싱 파이프라인

```
원본 PDF
    │
    ▼
pdf-parse (텍스트 추출)
    │
    ▼
포맷 감지
├── CRETOP/K0DATA  → lib/parsers/cretop.ts
├── NICE BizLine   → lib/parsers/nice.ts
└── 기타           → lib/parsers/generic.ts
    │
    ▼
FinancialData (공통 정규화 타입)
    │
    ▼
Claude API 호출
    │
    ▼
AnalysisResult (JSON)
```

### 포맷 감지 로직 (`lib/parsers/detect.ts`)

```typescript
type PdfFormat = 'cretop' | 'nice' | 'generic'

function detectFormat(text: string): PdfFormat {
  if (text.includes('K0DATA') || text.includes('한국평가데이터') || text.includes('CRETOP')) {
    return 'cretop'
  }
  if (text.includes('NICE평가정보') || text.includes('NICE BizLINE')) {
    return 'nice'
  }
  return 'generic'
}
```

### CRETOP 파서가 추출하는 주요 데이터
- 기업개요 (기업명, 사업자번호, 대표자, 업종, 종업원수)
- 요약 재무상태표 3개년 (자산/부채/자본)
- 요약 손익계산서 3개년 (매출/영업이익/순이익)
- 요약 현금흐름분석 3개년
- 요약 재무비율 (성장성/수익성/안정성/활동성)
- 재무진단 등급 (5개 항목)
- 업계순위 및 동종업계 경영규모 비교
- 신용등급 (bb 등)

### NICE 파서가 추가로 추출하는 데이터
- 기업평가등급 이력 (BBB-, B+, BB0 등 + 날짜)
- WATCH등급 이력
- 현금흐름등급 (CF1~CF6)
- 한은평균 / NICE산업평균 비교 수치
- 종업원 현황 (입퇴사율, 평균연봉)


## Claude API 프롬프트 설계

시스템 프롬프트는 `lib/claude/prompts.ts`에서 관리한다.

### 페르소나 시스템

분석은 Claude 단일 호출로 처리한다. 4개의 별도 API 호출이 아니라,
하나의 프롬프트에서 4가지 페르소나 관점을 모두 생성하고 통합한다.
(비용 효율 + 페르소나 간 일관성 유지)

**4개 페르소나 정의:**

| 페르소나 | 역할 | 분석 관점 |
|---|---|---|
| 재무 컨설턴트 | 숫자 뒤의 진짜 의미를 읽는다 | 재무비율 해석, 업종 대비 위치, 구조적 리스크 |
| 영업왕 | 계약을 만들어내는 기회를 찾는다 | 영업 진입점, 대표의 니즈 추정, 제안 타이밍 |
| 커뮤니케이션 전문가 | 어떻게 말하면 마음이 열리는지 안다 | 메시지 프레이밍, 표현 방식, 대화 흐름 설계 |
| 심리 전문가 | 대표의 감정과 동기를 읽는다 | 방어 심리 예측, 공감 포인트, 결정 동기 자극 |

### System Prompt 핵심 지침

```
당신은 법인 컨설팅 영업을 돕는 AI입니다.
아래 4가지 전문가 관점에서 기업 재무 데이터를 분석하고,
각 관점의 의견과 4인의 통합 의견을 함께 제공합니다.

[재무 컨설턴트] 재무비율과 수치를 해석하여 구조적 문제와 기회를 찾습니다.
[영업왕] 이 데이터에서 계약으로 이어질 수 있는 영업 진입점을 찾습니다.
[커뮤니케이션 전문가] 대표에게 어떤 언어와 흐름으로 이야기해야 할지 설계합니다.
[심리 전문가] 이 재무 상황에서 대표가 어떤 감정과 동기를 가질지 분석합니다.

반드시 아래 JSON 형식으로만 응답하십시오.
[AnalysisResult 타입 스키마 삽입]
```

### 프롬프트 구성 전략
- 재무 데이터는 표 형식으로 정리하여 토큰 효율화
- 업종 평균 데이터가 있을 경우 비교 분석 지시사항 추가
- 각 페르소나는 3~5문장 + 한 줄 핵심 메시지로 구성
- 통합 의견은 4인의 관점을 종합한 2~3문단으로 구성
- 영업 멘트(salesScripts)는 4인 통합 관점을 반영하여 작성
- 강압적이거나 공포심을 과도하게 유발하는 표현 지양하도록 지시


## 인증 흐름

Supabase Auth (이메일/패스워드) 사용.

```
로그인 페이지 (/auth/login)
    │
    ▼
Supabase signInWithPassword()
    │
    ▼
세션 쿠키 자동 설정 (Next.js Supabase SSR 패키지)
    │
    ▼
미들웨어 (middleware.ts) — 비인증 요청을 /auth/login으로 리디렉트
```

- `@supabase/ssr` 패키지 사용 (App Router와 호환)
- 서버 컴포넌트: `createServerClient()` 사용
- 클라이언트 컴포넌트: `createBrowserClient()` 사용
- API Routes: `createServerClient()` with cookie 핸들러 사용


## 실시간 분석 상태 업데이트

분석은 수십 초가 걸릴 수 있다. 사용자에게 진행 상태를 실시간으로 보여주기 위해
Supabase Realtime을 활용한다.

```typescript
// 클라이언트에서 analyses 테이블 특정 row 구독
supabase
  .channel('analysis-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'analyses',
    filter: `id=eq.${analysisId}`
  }, (payload) => {
    // status 변경 감지 → UI 업데이트
  })
  .subscribe()
```

상태 흐름: `pending` → `processing` → `done` | `error`


## 보안 고려사항

- **RLS 필수**: 모든 테이블에 Row Level Security 적용. 사용자는 자신의 데이터만 접근 가능.
- **서버사이드 전용 키**: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 서버에서만 사용. `NEXT_PUBLIC_` 접두어 사용 금지.
- **파일 업로드 검증**: MIME 타입(`application/pdf`) 및 파일 크기(최대 20MB) 서버에서 재검증. 클라이언트 검증만으로는 불충분.
- **Storage 접근 제어**: Supabase Storage 버킷에 RLS 적용. 업로드한 본인만 파일 접근 가능.
- **API Route 인증 확인**: 모든 API Route 진입 시 `auth.getUser()`로 세션 검증.


## 성능 고려사항

- **PDF 파싱 타임아웃**: Vercel 서버리스 함수 최대 실행 시간 60초. 대용량 PDF는 텍스트 추출 후 필요한 페이지만 선택적으로 파싱.
- **Claude API 응답 시간**: 평균 10~30초. 스트리밍 응답(`stream: true`) 활용하여 사용자 대기 UX 개선 검토.
- **분석 결과 캐싱**: 동일 `analysisId`에 대한 재요청은 DB에서 바로 반환. Claude API 재호출 불필요.
- **PDF 보고서 생성**: `/api/report`는 온디맨드 생성 후 바로 반환. 별도 캐싱 불필요 (분석 결과가 변하지 않으므로 필요 시 캐싱 추가 가능).


## 로컬 개발 환경 설정

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local에 Supabase URL, Anon Key, Service Role Key, Anthropic API Key 입력

# Supabase 로컬 개발 (선택)
npx supabase init
npx supabase start

# DB 마이그레이션
npx supabase db push

# 개발 서버 실행
npm run dev
```


## 배포 (Vercel)

1. GitHub 저장소와 Vercel 프로젝트 연결
2. Vercel 환경변수에 `.env.local` 항목 모두 등록
3. `main` 브랜치 push → 자동 프로덕션 배포
4. PR 생성 → Preview 배포 자동 생성

Vercel 함수 타임아웃: `maxDuration = 60` (Pro 플랜 기준)
`/api/analyze` 라우트에 명시 필요:

```typescript
// app/api/analyze/route.ts
export const maxDuration = 60
```

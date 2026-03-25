# AGENTS.md

## Project Overview

법인 컨설팅 영업사원을 위한 AI 기반 재무 분석 및 영업 브리핑 자동화 웹앱.

사용자가 기업 종합 보고서 PDF (CRETOP/K0DATA 또는 NICE BizLine 포맷)를 업로드하면,
AI가 재무 데이터를 파싱·분석하여 다음 두 가지 결과물을 자동 생성한다:

1. **영업사원용 브리핑 화면** — 핵심 지표, 발견된 이슈, 추천 영업 멘트를 보여주는 웹 대시보드
2. **대표 제출용 PDF 보고서** — 미팅 자리에서 대표에게 바로 건넬 수 있는 인쇄 가능한 자료

최종 목표: 영업사원이 컨설팅 계약을 성사시키도록 돕는 것.


## Consulting Domain

이 앱이 지원하는 법인 컨설팅 서비스 영역. AI 분석 및 영업 멘트 생성 시 반드시 이 영역과 연결하여 제안을 구성한다.

| 서비스 | 설명 |
|---|---|
| 특허 | 보유 기술의 특허 출원 및 지식재산권 확보 |
| 각종 인증 | 벤처·이노비즈·메인비즈·ISO 등 기업 인증 취득 |
| 주식이동 | 주주 간 주식 이전, 증여, 양도 설계 |
| 가업승계 | 대표 교체·세대 이전 플랜 설계 및 세금 최소화 |
| 부채비율 조정 | 차입금 구조 개선, 재무구조 정상화 |
| 절세 | 법인세·소득세 절감 플랜, 비용 처리 최적화 |
| 정책자금 | 중소벤처기업부·기업은행 등 저금리 정책 대출 연계 |
| 매출채권 | 외상 매출채권 조기 현금화 (팩토링·매출채권 담보 대출) |
| 정부지원제도 | 고용지원금·R&D 지원·산업별 지원 제도 안내 및 신청 |
| 정부지원금 | 보조금·지원금 공모 발굴 및 신청 대행 |
| 균등소각 | 주주 전원이 동일 비율로 자사주를 소각하여 법인 잉여자금을 세금 효율적으로 주주에게 환원하는 플랜. 배당 대비 세부담이 낮고 주주 간 지분율이 유지되는 것이 특징 |

**AI 분석 시 핵심 원칙:**
재무 데이터에서 발견된 이슈는 반드시 위 서비스 영역과 연결하여 "이 문제는 [서비스명]으로 해결할 수 있습니다" 형태의 제안으로 이어져야 한다. 단순한 문제 나열로 끝나지 않는다.

예시:
- 부채비율 높음 → 부채비율 조정 + 정책자금 제안
- 이자보상배수 낮음 → 정책자금(저금리 대환) + 절세 플랜
- 매출채권 회수 지연 → 매출채권 조기 현금화 제안
- 인증 없음 → 벤처·이노비즈 인증 취득 → 정책자금 자격 획득
- 대주주 고령 → 가업승계 플랜 제안
- 순이익 급감 → 절세 플랜 + 비용 구조 재설계
- 법인 잉여금 과다 + 주주 환원 필요 → 균등소각 플랜 제안


## Tech Stack

| 레이어 | 기술 |
|---|---|
| Frontend | Next.js 14+ (App Router), TypeScript, Tailwind CSS |
| Backend | Next.js API Routes + Server Actions |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Auth | Supabase Auth (이메일/패스워드) |
| AI 분석 | Anthropic Claude API (claude-sonnet-4-5 또는 최신 Sonnet) |
| PDF 파싱 | pdf-parse (서버사이드) |
| PDF 생성 | @react-pdf/renderer 또는 puppeteer (보고서 출력용) |
| 차트 | Recharts |
| 배포 | Vercel |


## Architecture Rules

- **App Router 전용.** Pages Router 사용 금지. `app/` 디렉토리 구조를 따른다.
- **서버 컴포넌트 기본.** `'use client'`는 인터랙션이 필요한 컴포넌트에만 명시적으로 붙인다.
- **DB 접근은 서버에서만.** Supabase 클라이언트는 API Route 또는 Server Action에서만 초기화한다. 클라이언트 컴포넌트에서 직접 DB에 접근하지 않는다.
- **파일 파싱은 서버에서만.** PDF 파싱, Claude API 호출은 반드시 서버사이드에서 처리한다. 클라이언트에서 파일 바이너리를 직접 처리하지 않는다.
- **Supabase RLS 항상 활성화.** 모든 테이블에 Row Level Security를 적용한다. 사용자는 자신이 업로드한 데이터만 조회할 수 있다.
- **환경변수 하드코딩 금지.** API 키, DB URL 등 모든 시크릿은 `.env.local`에서 관리한다.


## File Structure

```
/app
  /api                  - API Routes (파싱, 분석, PDF 생성)
    /upload             - PDF 업로드 처리
    /analyze            - Claude AI 분석 요청
    /report             - PDF 보고서 생성
  /dashboard            - 분석 결과 브리핑 화면
  /history              - 과거 분석 이력
  /auth                 - 로그인/회원가입
  layout.tsx
  page.tsx              - 업로드 메인 화면

/components
  /ui                   - 기본 UI 컴포넌트 (버튼, 카드, 배지 등)
  /dashboard            - 브리핑 화면 전용 컴포넌트
  /report               - PDF 보고서 전용 컴포넌트
  /upload               - 파일 업로드 컴포넌트

/lib
  /supabase             - Supabase 클라이언트 초기화 (server.ts / client.ts 분리)
  /claude               - Claude API 호출 유틸
  /parsers              - PDF 포맷별 파서 (cretop.ts, nice.ts, generic.ts)

/types
  /financial.ts         - 재무 데이터 공통 타입 정의
  /analysis.ts          - AI 분석 결과 타입
  /report.ts            - 보고서 출력 타입

/utils
  - 순수 계산 함수 (재무비율 계산, 수치 포맷팅 등)
```


## Supported PDF Formats

총 두 가지 포맷을 지원한다. 파서는 PDF 텍스트에서 발행사 키워드를 감지하여 자동으로 포맷을 판별한다.

### 1. CRETOP / K0DATA 포맷
- 감지 키워드: `"CRETOP"`, `"K0DATA"`, `"한국평가데이터"`
- 포함 데이터: 기업개요, 재무상태표, 손익계산서, 현금흐름분석, 재무비율(성장성/수익성/안정성/활동성), 재무진단(등급), 업계순위, 신용등급
- 파서: `lib/parsers/cretop.ts`

### 2. NICE BizLine 포맷
- 감지 키워드: `"NICE평가정보"`, `"NICE BizLINE"`, `"NICEbizline"`
- 포함 데이터: 기업요약, 재무비율분석(안정성/유동성/수익성/성장성/활동성), 한은평균/NICE산업평균 비교, 기업평가등급 이력, WATCH등급, 현금흐름등급, 신용도판단정보, 재무제표, 종업원 현황
- 파서: `lib/parsers/nice.ts`

### 3. 일반 재무제표 포맷 (폴백)
- 위 두 포맷에 해당하지 않을 때 사용하는 범용 파서
- 재무상태표, 손익계산서 테이블 구조를 휴리스틱으로 추출
- 파서: `lib/parsers/generic.ts`

> 파서는 정규화된 공통 타입 (`FinancialData`)으로 변환하여 반환한다.
> 이후 AI 분석 단계는 포맷에 무관하게 동일한 파이프라인을 사용한다.


## AI Analysis Pipeline

PDF 파싱 → 정규화 → Claude API 호출 → 구조화된 분석 결과 반환

Claude에게 요청하는 분석 항목:
1. **회사 히스토리 요약** — 설립 배경, 주요 연혁, 업종 특성
2. **재무 상태 요약** — 3개년 핵심 지표 변화, 업종 평균 대비 위치
3. **핵심 이슈 도출** — 심각도(위험/주의)별 이슈 최대 5개
4. **강점 도출** — 영업 멘트에 활용할 긍정적 포인트 최대 3개
5. **4인 전문가 분석** — 아래 4가지 페르소나 관점의 개별 의견 + 통합 의견
   - 재무 컨설턴트: 수치 해석, 구조적 리스크
   - 영업왕: 계약 진입점, 영업 기회 포인트
   - 커뮤니케이션 전문가: 메시지 프레이밍, 대화 흐름
   - 심리 전문가: 대표의 감정·동기 예측, 공감 포인트
6. **영업 추천 멘트** — 4인 통합 관점이 반영된 4단계 스크립트 (오프닝/문제 구체화/위기감 조성/클로징)

4개 페르소나는 별도 API 호출이 아닌 **단일 Claude 호출**로 처리한다.
하나의 프롬프트에서 4관점을 모두 생성하여 비용을 절감하고 일관성을 유지한다.

Claude 응답은 반드시 JSON으로만 반환하도록 프롬프트에 명시한다.
파싱 실패 시 에러를 사용자에게 명확히 표시하고 재시도 안내를 제공한다.


## Key Features

### 영업사원 브리핑 화면 (웹)
- 회사 기본 정보 + 신용등급 + 업계 순위
- 핵심 재무 지표 카드 (매출, 영업이익률, 순이익, 부채비율)
- 3개년 재무 추이 테이블
- 재무진단 등급 (성장성/수익성/재무구조/부채상환능력/활동성)
- 발견된 핵심 이슈 리스트 (위험/주의 구분)
- 단계별 영업 추천 멘트 (복사 가능)

### 대표 제출용 PDF 보고서
- 브리핑 화면의 핵심 내용을 인쇄 친화적으로 재구성
- 회사 로고/날짜 자동 삽입
- A4 1~2페이지 분량으로 제한


## Do

- 모든 파일 업로드는 Supabase Storage에 저장하고 분석 완료 후 참조 가능하게 유지
- Claude API 호출 시 시스템 프롬프트에 JSON 응답 형식을 명확히 지정
- 분석 결과는 Supabase DB에 저장하여 히스토리 조회 가능하게 구현
- 로딩 상태를 단계별로 표시 (업로드 → 파싱 → AI 분석 → 완료)
- TypeScript strict 모드 사용
- 숫자는 한국 표기법으로 포맷 (억/백만원 단위, 천 단위 콤마)


## Don't

- 클라이언트 컴포넌트에서 Supabase `service_role` 키 사용 금지
- `any` 타입 사용 금지
- 클라이언트에서 PDF 파싱 또는 Claude API 직접 호출 금지
- 환경변수 하드코딩 금지
- 분석 결과 화면에서 원본 재무제표 수치를 그대로 나열하는 것 지양 — 반드시 해석/인사이트와 함께 제공


## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 서버사이드 전용
ANTHROPIC_API_KEY=                # 서버사이드 전용
```


## Testing

- 유닛 테스트: 파서 함수, 재무비율 계산 유틸 (`utils/`)
- 통합 테스트: PDF 업로드 → 파싱 → 분석 전체 플로우
- 테스트 픽스처: `tests/fixtures/` 에 CRETOP, NICE 샘플 PDF 보관
- 테스트 프레임워크: Vitest


## References

- 지원 PDF 포맷 예시: `tests/fixtures/sample-cretop.pdf`, `tests/fixtures/sample-nice.pdf`
- 재무 데이터 타입 정의: `types/financial.ts`
- Claude 분석 프롬프트: `lib/claude/prompts.ts`

# CLAUDE.md

## 프로젝트

법인 컨설팅 영업사원이 기업 종합 보고서 PDF를 업로드하면, AI가 재무 데이터를 분석하여
**영업 브리핑 화면**과 **대표 제출용 PDF 보고서**를 자동 생성하는 웹앱.

목적: 영업사원이 미팅 전 5분 안에 준비를 마치고 자신 있게 대표 앞에 앉도록 돕는다.


## 기술 스택

| 레이어 | 기술 |
|---|---|
| Frontend | Next.js 14+ App Router, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes + Server Actions |
| DB / Auth / Storage | Supabase |
| AI | Anthropic Claude API (claude-sonnet-4-6 또는 최신 Sonnet) |
| PDF 파싱 | pdf-parse (서버사이드) |
| PDF 생성 | @react-pdf/renderer |
| 차트 | Recharts |
| 배포 | Vercel |


## 아키텍처 규칙 (절대 원칙)

- **App Router 전용.** `app/` 디렉토리. Pages Router 사용 금지.
- **서버 컴포넌트 기본.** `'use client'`는 인터랙션이 필요한 컴포넌트에만 붙인다.
- **DB 접근은 서버에서만.** Supabase 클라이언트는 API Route 또는 Server Action에서만 초기화.
- **PDF 파싱·Claude API 호출은 서버에서만.** 클라이언트에서 파일 바이너리 직접 처리 금지.
- **Supabase RLS 항상 활성화.** 모든 테이블에 Row Level Security 적용. RLS 없이 배포 금지.
- **환경변수 하드코딩 금지.** 모든 시크릿은 `.env.local`에서 관리.


## 보안 규칙 (배포 전 필수 확인)

- 모든 API Route 진입 시 `auth.getUser()`로 세션 검증. 미들웨어 통과만으로 신뢰하지 않는다.
- `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`는 서버 전용. `NEXT_PUBLIC_` 접두어 사용 금지.
- 데이터 조회 시 `user_id` 조건 필수 포함. RLS만 믿지 않는다.
- 파일 업로드: MIME 타입 + 크기(20MB) 서버에서 재검증.
- Storage 경로: `{userId}/{analysisId}.pdf` 형식. 사용자 입력 파일명 사용 금지.

전체 보안 체크리스트 → `docs/SECURITY.md`


## Do / Don't

**Do**
- TypeScript strict 모드
- 숫자는 한국 표기법 (억/백만원, 천 단위 콤마) — `utils/format.ts` 사용
- 분석 결과는 반드시 해석/인사이트와 함께 제공. 수치 단순 나열 금지.
- 재무 이슈는 반드시 컨설팅 서비스 제안으로 연결 (AGENTS.md 참조)
- 로딩 상태를 단계별로 표시. 침묵 금지.
- 데이터 없는 섹션은 숨김 처리. 빈 공간·"데이터 없음" 표시 금지.

**Don't**
- `any` 타입 사용 금지
- 인라인 `style` 속성으로 색상 하드코딩 금지
- `console.log` 커밋 금지
- 빈 `catch` 블록 금지
- 클라이언트에서 Supabase `service_role` 키 사용 금지
- 그라디언트 배경, 드롭섀도우 사용 금지 (포커스 링 제외)


## 파일 구조

```
/app
  /api/upload       PDF 업로드 처리
  /api/analyze      Claude AI 분석
  /api/report       PDF 보고서 생성
  /dashboard/[id]   분석 결과 브리핑 화면
  /history          분석 이력
  /auth             로그인/회원가입

/components
  /ui               기본 UI (버튼, 카드, 배지 등)
  /dashboard        브리핑 화면 전용
  /report           PDF 보고서 전용
  /upload           업로드 화면 전용

/lib
  /supabase         server.ts / client.ts 분리
  /claude           Claude API 호출 유틸, 프롬프트
  /parsers          PDF 파서 (cretop.ts, nice.ts, generic.ts, detect.ts)

/types
  financial.ts      재무 데이터 공통 타입
  analysis.ts       AI 분석 결과 타입

/utils
  format.ts         숫자 포맷팅 (formatKRW, formatPercent, formatChange)
```


## 개발 워크플로우

### 작업 시작 전

1. `docs/PLANS.md` — 현재 Phase와 완료 기준 확인
2. 해당 Phase의 `docs/exec-plans/active/*.md` — 실행 계획 확인
3. 관련 화면 스펙 `docs/product-specs/*.md` 확인

### 작업 중

- 각 작업 항목은 완료 즉시 exec-plan 문서에서 체크
- 예상치 못한 기술 부채 발생 시 `docs/exec-plans/tech-debt-tracker.md`에 기록

### 작업 완료 기준

`docs/QUALITY_SCORE.md`의 체크리스트를 모두 통과해야 Phase 완료.
보안 항목은 하나라도 실패 시 배포 금지.


## 참조 문서 맵

| 상황 | 읽을 문서 |
|---|---|
| PDF 포맷, AI 파이프라인, 컨설팅 서비스 영역 | `AGENTS.md` |
| DB 스키마, API 설계, 시스템 다이어그램 | `ARCHITECTURE.md` |
| 화면별 상세 스펙 | `docs/product-specs/*.md` |
| 디자인 규칙, 컬러 시스템, 컴포넌트 스타일 | `docs/DESIGN.md` |
| 프론트엔드 코딩 컨벤션, 숫자 포맷팅 | `docs/FRONTEND.md` |
| 에러 처리, 재시도 로직, 로딩 상태 설계 | `docs/RELIABILITY.md` |
| 전체 Phase 로드맵, 마일스톤 | `docs/PLANS.md` |
| 품질 체크리스트, Phase 완료 기준 | `docs/QUALITY_SCORE.md` |
| 설계 원칙 7가지 | `docs/design-docs/core-beliefs.md` |


## 환경변수

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # 서버 전용
ANTHROPIC_API_KEY=                # 서버 전용
```

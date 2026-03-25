# Phase 2 — 파싱 엔진

- 시작일: -
- 목표 완료일: -
- 담당: 에이전트
- 상태: 대기

---

## 목표

PDF를 업로드하면 재무 데이터를 정규화된 `FinancialData` 타입으로 추출할 수 있는 상태.

---

## 전제 조건

- [ ] Phase 1 완료 (인증, 미들웨어, 레이아웃 정상 동작)
- [ ] Supabase 대시보드에서 Storage 버킷 `reports` 생성 완료
- [ ] Storage 버킷 정책: 인증된 사용자만 자신의 경로(`{userId}/*`)에 업로드/읽기 가능하도록 설정

Storage 정책 SQL 예시:
```sql
-- 업로드 정책
create policy "users can upload own files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 읽기 정책
create policy "users can read own files"
on storage.objects for select
to authenticated
using (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);
```

- [ ] Supabase에서 `analyses` 테이블 생성 완료 (아래 T1 참조)

---

## 작업 목록

### T1. analyses 테이블 생성 및 RLS 설정

Supabase SQL Editor에서 실행:

```sql
create table analyses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  created_at    timestamptz default now(),

  file_name     text not null,
  file_path     text not null,
  pdf_format    text not null check (pdf_format in ('cretop', 'nice', 'generic')),

  company_name  text,
  biz_number    text,
  ceo_name      text,
  industry      text,
  employee_count int,

  status        text default 'pending'
                check (status in ('pending', 'processing', 'done', 'error')),
  error_message text,

  analysis_result jsonb
);

alter table analyses enable row level security;

create policy "users can manage own analyses"
on analyses for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
```

---

### T2. 의존성 설치

```bash
npm install pdf-parse
npm install -D @types/pdf-parse vitest @vitejs/plugin-react
```

`vitest.config.ts` (루트에 생성):

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
  },
})
```

`package.json`에 테스트 스크립트 추가:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

### T3. 공통 타입 정의

`types/financial.ts`

```typescript
export type PdfFormat = 'cretop' | 'nice' | 'generic'

export type FinancialData = {
  format: PdfFormat
  company: {
    name: string
    bizNumber?: string
    ceo?: string
    industry?: string
    address?: string
    employeeCount?: number
    foundedYear?: number
    creditGrade?: string       // 신용등급 (예: BBB-, bb)
    industryRank?: number      // 업계 순위
    watchStatus?: string       // NICE 전용 (예: 정상)
  }
  financials: {
    years: number[]            // [2022, 2023, 2024]
    revenue: number[]          // 매출액 (백만원)
    operatingProfit: number[]
    netIncome: number[]
    totalAssets: number[]
    totalDebt: number[]
    equity: number[]
    operatingMargin: number[]  // 영업이익률 (%)
    debtRatio: number[]        // 부채비율 (%)
    roe: number[]
    roa: number[]
    interestCoverage: number[]
  }
  diagnosis?: {                // 재무진단 등급 (없으면 undefined)
    growth: string
    profitability: string
    financialStructure: string
    debtRepayment: string
    activity: string
  }
  industryComparison?: {       // 업종 평균 (없으면 undefined)
    operatingMarginAvg: number
    debtRatioAvg: number
    roaAvg: number
  }
  rawText: string              // 원본 텍스트 (Claude 프롬프트에 전달)
}
```

---

### T4. PDF 텍스트 추출 유틸

`lib/parsers/extract.ts`

```typescript
import pdfParse from 'pdf-parse'

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)

  if (!data.text || data.text.trim().length < 100) {
    throw new Error(
      '텍스트를 추출할 수 없습니다. 스캔본 PDF는 지원하지 않습니다.'
    )
  }

  return data.text
}
```

---

### T5. 포맷 감지 로직

`lib/parsers/detect.ts`

```typescript
import type { PdfFormat } from '@/types/financial'

export function detectFormat(text: string): PdfFormat {
  if (
    text.includes('K0DATA') ||
    text.includes('한국평가데이터') ||
    text.includes('CRETOP')
  ) {
    return 'cretop'
  }
  if (
    text.includes('NICE평가정보') ||
    text.includes('NICE BizLINE') ||
    text.includes('NICEbizline')
  ) {
    return 'nice'
  }
  return 'generic'
}
```

---

### T6. CRETOP 파서

`lib/parsers/cretop.ts`

추출 대상:
- 기업명, 사업자번호, 대표자, 업종, 종업원수
- 3개년 요약 재무상태표 (자산/부채/자본)
- 3개년 요약 손익계산서 (매출/영업이익/순이익)
- 재무비율 (영업이익률, 부채비율, ROE, ROA, 이자보상배수)
- 재무진단 등급 5개 항목 (있을 경우)
- 업계 순위, 신용등급

파싱 전략:
- 정규식으로 숫자 추출. 단위가 "백만원"인지 "억원"인지 확인 후 백만원으로 통일.
- 연도는 `20XX년` 또는 `20XX.12` 패턴으로 추출.
- 재무진단 등급은 "양호", "보통", "보통이하", "열위" 키워드로 매칭.
- 추출 실패한 필드는 `undefined`로 두고 전체 파싱을 중단하지 않는다.

```typescript
import type { FinancialData } from '@/types/financial'

export function parseCretop(text: string): FinancialData {
  // 구현
  // 각 섹션별 정규식 또는 라인 파싱 로직
  // 반드시 rawText 포함
  return {
    format: 'cretop',
    company: { /* 추출된 기업 정보 */ name: extractCompanyName(text) },
    financials: { /* 추출된 재무 데이터 */ },
    diagnosis: extractDiagnosis(text),
    rawText: text,
  }
}
```

---

### T7. NICE BizLine 파서

`lib/parsers/nice.ts`

CRETOP 파서에 추가로 추출:
- 기업평가등급 이력 (최신 등급만 creditGrade에 저장)
- WATCH 등급 이력 (최신 값만 watchStatus에 저장)
- 현금흐름등급 (CF1~CF6)
- 한은평균 / NICE산업평균 비교 수치 → `industryComparison`으로 저장
- 종업원 현황 (입퇴사율, 평균연봉)

```typescript
import type { FinancialData } from '@/types/financial'

export function parseNice(text: string): FinancialData {
  // 구현
  return {
    format: 'nice',
    company: { /* 추출된 기업 정보 */ name: extractCompanyName(text) },
    financials: { /* 추출된 재무 데이터 */ },
    diagnosis: extractDiagnosis(text),
    industryComparison: extractIndustryComparison(text),
    rawText: text,
  }
}
```

---

### T8. 파서 진입점

`lib/parsers/index.ts`

```typescript
import { detectFormat } from './detect'
import { extractTextFromPdf } from './extract'
import { parseCretop } from './cretop'
import { parseNice } from './nice'
import { parseGeneric } from './generic'
import type { FinancialData } from '@/types/financial'

export async function parseReport(buffer: Buffer): Promise<FinancialData> {
  const text = await extractTextFromPdf(buffer)
  const format = detectFormat(text)

  switch (format) {
    case 'cretop': return parseCretop(text)
    case 'nice':   return parseNice(text)
    default:       return parseGeneric(text)
  }
}
```

`lib/parsers/generic.ts` — 최소 구현 (Phase 2 MVP):
재무상태표, 손익계산서 테이블 구조를 휴리스틱으로 추출.
추출 불가 필드는 빈 배열 또는 0으로 처리. 오류 던지지 않음.

---

### T9. /api/upload 라우트

`app/api/upload/route.ts`

처리 흐름:
1. 세션 검증 (`auth.getUser()`)
2. FormData에서 파일 추출
3. 클라이언트 검증 (MIME: `application/pdf`, 크기: 최대 20MB) — 서버에서 재검증
4. `analysisId` = `crypto.randomUUID()`
5. Supabase Storage에 업로드 (`{userId}/{analysisId}.pdf`)
6. `analyses` 레코드 생성 (`status: 'pending'`)
7. `/api/analyze` 백그라운드 호출 (fire-and-forget)
8. `{ analysisId }` 반환

```typescript
export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF 파일만 업로드 가능합니다.' }, { status: 400 })
  if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: '파일 크기는 20MB 이하여야 합니다.' }, { status: 400 })

  const analysisId = crypto.randomUUID()
  const filePath = `${user.id}/${analysisId}.pdf`

  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(filePath, bytes, { contentType: 'application/pdf' })

  if (uploadError) {
    return NextResponse.json({ error: '파일 업로드 실패' }, { status: 500 })
  }

  await supabase.from('analyses').insert({
    id: analysisId,
    user_id: user.id,
    file_name: file.name,
    file_path: filePath,
    pdf_format: 'pending',  // 파싱 후 업데이트
    status: 'pending',
  })

  // 백그라운드 분석 트리거 (응답 기다리지 않음)
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisId }),
  }).catch(() => {/* 무시 */})

  return NextResponse.json({ analysisId })
}
```

환경변수 추가: `.env.local`에 `NEXT_PUBLIC_APP_URL=http://localhost:3000`

---

### T10. 업로드 화면 UI

`app/page.tsx` — Phase 1 플레이스홀더를 실제 UI로 교체

`components/upload/UploadZone.tsx` (`'use client'`)

구현 요소:
- 드래그앤드롭 영역 (dashed border, 중앙 텍스트)
- "파일 선택" 버튼 (숨겨진 `<input type="file" accept=".pdf">` 트리거)
- 선택된 파일명 표시
- 업로드 버튼 클릭 시 `/api/upload` POST
- 상태별 UI:
  - 대기: 드롭존 표시
  - 업로드 중: "파일 업로드 중..." 텍스트
  - 완료: `/dashboard/{analysisId}`로 `router.push`
  - 오류: 에러 메시지 인라인 표시
- 지원 포맷 안내: "CRETOP, NICE BizLine 포맷을 지원합니다"

---

### T11. 파서 유닛 테스트

`tests/parsers/detect.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { detectFormat } from '@/lib/parsers/detect'

describe('detectFormat', () => {
  it('CRETOP 감지', () => {
    expect(detectFormat('CRETOP 기업신용평가')).toBe('cretop')
    expect(detectFormat('한국평가데이터 보고서')).toBe('cretop')
  })
  it('NICE 감지', () => {
    expect(detectFormat('NICE평가정보 분석')).toBe('nice')
    expect(detectFormat('NICE BizLINE 리포트')).toBe('nice')
  })
  it('기타 포맷', () => {
    expect(detectFormat('일반 재무제표')).toBe('generic')
  })
})
```

실제 PDF 샘플이 있다면 `tests/fixtures/`에 보관 후 통합 테스트 추가.

---

## 완료 기준 체크리스트

```
[ ] CRETOP PDF 업로드 → analyses 레코드 생성 확인 (Supabase 대시보드)
[ ] NICE BizLine PDF 업로드 → analyses 레코드 생성 확인
[ ] 20MB 초과 파일 → 클라이언트에서 즉시 차단
[ ] PDF 아닌 파일 → 에러 메시지 표시
[ ] 스캔본 PDF → "텍스트를 추출할 수 없습니다" 에러 처리
[ ] detectFormat 유닛 테스트 통과 (npm test)
[ ] npx tsc --noEmit → 에러 0개
[ ] Supabase Storage에 파일 실제 저장 확인
[ ] analyses 테이블 RLS 활성화 확인
```

---

## 완료 후

이 파일을 `docs/exec-plans/completed/` 로 이동.
`docs/PLANS.md`의 Phase 2 상태를 `✅ 완료`로 업데이트.
다음: `docs/exec-plans/active/phase-3-ai-analysis.md`

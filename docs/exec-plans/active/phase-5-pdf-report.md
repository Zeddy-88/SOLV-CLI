# Phase 5 — PDF 보고서

- 시작일: -
- 목표 완료일: -
- 담당: 에이전트
- 상태: 대기

---

## 목표

영업사원이 대표에게 건낼 수 있는 A4 1~2페이지 PDF를 생성하고 다운로드할 수 있는 상태.
한글 깨짐 없이 출력되며, 영업 멘트(salesScripts)는 포함하지 않는다.

---

## 전제 조건

- [ ] Phase 4 완료 (DashboardView 정상 동작, `AnalysisResult` JSON DB에 저장됨)

---

## 참조 문서

화면 스펙 상세: `docs/product-specs/pdf-report.md`
디자인 규칙: `docs/DESIGN.md`

---

## 작업 목록

### T1. 의존성 설치

```bash
npm install @react-pdf/renderer
```

---

### T2. 한글 폰트 설정

`public/fonts/` 디렉토리에 Noto Sans KR 웹폰트 파일 배치:
- `NotoSansKR-Regular.ttf`
- `NotoSansKR-Medium.ttf`

> 폰트 파일은 Google Fonts (https://fonts.google.com/noto/specimen/Noto+Sans+KR) 에서 다운로드.
> 에이전트가 직접 다운로드 불가 시 사용자에게 요청.

`lib/pdf/fonts.ts`

```typescript
import { Font } from '@react-pdf/renderer'

export function registerFonts() {
  Font.register({
    family: 'NotoSansKR',
    fonts: [
      { src: '/fonts/NotoSansKR-Regular.ttf', fontWeight: 400 },
      { src: '/fonts/NotoSansKR-Medium.ttf', fontWeight: 500 },
    ],
  })
}
```

> `@react-pdf/renderer`에서 `/fonts/...` 경로는 서버사이드 API Route에서 호출 시
> `process.cwd() + '/public/fonts/...'` 절대 경로를 사용해야 함.

`lib/pdf/fonts.ts` 최종 구현:

```typescript
import { Font } from '@react-pdf/renderer'
import path from 'path'

export function registerFonts() {
  const base = path.join(process.cwd(), 'public', 'fonts')

  Font.register({
    family: 'NotoSansKR',
    fonts: [
      { src: path.join(base, 'NotoSansKR-Regular.ttf'), fontWeight: 400 },
      { src: path.join(base, 'NotoSansKR-Medium.ttf'), fontWeight: 500 },
    ],
  })
}
```

---

### T3. PDF 공통 스타일

`lib/pdf/styles.ts`

```typescript
import { StyleSheet } from '@react-pdf/renderer'

export const pdfStyles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansKR',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 48,
    color: '#111827',
  },
  header: {
    marginBottom: 20,
    borderBottom: '1pt solid #E5E7EB',
    paddingBottom: 12,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 500,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 500,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  table: {
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #F3F4F6',
    paddingVertical: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #E5E7EB',
    paddingVertical: 5,
    fontWeight: 500,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
  },
  tableCellRight: {
    flex: 1,
    fontSize: 9,
    textAlign: 'right',
  },
  issueBox: {
    borderLeft: '3pt solid #F87171',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  issueWarningBox: {
    borderLeft: '3pt solid #FCD34D',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  issueTitle: {
    fontSize: 9,
    fontWeight: 500,
    marginBottom: 2,
  },
  issueDesc: {
    fontSize: 8,
    color: '#374151',
  },
  strengthBox: {
    backgroundColor: '#F0FDF4',
    borderLeft: '3pt solid #4ADE80',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 6,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#9CA3AF',
    borderTop: '0.5pt solid #E5E7EB',
    paddingTop: 6,
  },
})
```

---

### T4. PDF 문서 컴포넌트

`components/report/ReportDocument.tsx`

```typescript
import {
  Document, Page, Text, View, StyleSheet
} from '@react-pdf/renderer'
import type { AnalysisResult } from '@/types/analysis'
import { pdfStyles } from '@/lib/pdf/styles'
import { formatKRW, formatPercent } from '@/utils/format'

type Props = {
  result: AnalysisResult
  createdAt: string
}

export function ReportDocument({ result, createdAt }: Props) {
  const { company, financials, issues, strengths } = result

  // 최신 연도 인덱스
  const lastIdx = financials.years.length - 1
  const lastYear = financials.years[lastIdx]

  // 이슈 최대 3개, 강점 최대 2개
  const topIssues = issues.slice(0, 3)
  const topStrengths = strengths.slice(0, 2)

  const dateStr = new Date(createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric'
  })

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>

        {/* 헤더 */}
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.companyName}>{company.name}</Text>
          <Text style={pdfStyles.subtitle}>
            {company.industry} · 종업원 {company.employeeCount ?? '-'}명
            {company.creditGrade ? ` · 신용등급 ${company.creditGrade}` : ''}
          </Text>
          <Text style={[pdfStyles.subtitle, { marginTop: 4 }]}>
            결산 기준일: {lastYear}년 12월 31일 · 분석일: {dateStr}
          </Text>
        </View>

        {/* 핵심 재무 현황 */}
        <Text style={pdfStyles.sectionTitle}>핵심 재무 현황</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={pdfStyles.tableCell}>항목</Text>
            {financials.years.map(y => (
              <Text key={y} style={pdfStyles.tableCellRight}>{y}년</Text>
            ))}
          </View>
          {[
            { label: '매출 (억원)', values: financials.revenue.map(v => formatKRW(v)) },
            { label: '영업이익 (억원)', values: financials.operatingProfit.map(v => formatKRW(v)) },
            { label: '당기순이익 (억원)', values: financials.netIncome.map(v => formatKRW(v)) },
            { label: '영업이익률', values: financials.operatingMargin.map(v => formatPercent(v)) },
            { label: '부채비율', values: financials.debtRatio.map(v => formatPercent(v)) },
            { label: 'ROE', values: financials.roe.map(v => formatPercent(v)) },
          ].map(row => (
            <View key={row.label} style={pdfStyles.tableRow}>
              <Text style={pdfStyles.tableCell}>{row.label}</Text>
              {row.values.map((v, i) => (
                <Text key={i} style={pdfStyles.tableCellRight}>{v}</Text>
              ))}
            </View>
          ))}
        </View>

        {/* 주요 발견 사항 */}
        {topIssues.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>주요 발견 사항</Text>
            {topIssues.map((issue, i) => (
              <View
                key={i}
                style={issue.severity === 'critical' ? pdfStyles.issueBox : pdfStyles.issueWarningBox}
              >
                <Text style={pdfStyles.issueTitle}>{issue.title}</Text>
                <Text style={pdfStyles.issueDesc}>{issue.description}</Text>
              </View>
            ))}
          </>
        )}

        {/* 컨설팅 제안 포인트 */}
        {topStrengths.length > 0 && (
          <>
            <Text style={pdfStyles.sectionTitle}>컨설팅 제안 포인트</Text>
            {topStrengths.map((s, i) => (
              <View key={i} style={pdfStyles.strengthBox}>
                <Text style={pdfStyles.issueTitle}>{s.title}</Text>
                <Text style={pdfStyles.issueDesc}>{s.description}</Text>
              </View>
            ))}
          </>
        )}

        {/* 푸터 */}
        <View style={pdfStyles.footer} fixed>
          <Text>{company.name} 재무 분석 보고서</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  )
}
```

---

### T5. /api/report 라우트

`app/api/report/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { registerFonts } from '@/lib/pdf/fonts'
import { ReportDocument } from '@/components/report/ReportDocument'
import type { AnalysisResult } from '@/types/analysis'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const analysisId = searchParams.get('id')

  if (!analysisId) {
    return NextResponse.json({ error: '분석 ID가 필요합니다.' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', user.id)   // 반드시 user_id 조건 포함
    .single()

  if (!analysis || analysis.status !== 'done') {
    return NextResponse.json({ error: '분석 결과를 찾을 수 없습니다.' }, { status: 404 })
  }

  const result = analysis.analysis_result as AnalysisResult

  // 폰트 등록 (API Route 내에서 매번 호출해도 무방 — Font.register는 중복 등록 시 무시)
  registerFonts()

  const buffer = await renderToBuffer(
    createElement(ReportDocument, {
      result,
      createdAt: analysis.created_at,
    })
  )

  // 파일명: {기업명}_재무분석보고서_{YYYYMMDD}.pdf
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const fileName = `${result.company.name}_재무분석보고서_${dateStr}.pdf`

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  })
}
```

---

### T6. 보고서 미리보기 페이지

`app/dashboard/[id]/report/page.tsx` (서버 컴포넌트)

```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReportPreview from '@/components/report/ReportPreview'

export default async function ReportPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('id, status, analysis_result, created_at')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (!analysis || analysis.status !== 'done') notFound()

  return <ReportPreview analysisId={params.id} companyName={(analysis.analysis_result as any)?.company?.name ?? ''} />
}
```

`components/report/ReportPreview.tsx` (`'use client'`)

```typescript
'use client'

type Props = {
  analysisId: string
  companyName: string
}

export default function ReportPreview({ analysisId, companyName }: Props) {
  const downloadUrl = `/api/report?id=${analysisId}`

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const fileName = `${companyName}_재무분석보고서_${dateStr}.pdf`

  return (
    <div className="px-5 py-6">
      <h1 className="text-lg font-medium mb-1">대표 제출용 보고서</h1>
      <p className="text-sm text-gray-500 mb-6">
        영업 멘트를 제외한 재무 요약본입니다. A4 1~2페이지로 출력됩니다.
      </p>

      {/* PDF 인라인 미리보기 */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6" style={{ height: '70vh' }}>
        <iframe
          src={`${downloadUrl}&inline=1`}
          className="w-full h-full"
          title="보고서 미리보기"
        />
      </div>

      <a href={downloadUrl} download={fileName}>
        <button className="bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800">
          PDF 다운로드
        </button>
      </a>
      <p className="text-xs text-gray-500 mt-1">{fileName}</p>
    </div>
  )
}
```

> **주의:** `inline=1` 쿼리가 있을 때 `Content-Disposition`을 `inline`으로 변경해야 미리보기가 동작함.
> `/api/report` 라우트에서 `searchParams.get('inline') === '1'`이면 `inline; filename=...`으로 설정.

`app/api/report/route.ts` 수정 — inline 지원 추가:

```typescript
const inline = searchParams.get('inline') === '1'
const disposition = inline
  ? `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`
  : `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`

return new NextResponse(buffer, {
  headers: {
    'Content-Type': 'application/pdf',
    'Content-Disposition': disposition,
  },
})
```

---

## 완료 기준 체크리스트

```
[ ] /dashboard/[id]/report 접속 시 미리보기 iframe 정상 표시
[ ] PDF 다운로드 버튼 클릭 → {기업명}_재무분석보고서_{YYYYMMDD}.pdf 다운로드 확인
[ ] 다운로드된 PDF 열었을 때 한글 깨짐 없음
[ ] A4 1~2페이지 이내 출력 확인
[ ] salesScripts (영업 멘트) 내용이 PDF에 포함되지 않음 확인
[ ] 타인의 analysisId로 /api/report 접근 → 404 처리 확인
[ ] status !== 'done'인 분석에 대해 /api/report 접근 → 404 처리 확인
[ ] npx tsc --noEmit → 에러 0개
```

---

## 완료 후

이 파일을 `docs/exec-plans/completed/` 로 이동.
`docs/PLANS.md`의 Phase 5 상태를 `✅ 완료`로 업데이트.
다음: `docs/exec-plans/active/phase-6-finish.md`

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import path from 'path'
import type { AnalysisResult } from '@/types/analysis'

Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: path.resolve(process.cwd(), 'public/fonts/NotoSansKR-Regular.ttf'),
      fontWeight: 400,
    },
    {
      src: path.resolve(process.cwd(), 'public/fonts/NotoSansKR-Regular.ttf'),
      fontWeight: 700,
    },
  ],
})

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSansKR',
    fontSize: 9,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    color: '#111',
  },
  // Header
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#1d4ed8',
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1d4ed8',
    marginBottom: 4,
  },
  headerMeta: {
    fontSize: 8,
    color: '#6b7280',
    flexDirection: 'row',
    gap: 16,
  },
  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#1d4ed8',
    marginBottom: 6,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  // Company overview
  companyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  companyField: {
    width: '48%',
    flexDirection: 'row',
    marginBottom: 3,
  },
  fieldLabel: {
    width: 64,
    color: '#6b7280',
    fontWeight: 700,
  },
  fieldValue: {
    flex: 1,
    color: '#111',
  },
  // Summary
  summaryText: {
    lineHeight: 1.6,
    color: '#374151',
  },
  // Table
  table: {
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 4,
  },
  tableHeader: {
    backgroundColor: '#eff6ff',
  },
  tableHeaderText: {
    fontWeight: 700,
    color: '#1d4ed8',
    fontSize: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 8,
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  tableCellFirst: {
    flex: 1.5,
    fontSize: 8,
    paddingHorizontal: 4,
    color: '#374151',
  },
  // Issues
  issueItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  issueBadge: {
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    fontWeight: 700,
  },
  issueBadgeCritical: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
  },
  issueBadgeWarning: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  issueContent: {
    flex: 1,
  },
  issueTitle: {
    fontWeight: 700,
    marginBottom: 2,
  },
  issueDesc: {
    color: '#6b7280',
    lineHeight: 1.4,
  },
  // Strengths
  strengthItem: {
    marginBottom: 5,
  },
  strengthTitle: {
    fontWeight: 700,
    marginBottom: 1,
  },
  strengthDesc: {
    color: '#6b7280',
    lineHeight: 1.4,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: '#9ca3af',
  },
})

function formatKRW(millions: number): string {
  if (Math.abs(millions) >= 10000) return `${(millions / 10000).toFixed(1)}억`
  return `${millions.toLocaleString()}백만`
}

function formatPct(v: number): string {
  return `${v.toFixed(1)}%`
}

type Props = {
  analysis: AnalysisResult
  createdAt: string
}

export default function ReportDocument({ analysis, createdAt: _createdAt }: Props) {
  const { company, financials, summary, issues, strengths } = analysis
  const latestYear = financials.years[financials.years.length - 1]
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{company.name}</Text>
          <View style={styles.headerMeta}>
            <Text>결산 기준: {latestYear}년</Text>
            <Text>작성일: {today}</Text>
            {company.creditGrade && <Text>신용등급: {company.creditGrade}</Text>}
          </View>
        </View>

        {/* 기업 개요 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기업 개요</Text>
          <View style={styles.companyGrid}>
            <View style={styles.companyField}>
              <Text style={styles.fieldLabel}>사업자번호</Text>
              <Text style={styles.fieldValue}>{company.bizNumber}</Text>
            </View>
            <View style={styles.companyField}>
              <Text style={styles.fieldLabel}>대표자</Text>
              <Text style={styles.fieldValue}>{company.ceo}</Text>
            </View>
            <View style={styles.companyField}>
              <Text style={styles.fieldLabel}>업종</Text>
              <Text style={styles.fieldValue}>{company.industry}</Text>
            </View>
            <View style={styles.companyField}>
              <Text style={styles.fieldLabel}>설립연도</Text>
              <Text style={styles.fieldValue}>{company.foundedYear}년</Text>
            </View>
            {company.employeeCount > 0 && (
              <View style={styles.companyField}>
                <Text style={styles.fieldLabel}>임직원 수</Text>
                <Text style={styles.fieldValue}>{company.employeeCount.toLocaleString()}명</Text>
              </View>
            )}
            {company.industryRank && (
              <View style={styles.companyField}>
                <Text style={styles.fieldLabel}>업계 순위</Text>
                <Text style={styles.fieldValue}>{company.industryRank}위</Text>
              </View>
            )}
          </View>
          {company.address && (
            <View style={[styles.companyField, { marginTop: 4 }]}>
              <Text style={styles.fieldLabel}>주소</Text>
              <Text style={styles.fieldValue}>{company.address}</Text>
            </View>
          )}
        </View>

        {/* 기업 요약 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>재무 요약</Text>
          <Text style={styles.summaryText}>{summary}</Text>
        </View>

        {/* 핵심 재무 현황 테이블 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>핵심 재무 현황 (단위: 백만 원, %)</Text>
          <View style={styles.table}>
            {/* Table header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCellFirst, styles.tableHeaderText]}>구분</Text>
              {financials.years.map((year) => (
                <Text key={year} style={[styles.tableCell, styles.tableHeaderText]}>
                  {year}년
                </Text>
              ))}
            </View>
            {/* Rows */}
            {[
              { label: '매출액', data: financials.revenue, fmt: formatKRW },
              { label: '영업이익', data: financials.operatingProfit, fmt: formatKRW },
              { label: '당기순이익', data: financials.netIncome, fmt: formatKRW },
              { label: '총자산', data: financials.totalAssets, fmt: formatKRW },
              { label: '영업이익률', data: financials.operatingMargin, fmt: formatPct },
              { label: '부채비율', data: financials.debtRatio, fmt: formatPct },
              { label: 'ROE', data: financials.roe, fmt: formatPct },
            ].map(({ label, data, fmt }) => (
              <View key={label} style={styles.tableRow}>
                <Text style={styles.tableCellFirst}>{label}</Text>
                {data.map((v, i) => (
                  <Text key={i} style={styles.tableCell}>
                    {fmt(v)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* 주요 발견 사항 (최대 3개) */}
        {issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>주요 발견 사항</Text>
            {issues.slice(0, 3).map((issue, i) => (
              <View key={i} style={styles.issueItem}>
                <Text
                  style={[
                    styles.issueBadge,
                    issue.severity === 'critical'
                      ? styles.issueBadgeCritical
                      : styles.issueBadgeWarning,
                  ]}
                >
                  {issue.severity === 'critical' ? '위험' : '주의'}
                </Text>
                <View style={styles.issueContent}>
                  <Text style={styles.issueTitle}>{issue.title}</Text>
                  <Text style={styles.issueDesc}>{issue.description}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 컨설팅 제안 포인트 (최대 2개, strengths에서) */}
        {strengths.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>컨설팅 제안 포인트</Text>
            {strengths.slice(0, 2).map((s, i) => (
              <View key={i} style={styles.strengthItem}>
                <Text style={styles.strengthTitle}>{s.title}</Text>
                <Text style={styles.strengthDesc}>{s.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>본 보고서는 내부 영업 참고용입니다. 외부 배포 금지.</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}

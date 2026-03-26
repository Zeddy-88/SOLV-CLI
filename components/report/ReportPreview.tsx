'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/types/analysis'

type Props = {
  analysisId: string
  analysis: AnalysisResult
}

export default function ReportPreview({ analysisId, analysis }: Props) {
  const [downloading, setDownloading] = useState(false)

  const { company, financials, issues, strengths } = analysis
  const latestYear = financials.years[financials.years.length - 1]
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const filename = `${company.name}_재무분석보고서_${dateStr}.pdf`

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/report/${analysisId}`)
      if (!res.ok) throw new Error('PDF 생성 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('PDF 다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      {/* Back */}
      <a
        href={`/dashboard/${analysisId}`}
        className="text-sm text-blue-700 underline mb-6 inline-block"
      >
        ← 브리핑 화면으로 돌아가기
      </a>

      {/* Preview card */}
      <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
        {/* Title bar */}
        <div className="bg-blue-700 px-6 py-4">
          <h1 className="text-white font-bold text-lg">{company.name}</h1>
          <div className="text-blue-200 text-sm flex gap-4 mt-1">
            <span>결산 기준: {latestYear}년</span>
            <span>작성일: {today}</span>
            {company.creditGrade && <span>신용등급: {company.creditGrade}</span>}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 기업 개요 */}
          <section>
            <h2 className="text-sm font-bold text-blue-700 border-b border-blue-100 pb-1 mb-3">
              기업 개요
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20 shrink-0">사업자번호</dt>
                <dd>{company.bizNumber}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20 shrink-0">대표자</dt>
                <dd>{company.ceo}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20 shrink-0">업종</dt>
                <dd>{company.industry}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-gray-500 w-20 shrink-0">설립연도</dt>
                <dd>{company.foundedYear}년</dd>
              </div>
              {company.employeeCount > 0 && (
                <div className="flex gap-2">
                  <dt className="text-gray-500 w-20 shrink-0">임직원 수</dt>
                  <dd>{company.employeeCount.toLocaleString()}명</dd>
                </div>
              )}
            </dl>
          </section>

          {/* 재무 요약 */}
          <section>
            <h2 className="text-sm font-bold text-blue-700 border-b border-blue-100 pb-1 mb-3">
              재무 요약
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{analysis.summary}</p>
          </section>

          {/* 핵심 재무 현황 */}
          <section>
            <h2 className="text-sm font-bold text-blue-700 border-b border-blue-100 pb-1 mb-3">
              핵심 재무 현황
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="text-left px-2 py-1.5 text-blue-700">구분</th>
                    {financials.years.map((y) => (
                      <th key={y} className="text-right px-2 py-1.5 text-blue-700">
                        {y}년
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[
                    { label: '매출액 (억)', data: financials.revenue.map((v) => (v / 10000).toFixed(1)) },
                    { label: '영업이익 (억)', data: financials.operatingProfit.map((v) => (v / 10000).toFixed(1)) },
                    { label: '당기순이익 (억)', data: financials.netIncome.map((v) => (v / 10000).toFixed(1)) },
                    { label: '영업이익률', data: financials.operatingMargin.map((v) => `${v.toFixed(1)}%`) },
                    { label: '부채비율', data: financials.debtRatio.map((v) => `${v.toFixed(1)}%`) },
                    { label: 'ROE', data: financials.roe.map((v) => `${v.toFixed(1)}%`) },
                  ].map(({ label, data }) => (
                    <tr key={label}>
                      <td className="px-2 py-1.5 text-gray-600">{label}</td>
                      {data.map((v, i) => (
                        <td key={i} className="px-2 py-1.5 text-right">
                          {v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 주요 발견 사항 */}
          {issues.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-blue-700 border-b border-blue-100 pb-1 mb-3">
                주요 발견 사항 (최대 3개)
              </h2>
              <ul className="space-y-2">
                {issues.slice(0, 3).map((issue, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span
                      className={`shrink-0 text-xs font-bold px-1.5 py-0.5 rounded ${
                        issue.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {issue.severity === 'critical' ? '위험' : '주의'}
                    </span>
                    <div>
                      <p className="font-medium">{issue.title}</p>
                      <p className="text-gray-500 text-xs">{issue.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 컨설팅 제안 포인트 */}
          {strengths.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-blue-700 border-b border-blue-100 pb-1 mb-3">
                컨설팅 제안 포인트 (최대 2개)
              </h2>
              <ul className="space-y-2">
                {strengths.slice(0, 2).map((s, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-medium">{s.title}</p>
                    <p className="text-gray-500 text-xs">{s.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Notice */}
          <p className="text-xs text-gray-400 border-t pt-3">
            본 보고서는 내부 영업 참고용입니다. 외부 배포 금지. · 영업 멘트 미포함
          </p>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full bg-blue-700 text-white font-medium py-3 rounded-lg hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
      </button>
      <p className="text-center text-xs text-gray-400 mt-2">A4 1~2페이지 · 한글 정상 출력</p>
    </div>
  )
}

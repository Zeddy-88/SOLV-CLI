'use client'

import { useState } from 'react'
import UploadZone from '@/components/upload/UploadZone'
import AnalysisProgress from '@/components/upload/AnalysisProgress'

export default function HomeClient() {
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  if (analysisId) {
    return (
      <AnalysisProgress
        analysisId={analysisId}
        onRetry={() => setAnalysisId(null)}
      />
    )
  }

  return (
    <>
      <h1 className="text-lg font-medium mb-1">재무 분석 시작</h1>
      <p className="text-sm text-gray-500 mb-6">
        기업 종합 보고서 PDF를 업로드하면 AI가 재무 데이터를 분석합니다.
      </p>
      <UploadZone onUploaded={setAnalysisId} />
    </>
  )
}

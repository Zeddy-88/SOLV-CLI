'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'

type Props = {
  analysisId: string
  onRetry: () => void
}

export default function AnalysisProgress({ analysisId, onRetry }: Props) {
  const router = useRouter()
  const status = useAnalysisStatus(analysisId)

  useEffect(() => {
    if (status === 'done') {
      router.push(`/dashboard/${analysisId}`)
    }
  }, [status, analysisId, router])

  if (status === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <span className="text-red-600 text-lg">!</span>
        </div>
        <p className="text-sm font-medium text-gray-900 mb-1">분석 중 문제가 발생했어요.</p>
        <p className="text-xs text-gray-400 mb-4">잠시 후 다시 시도해주세요.</p>
        <button
          onClick={onRetry}
          className="text-sm text-blue-700 underline underline-offset-2"
        >
          다시 시도
        </button>
      </div>
    )
  }

  const message =
    status === 'pending'
      ? '파일을 업로드하고 있어요...'
      : 'AI가 분석하고 있어요. 잠깐만 기다려주세요.'

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-700">{message}</p>
      {status === 'processing' && (
        <p className="text-xs text-gray-400 mt-1">보통 30초~1분 정도 걸려요</p>
      )}
    </div>
  )
}

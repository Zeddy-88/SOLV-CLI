'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAnalysisStatus } from '@/hooks/useAnalysisStatus'
import type { AnalysisStatus } from '@/types/analysis'

type AnalysisLoadingProps = {
  analysisId: string
  initialStatus: AnalysisStatus
}

const STATUS_MESSAGE: Record<AnalysisStatus, string> = {
  pending: '파일을 업로드하고 있어요...',
  processing: 'AI가 분석하고 있어요. 잠깐만 기다려주세요.',
  done: '분석이 완료됐어요.',
  error: '분석 중 오류가 발생했습니다.',
}

export default function AnalysisLoading({ analysisId, initialStatus }: AnalysisLoadingProps) {
  const status = useAnalysisStatus(analysisId)
  const router = useRouter()

  useEffect(() => {
    if (status === 'done') {
      router.refresh()
    }
  }, [status, router])

  if (status === 'error') {
    return (
      <div className="px-5 py-6">
        <p className="text-sm text-red-700 mb-3">분석 중 오류가 발생했습니다.</p>
        <Link href="/" className="text-sm text-blue-700 underline">다시 시도하기</Link>
      </div>
    )
  }

  const message = STATUS_MESSAGE[status] ?? STATUS_MESSAGE[initialStatus]

  return (
    <div className="px-5 py-6">
      <div className="animate-pulse space-y-6">
        <div className="h-16 bg-gray-100 rounded-lg" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="h-32 bg-gray-100 rounded-lg" />
        <div className="h-40 bg-gray-100 rounded-lg" />
      </div>
      <p className="text-sm text-gray-500 mt-6 text-center">{message}</p>
    </div>
  )
}

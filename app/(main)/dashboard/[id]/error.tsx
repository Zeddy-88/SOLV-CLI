'use client'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  return (
    <div className="px-5 py-6">
      <h2 className="text-base font-medium text-red-700 mb-2">
        분석 결과를 불러올 수 없습니다
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        {error.message || '잠시 후 다시 시도해주세요.'}
      </p>
      <button
        onClick={unstable_retry}
        className="bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800"
      >
        다시 시도
      </button>
    </div>
  )
}

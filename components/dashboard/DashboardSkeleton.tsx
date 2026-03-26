export default function DashboardSkeleton() {
  return (
    <div className="px-5 py-6 space-y-6 animate-pulse">
      {/* 회사 헤더 */}
      <div>
        <div className="h-5 w-48 bg-gray-100 rounded mb-2" />
        <div className="h-3 w-32 bg-gray-100 rounded" />
      </div>

      {/* 지표 카드 4개 */}
      <div className="grid grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="h-3 w-20 bg-gray-100 rounded mb-3" />
            <div className="h-5 w-24 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* 테이블 */}
      <div className="border border-gray-200 rounded-lg p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-3 w-24 bg-gray-100 rounded" />
            <div className="h-3 flex-1 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

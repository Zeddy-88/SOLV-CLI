import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="px-5 py-6">
      <p className="text-sm text-gray-700 mb-3">분석 결과를 찾을 수 없습니다.</p>
      <Link href="/" className="text-sm text-blue-700 underline">
        홈으로 돌아가기
      </Link>
    </div>
  )
}

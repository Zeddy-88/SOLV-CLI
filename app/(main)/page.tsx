import UploadZone from '@/components/upload/UploadZone'

export default function HomePage() {
  return (
    <div className="px-5 py-6">
      <h1 className="text-lg font-medium mb-1">재무 분석 시작</h1>
      <p className="text-sm text-gray-500 mb-6">
        기업 종합 보고서 PDF를 업로드하면 AI가 재무 데이터를 분석합니다.
      </p>
      <UploadZone />
    </div>
  )
}

type ReportButtonProps = {
  analysisId: string
}

export default function ReportButton({ analysisId }: ReportButtonProps) {
  return (
    <div className="pt-2">
      <a href={`/dashboard/${analysisId}/report`}>
        <button className="bg-blue-700 text-blue-50 rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-800">
          대표 제출용 보고서 만들기
        </button>
      </a>
      <p className="text-xs text-gray-500 mt-1">영업 멘트를 제외한 재무 요약본 · A4 1~2페이지</p>
    </div>
  )
}

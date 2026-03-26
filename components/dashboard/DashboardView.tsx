import type { AnalysisResult } from '@/types/analysis'
import CompanyHeader from './CompanyHeader'
import MetricCards from './MetricCards'
import FinancialTrend from './FinancialTrend'
import DiagnosisSection from './DiagnosisSection'
import IssuesList from './IssuesList'
import PersonasSection from './PersonasSection'
import SalesScripts from './SalesScripts'
import ReportButton from './ReportButton'

type Analysis = {
  id: string
  pdf_format: string
  created_at: string
  analysis_result: unknown
}

type DashboardViewProps = {
  analysis: Analysis
}

export default function DashboardView({ analysis }: DashboardViewProps) {
  const result = analysis.analysis_result as AnalysisResult

  return (
    <div className="px-5 py-6 space-y-6">
      <CompanyHeader
        company={result.company}
        format={analysis.pdf_format}
        createdAt={analysis.created_at}
      />
      <MetricCards financials={result.financials} />
      <div className="grid grid-cols-2 gap-3">
        {result.diagnosis && <DiagnosisSection diagnosis={result.diagnosis} />}
        <FinancialTrend financials={result.financials} />
      </div>
      <IssuesList issues={result.issues} />
      <PersonasSection personas={result.personas} />
      <SalesScripts salesScripts={result.salesScripts} />
      <ReportButton analysisId={analysis.id} />
    </div>
  )
}

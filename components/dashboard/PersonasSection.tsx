import type { AnalysisResult, PersonaOpinion } from '@/types/analysis'

type PersonasSectionProps = {
  personas: AnalysisResult['personas']
}

type PersonaCardConfig = {
  key: keyof Omit<AnalysisResult['personas'], 'integrated'>
  bg: string
  text: string
}

const PERSONA_CONFIGS: PersonaCardConfig[] = [
  { key: 'financialConsultant', bg: 'bg-blue-50', text: 'text-blue-800' },
  { key: 'salesExpert', bg: 'bg-green-50', text: 'text-green-800' },
  { key: 'communicationExpert', bg: 'bg-purple-50', text: 'text-purple-800' },
  { key: 'psychologist', bg: 'bg-amber-50', text: 'text-amber-800' },
]

function PersonaCard({ persona, bg, text }: { persona: PersonaOpinion; bg: string; text: string }) {
  return (
    <div className={`rounded-lg p-4 ${bg}`}>
      <div className="mb-2">
        <p className={`text-sm font-medium ${text}`}>{persona.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{persona.role}</p>
      </div>
      <p className="text-xs text-gray-700 leading-relaxed">{persona.opinion}</p>
      <p className={`text-xs font-medium mt-3 ${text}`}>{persona.keyPoint}</p>
    </div>
  )
}

export default function PersonasSection({ personas }: PersonasSectionProps) {
  return (
    <div>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">4인 전문가 분석</h2>
      <div className="grid grid-cols-2 gap-3">
        {PERSONA_CONFIGS.map(({ key, bg, text }) => (
          <PersonaCard key={key} persona={personas[key]} bg={bg} text={text} />
        ))}
      </div>
      <div className="border-t border-gray-100 mt-4 pt-4">
        <p className="text-xs font-medium text-gray-700 mb-2">4인 전문가 통합 의견</p>
        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-line">
          {personas.integrated}
        </div>
      </div>
    </div>
  )
}

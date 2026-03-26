'use client'

import { useState } from 'react'
import type { AnalysisResult } from '@/types/analysis'

type SalesScriptsProps = {
  salesScripts: AnalysisResult['salesScripts']
}

const STEPS = [
  { key: 'opening', label: '오프닝', step: '1단계' },
  { key: 'problemDetail', label: '문제 구체화', step: '2단계' },
  { key: 'urgency', label: '위기감 조성', step: '3단계' },
  { key: 'closing', label: '클로징', step: '4단계' },
] as const

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

export default function SalesScripts({ salesScripts }: SalesScriptsProps) {
  const [toastVisible, setToastVisible] = useState(false)

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }

  return (
    <div>
      <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">영업 추천 멘트</h2>
      <div className="space-y-2">
        {STEPS.map(({ key, label, step }) => (
          <div key={key} className="border border-gray-200 rounded-lg px-4 py-3 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 font-medium">{step}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed pr-8">{salesScripts[key]}</p>
            <button
              onClick={() => handleCopy(salesScripts[key])}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label={`${label} 복사`}
            >
              <CopyIcon />
            </button>
          </div>
        ))}
      </div>

      {toastVisible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-4 py-2 rounded-full">
          복사됨
        </div>
      )}
    </div>
  )
}

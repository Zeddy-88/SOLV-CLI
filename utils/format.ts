export function formatKRW(millions: number): string {
  if (millions >= 10000) return `${(millions / 10000).toFixed(1)}억 원`
  return `${millions.toLocaleString('ko-KR')}백만 원`
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`
}

export function formatChange(value: number, unit = '%'): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}${unit}`
}

export function getDiagnosisColor(grade: string): string {
  if (['우수', '양호'].includes(grade)) return 'text-green-700'
  if (['보통'].includes(grade)) return 'text-amber-700'
  return 'text-red-700'
}

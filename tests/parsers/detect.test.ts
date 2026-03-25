import { describe, it, expect } from 'vitest'
import { detectFormat } from '@/lib/parsers/detect'

describe('detectFormat', () => {
  it('CRETOP 감지 — CRETOP 키워드', () => {
    expect(detectFormat('CRETOP 기업신용평가')).toBe('cretop')
  })

  it('CRETOP 감지 — 한국평가데이터 키워드', () => {
    expect(detectFormat('한국평가데이터 보고서')).toBe('cretop')
  })

  it('CRETOP 감지 — K0DATA 키워드', () => {
    expect(detectFormat('K0DATA 신용분석')).toBe('cretop')
  })

  it('NICE 감지 — NICE평가정보 키워드', () => {
    expect(detectFormat('NICE평가정보 분석')).toBe('nice')
  })

  it('NICE 감지 — NICE BizLINE 키워드', () => {
    expect(detectFormat('NICE BizLINE 리포트')).toBe('nice')
  })

  it('NICE 감지 — NICEbizline 키워드', () => {
    expect(detectFormat('NICEbizline 기업분석')).toBe('nice')
  })

  it('기타 포맷 — 알 수 없는 텍스트', () => {
    expect(detectFormat('일반 재무제표')).toBe('generic')
  })

  it('기타 포맷 — 빈 문자열', () => {
    expect(detectFormat('')).toBe('generic')
  })
})

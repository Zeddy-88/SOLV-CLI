import type { PdfFormat } from '@/types/financial'

export function detectFormat(text: string): PdfFormat {
  if (
    text.includes('K0DATA') ||
    text.includes('한국평가데이터') ||
    text.includes('CRETOP')
  ) {
    return 'cretop'
  }
  if (
    text.includes('NICE평가정보') ||
    text.includes('NICE BizLINE') ||
    text.includes('NICEbizline')
  ) {
    return 'nice'
  }
  return 'generic'
}

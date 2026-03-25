import { detectFormat } from './detect'
import { extractTextFromPdf } from './extract'
import { parseCretop } from './cretop'
import { parseNice } from './nice'
import { parseGeneric } from './generic'
import type { FinancialData } from '@/types/financial'

export async function parseReport(buffer: Buffer): Promise<FinancialData> {
  const text = await extractTextFromPdf(buffer)
  const format = detectFormat(text)

  switch (format) {
    case 'cretop': return parseCretop(text)
    case 'nice':   return parseNice(text)
    default:       return parseGeneric(text)
  }
}

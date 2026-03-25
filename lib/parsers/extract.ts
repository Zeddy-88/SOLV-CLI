import { createRequire } from 'module'

const require = createRequire(import.meta.url)
// pdf-parse ESM 패키지는 CJS 엔트리를 직접 require로 불러옴
const pdfParse = require('pdf-parse/dist/pdf-parse/cjs/index.cjs') as (
  buffer: Buffer
) => Promise<{ text: string }>

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer)

  if (!data.text || data.text.trim().length < 100) {
    throw new Error(
      '텍스트를 추출할 수 없습니다. 스캔본 PDF는 지원하지 않습니다.'
    )
  }

  return data.text
}

import { PDFParse } from 'pdf-parse'

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdf = new PDFParse({ data: buffer })
  const result = await pdf.getText()

  if (!result.text || result.text.trim().length < 100) {
    throw new Error(
      '텍스트를 추출할 수 없습니다. 스캔본 PDF는 지원하지 않습니다.'
    )
  }

  return result.text
}

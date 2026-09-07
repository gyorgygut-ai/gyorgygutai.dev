import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

export async function generatePdf(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  pdfDoc.setCreationDate(new Date("2026-01-01T00:00:00Z"))
  pdfDoc.setModificationDate(new Date("2026-01-01T00:00:00Z"))
  pdfDoc.setCreator("")
  pdfDoc.setProducer("")
  pdfDoc.setTitle("")
  pdfDoc.setAuthor("")

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const firstPage = pdfDoc.addPage()
  const { width, height } = firstPage.getSize()
  const fontSize = 12
  const lineHeight = 16
  const margin = 50
  const maxWidth = width - margin * 2

  function wrapText(input: string): string[] {
    if (font.widthOfTextAtSize(input, fontSize) <= maxWidth) 
{return [input]}
    const words = input.split(" ")
    const out: string[] = []
    let cur = ""
    for (const w of words) {
      const test = cur ? cur + " " + w : w
      if (font.widthOfTextAtSize(test, fontSize) <= maxWidth) {
        cur = test
      } else {
        if (cur) 
{out.push(cur)}
        if (font.widthOfTextAtSize(w, fontSize) > maxWidth) {
          let chunk = ""
          for (const ch of w) {
            if (font.widthOfTextAtSize(chunk + ch, fontSize) <= maxWidth) 
{chunk += ch}
            else {
              out.push(chunk)
              chunk = ch
            }
          }
          cur = chunk
        } else 
{cur = w}
      }
    }
    if (cur) 
{out.push(cur)}
    return out
  }

  let y = height - margin
  let currentPage = firstPage

  for (const rawLine of text.split("\n")) {
    if (rawLine.trim() === "") {
      y -= lineHeight
      if (y < margin) {
        currentPage = pdfDoc.addPage()
        y = currentPage.getSize().height - margin
      }
      continue
    }
    const wrapped = wrapText(rawLine)
    for (const wline of wrapped) {
      if (y < margin) {
        currentPage = pdfDoc.addPage()
        y = currentPage.getSize().height - margin
      }
      currentPage.drawText(wline, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      })
      y -= lineHeight
    }
  }

  return pdfDoc.save()
}

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

  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const fontSize = 12
  const lineHeight = 16
  const margin = 50
  const maxWidth = width - margin * 2

  const lines = text.split("\n")
  let y = height - margin

  for (const line of lines) {
    if (y < margin) {
      const nextPage = pdfDoc.addPage()
      y = nextPage.getSize().height - margin
    }

    const currentPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1]

    if (line.trim() === "") {
      y -= lineHeight
      continue
    }

    currentPage.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth,
      lineHeight,
    })

    y -= lineHeight
  }

  return pdfDoc.save()
}

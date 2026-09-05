import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { htmlFromObsidianMd } from "./htmlFromObsidianMd";

export async function pdfFromObsidianMd(
  markdown: string,
): Promise<Uint8Array> {
  const html = await htmlFromObsidianMd(markdown);
  const plainText = stripHtml(html);
  return generatePdf(plainText);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function generatePdf(text: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;
  const lineHeight = 16;
  const margin = 50;
  const maxWidth = width - margin * 2;

  const lines = text.split("\n");
  let y = height - margin;

  for (const line of lines) {
    if (y < margin) {
      const nextPage = pdfDoc.addPage();
      y = nextPage.getSize().height - margin;
    }

    const currentPage = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];

    if (line.trim() === "") {
      y -= lineHeight;
      continue;
    }

    currentPage.drawText(line, {
      x: margin,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth,
      lineHeight,
    });

    y -= lineHeight;
  }

  return pdfDoc.save();
}
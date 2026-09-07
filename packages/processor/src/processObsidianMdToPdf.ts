import { processObsidianMdToHtml } from "./processObsidianMdToHtml"
import { stripHtml } from "./parser/stripHtml"
import { generatePdf } from "./parser/generatePdf"

export async function processObsidianMdToPdf(markdown: string, vaultFiles?: Record<string, string>): Promise<Uint8Array> {
  const html = await processObsidianMdToHtml(markdown, undefined, vaultFiles)
  const plainText = stripHtml(html)
  return generatePdf(plainText)
}

export default processObsidianMdToPdf

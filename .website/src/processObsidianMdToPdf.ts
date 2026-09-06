import { processObsidianMdToHtml } from "./processObsidianMdToHtml";
import { stripHtml } from "./parser/stripHtml";
import { generatePdf } from "./parser/generatePdf";

export async function processObsidianMdToPdf(markdown: string): Promise<Uint8Array> {
  const html = await processObsidianMdToHtml(markdown);
  const plainText = stripHtml(html);
  return generatePdf(plainText);
}

export default processObsidianMdToPdf;

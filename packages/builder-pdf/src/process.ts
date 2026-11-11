import { process as processHtml } from "@gyorgygutai/builder-website"
import puppeteer from "puppeteer"

export interface ProcessPdfInput {
  markdown: string
  vaultFiles?: Record<string, string>
  path?: string
  customCss?: string[]
  customJs?: string[]
  assets?: Record<string, string>
}

const ASSET_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  avif: "image/avif",
  ico: "image/x-icon",
}

export function inlineAssets(html: string, assets: Record<string, string> = {}): string {
  return Object.entries(assets).reduce((output, [rel, base64]) => {
    const route = `/${rel.replace(/^\/+/, "")}`
    const ext = rel.split(".").pop()?.toLowerCase() ?? ""
    const mime = ASSET_MIME[ext] ?? "application/octet-stream"
    return output.split(`"${route}"`).join(`"data:${mime};base64,${base64}"`)
  }, html)
}

export async function process(input: ProcessPdfInput): Promise<Uint8Array> {
  const html = await processHtml({
    markdown: input.markdown,
    vaultFiles: input.vaultFiles,
    path: input.path,
    customCss: input.customCss ?? [],
    customJs: input.customJs ?? [],
  })

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 827, height: 1169 })
    await page.setContent(inlineAssets(html, input.assets), { waitUntil: "networkidle0" })
    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "20mm", right: "20mm" },
    })
  } finally {
    await browser.close()
  }
}

export default process

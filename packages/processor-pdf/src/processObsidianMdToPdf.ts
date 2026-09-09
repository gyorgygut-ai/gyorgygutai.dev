import { unified } from "unified"
import { createPreset, parseFrontmatter, type VaultFiles } from "@gyorgygutai/preset-obsidian-md"
import rehypeStringify from "rehype-stringify"
import { stripHtml } from "./parser/stripHtml"
import { generatePdf } from "./parser/generatePdf"

export interface ProcessPdfInput {
  markdown: string
  vaultFiles?: VaultFiles
  path?: string
}

export async function process(input: ProcessPdfInput): Promise<Uint8Array>
export async function process(markdown: string, vaultFiles?: VaultFiles, path?: string): Promise<Uint8Array>

export async function process(a: string | ProcessPdfInput, b?: VaultFiles, c?: string): Promise<Uint8Array> {
  const input = typeof a === "string" ? { markdown: a, vaultFiles: b, path: c } : a
  const { content } = parseFrontmatter(input.markdown)
  const processor = unified().use(createPreset({ vaultFiles: input.vaultFiles ?? {}, path: input.path }))
  processor.use(rehypeStringify, { allowDangerousHtml: true })
  const html = String(await processor.process(content))
  const plainText = stripHtml(html)
  return generatePdf(plainText)
}
export default process

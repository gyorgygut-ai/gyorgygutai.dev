import { unified } from "unified"
import { VFile } from "vfile"
import grayMatter from "gray-matter"
import preset from "@gyorgygutai/preset-obsidian-md"
import { createDocument } from "./createDocument.js"

export interface ProcessWebsiteInput {
  markdown: string
  meta?: Record<string, unknown>
  vaultFiles?: Record<string, string>
  path?: string
  customCss: string[]
  customJs?: string[]
}

export async function process(input: ProcessWebsiteInput): Promise<string> {
  const { content, data } = grayMatter(input.markdown)
  const processor = unified().use(preset)
  processor.use(createDocument({ customCss: input.customCss, customJs: input.customJs, meta: input.meta }))
  const file = new VFile(content)
  file.data.meta = { ...data, ...input.meta }
  file.data.vaultFiles = input.vaultFiles ?? {}
  file.data.path = input.path
  if (input.meta?.title || data.title) {
    file.data.title = String(input.meta?.title ?? data.title ?? "")
  }
  const html = String(await processor.process(file))
  return html
}
export default process

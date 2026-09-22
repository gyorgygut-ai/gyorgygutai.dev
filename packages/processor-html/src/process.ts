import { unified } from "unified"
import { VFile } from "vfile"
import grayMatter from "gray-matter"
import createPreset from "@gyorgygutai/preset-obsidian-md"
import { createShell } from "@gyorgygutai/preset-website"

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
  const processor = unified().use(createPreset({ vaultFiles: input.vaultFiles ?? {}, path: input.path }))
  processor.use(createShell({ customCss: input.customCss, customJs: input.customJs, meta: input.meta }))
  const file = new VFile(content)
  file.data.meta = { ...data, ...input.meta }
  if (input.meta?.title || data.title) {
    file.data.title = String(input.meta?.title ?? data.title ?? "")
  }
  const html = String(await processor.process(file))
  return html
}
export default process

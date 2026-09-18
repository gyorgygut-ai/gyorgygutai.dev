import { unified } from "unified"
import { VFile } from "vfile"
import { createPreset, parseFrontmatter, type VaultFiles } from "@gyorgygutai/preset-obsidian-md"
import { createShell } from "@gyorgygutai/preset-website-shell"

export interface ProcessWebsiteInput {
  markdown: string
  meta?: Record<string, unknown>
  vaultFiles?: VaultFiles
  path?: string
  customCss: string[]
  customJs?: string[]
}

export async function process(input: ProcessWebsiteInput): Promise<string> {
  const { content, data } = parseFrontmatter(input.markdown)
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

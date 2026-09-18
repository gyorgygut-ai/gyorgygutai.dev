import { unified } from "unified"
import { VFile } from "vfile"
import { createPreset, parseFrontmatter, type VaultFiles } from "@gyorgygutai/preset-obsidian-md"
import shellPlugins from "@gyorgygutai/preset-website-shell"

export interface ProcessWebsiteInput {
  markdown: string
  meta?: Record<string, unknown>
  vaultFiles?: VaultFiles
  path?: string
  css: string[]
}

export async function process(input: ProcessWebsiteInput): Promise<string> {
  const { content, data } = parseFrontmatter(input.markdown)
  const processor = unified().use(createPreset({ vaultFiles: input.vaultFiles ?? {}, path: input.path }))
  processor.use(shellPlugins)
  const file = new VFile(content)
  file.data.meta = { ...data, ...input.meta }
  if (input.meta?.title || data.title) {
    file.data.title = String(input.meta?.title ?? data.title ?? "")
  }
  let html = String(await processor.process(file))
  if (input.css.length > 0) {
    html = html.replace("</head>", `<style>\n${input.css.join("\n").trim()}\n</style></head>`)
  }
  return html
}
export default process

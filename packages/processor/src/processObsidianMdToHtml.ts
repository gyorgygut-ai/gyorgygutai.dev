import { unified } from "unified"
import { parseFrontmatter } from "./parser/parseFrontmatter"
import markdown from "./plugin/markdown"
import obsidian from "./plugin/obsidian"
import transclude, { setVaultFiles } from "./plugin/transclude"
import callout from "./plugin/callout"
import wikilink from "./plugin/wikilink"
import raw from "./plugin/raw"
import obsidianHtml from "./plugin/obsidianHtml"
import stringify from "./plugin/stringify"

export async function processObsidianMdToHtml(input: string, css?: string, vaultFiles?: Record<string, string>): Promise<string> {
  const { content } = parseFrontmatter(input)
  const processor = unified().use(markdown).use(...obsidian).use(transclude).use(callout).use(...wikilink).use(raw).use(...obsidianHtml).use(...stringify)
  if (vaultFiles !== undefined) {
    ;(processor as unknown as { data(key: string, value: unknown): void }).data("vaultFiles", vaultFiles)
    setVaultFiles(vaultFiles)
  }
  try {
    const html = String(await processor.process(content))
    return css ? `<style>\n${css}\n</style>\n${html}` : html
  } finally {
    if (vaultFiles !== undefined) {
      setVaultFiles(null)
    }
  }
}

export default processObsidianMdToHtml

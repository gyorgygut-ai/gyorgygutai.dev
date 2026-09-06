import { unified } from "unified"
import { parseFrontmatter } from "./parser/parseFrontmatter"
import markdown from "./plugin/markdown"
import obsidian from "./plugin/obsidian"
import callout from "./plugin/callout"
import wikilink from "./plugin/wikilink"
import raw from "./plugin/raw"
import obsidianHtml from "./plugin/obsidianHtml"
import stringify from "./plugin/stringify"

export async function processObsidianMdToHtml(input: string, css?: string): Promise<string> {
  const { content } = parseFrontmatter(input)
  const html = String(await unified().use(markdown).use(...obsidian).use(callout).use(...wikilink).use(raw).use(...obsidianHtml).use(...stringify).process(content))
  return css ? `<style>\n${css}\n</style>\n${html}` : html
}

export default processObsidianMdToHtml

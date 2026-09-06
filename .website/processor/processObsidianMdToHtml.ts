import { unified } from "unified"
import { parseFrontmatter } from "./parser/parseFrontmatter"
import { markdown } from "./plugin/markdown"
import { obsidian } from "./plugin/obsidian"
import { callout } from "./plugin/callout"
import { wikilink } from "./plugin/wikilink"
import { raw } from "./plugin/raw"
import { obsidianHtml } from "./plugin/obsidianHtml"
import { stringify } from "./plugin/stringify"

export async function processObsidianMdToHtml(input: string, cssOrOptions?: string | { cssDir?: string }): Promise<string> {
  const { content } = parseFrontmatter(input)
  const body = content

  const processor = unified()
    .use(markdown)
    .use(...(obsidian as any))
    .use(callout)
    .use(...(wikilink as any))
    .use(raw)
    .use(...(obsidianHtml as any))
    .use(...(stringify as any))

  const html = String(await processor.process(body))

  let css: string | undefined
  if (typeof cssOrOptions === "string") {
    css = cssOrOptions
  } else if (cssOrOptions && typeof cssOrOptions === "object" && (cssOrOptions as any).cssDir) {
    const { readCssSnippets } = await import("./glue/readCssSnippets")
    css = readCssSnippets((cssOrOptions as any).cssDir)
  }

  if (css) {
    return `<style>\n${css}\n</style>\n${html}`
  }

  return html
}

export default processObsidianMdToHtml

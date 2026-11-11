import type { PluggableList } from "unified"
import remarkParse from "remark-parse"
import remarkObsidian from "@quartz-community/remark-obsidian"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeObsidian from "@quartz-community/rehype-obsidian"
import remarkObsidianCallout from "@gyorgygutai/remark-plugin-obsidian-callout"
import remarkObsidianTransclusion from "@gyorgygutai/remark-plugin-obsidian-transclusion"
import { wikilinkHandler } from "@gyorgygutai/remark-rehype-obsidian-wikilink-handler"

const obsidianOptions = {
  wikilinks: true,
  highlights: true,
  comments: true,
  tags: true,
  customTaskChars: true,
  math: true,
}

const rehypeOptions = { allowDangerousHtml: true, handlers: { wikilink: wikilinkHandler } }
const htmlOptions = { checkbox: true, mermaid: false }

const preset: PluggableList = [
  remarkParse,
  [remarkObsidian, obsidianOptions],
  remarkObsidianTransclusion,
  remarkObsidianCallout,
  [remarkRehype, rehypeOptions],
  rehypeRaw,
  [rehypeObsidian, htmlOptions],
]

export default preset

import grayMatter from "gray-matter"
import remarkParse from "./plugin/remarkParse"
import remarkObsidian from "./plugin/remarkObsidian"
import remarkRehype from "./plugin/remarkRehype"
import rehypeRaw from "./plugin/rehypeRaw"
import rehypeObsidian from "./plugin/rehypeObsidian"
import { resolveTranscludes } from "./plugin/resolveTranscludes"
import callout from "./plugin/callout"
import { wikilinkHandler } from "./plugin/wikilink"

export type VaultFiles = Record<string, string>

export interface PresetOptions {
  vaultFiles: VaultFiles
  path?: string
}

export function parseFrontmatter(markdown: string): { content: string; data: Record<string, unknown> } {
  const { content, data } = grayMatter(markdown)
  return { content, data }
}

export function hasAs(data: Record<string, unknown>, target: string): boolean {
  const as = data.as as string | string[] | undefined
  if (Array.isArray(as)) {
    return as.includes(target)
  }
  return as === target
}

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

export function createPreset(options: PresetOptions) {
  const transcludes = [resolveTranscludes, { vaultFiles: options.vaultFiles, path: options.path }] as [
    typeof resolveTranscludes,
    { vaultFiles: VaultFiles; path?: string },
  ]
  return [
    remarkParse,
    [remarkObsidian, obsidianOptions] as [typeof remarkObsidian, typeof obsidianOptions],
    transcludes,
    callout,
    [remarkRehype, rehypeOptions] as [typeof remarkRehype, typeof rehypeOptions],
    rehypeRaw,
    [rehypeObsidian, htmlOptions] as [typeof rehypeObsidian, typeof htmlOptions],
  ]
}

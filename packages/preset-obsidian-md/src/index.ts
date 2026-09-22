import grayMatter from "gray-matter"
import remarkParse from "./plugin/remarkParse"
import remarkObsidian from "./plugin/remarkObsidian"
import remarkRehype from "./plugin/remarkRehype"
import rehypeRaw from "./plugin/rehypeRaw"
import rehypeObsidian from "./plugin/rehypeObsidian"
import { resolveTranscludes } from "./plugin/transclusion"
import callout from "./plugin/callout"
import { wikilinkHandler } from "./plugin/wikilink"

export type VaultFiles = Record<string, string>

export interface PresetOptions {
  vaultFiles: VaultFiles
  path?: string
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

export default function createPreset(options: PresetOptions) {
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

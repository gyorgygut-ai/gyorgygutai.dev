import markdown from "./plugin/markdown"
import obsidian from "./plugin/obsidian"
import { resolveTranscludes, type ResolveTranscludesOptions } from "./plugin/resolveTranscludes"
import callout from "./plugin/callout"
import wikilink from "./plugin/wikilink"
import raw from "./plugin/raw"
import obsidianHtml from "./plugin/obsidianHtml"
import type { VaultFiles } from "./types"

export interface PresetOptions {
  vaultFiles: VaultFiles
  path?: string
}

export function createPreset(options: PresetOptions) {
  const transcludeEntry = [resolveTranscludes, { vaultFiles: options.vaultFiles, path: options.path }] as [
    typeof resolveTranscludes,
    ResolveTranscludesOptions,
  ]
  return [markdown, obsidian, transcludeEntry, callout, wikilink, raw, obsidianHtml]
}

const defaultTranscludeEntry = [resolveTranscludes, { vaultFiles: {} as VaultFiles }] as [
  typeof resolveTranscludes,
  ResolveTranscludesOptions,
]

export default [markdown, obsidian, defaultTranscludeEntry, callout, wikilink, raw, obsidianHtml]

export { parseFrontmatter } from "./parser/parseFrontmatter"
export { hasAs } from "./parser/hasAs"
export type { VaultFiles, AssetFiles, AppearanceOrder } from "./types"

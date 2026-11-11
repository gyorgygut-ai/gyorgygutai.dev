import type { Paragraph, Root } from "mdast"
import type { Processor } from "unified"
import grayMatter from "gray-matter"
import { SKIP, visit } from "unist-util-visit"

interface WikilinkNode {
  type: "wikilink"
  embedded: boolean
  path: string
  alias: string
}

export type VaultFiles = Record<string, string>

const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp|svg)$/i

function buildIndex(vaultFiles: VaultFiles): Map<string, string> {
  return Object.keys(vaultFiles).reduce((index, key) => {
    const base = key.split("/").pop() ?? key
    return [key, base, base.replace(/\.md$/i, "")].reduce((result, variant) => {
      const lowered = variant.toLowerCase()
      return result.has(lowered) ? result : result.set(lowered, key)
    }, index)
  }, new Map<string, string>())
}

function note(text: string): Paragraph {
  return { type: "paragraph", children: [{ type: "html", value: `<em>${text}</em>` }] }
}

function isEmbeddable(node: Paragraph): boolean {
  return node.children.every((child) => {
    if (child.type === "text" && child.value.trim() === "") {return true}
    const candidate: unknown = child
    return isWikilink(candidate) && candidate.embedded && candidate.path.length > 0 && candidate.alias.length === 0 && !IMAGE_EXT.test(candidate.path)
  })
}

function isWikilink(node: unknown): node is WikilinkNode {
  return typeof node === "object" && node !== null && "type" in node && node.type === "wikilink"
}

function resolveKey(index: Map<string, string>, target: string): string | undefined {
  return index.get(target.toLowerCase()) ?? index.get(`${target.toLowerCase()}.md`)
}

export function remarkObsidianTransclusion(this: Processor) {
  return (tree: Root, file: { data: Record<string, unknown> }) => {
    const context = file.data as { vaultFiles?: VaultFiles; path?: string }
    const vaultFiles = context.vaultFiles ?? {}
    const index = buildIndex(vaultFiles)
    const rootKey = context.path ? index.get(context.path.toLowerCase()) : undefined
    const expand = (nodeTree: Root, seen: Set<string>): void => {
      visit(nodeTree, "paragraph", (node, idx, parent) => {
        if (!parent || typeof idx !== "number" || !isEmbeddable(node)) {return}
        const blocks = node.children.flatMap((child): Root["children"] => {
          const candidate: unknown = child
          if (!isWikilink(candidate)) {return []}
          const target = candidate.path.replace(/\.md$/i, "")
          const key = resolveKey(index, target)
          if (!key) {return [note(`Transclusion missing: ${candidate.path}`)]}
          if (seen.has(key)) {return [note(`Transclusion cycle detected: ${candidate.path}`)]}
          seen.add(key)
          const sub = this.parse(grayMatter(vaultFiles[key] ?? "").content) as Root
          expand(sub, seen)
          seen.delete(key)
          return sub.children
        })
        parent.children.splice(idx, 1, ...blocks)
        return [SKIP, idx + blocks.length] as const
      })
    }
    const seen = new Set<string>()
    if (rootKey) {seen.add(rootKey)}
    expand(tree, seen)
  }
}

export default remarkObsidianTransclusion

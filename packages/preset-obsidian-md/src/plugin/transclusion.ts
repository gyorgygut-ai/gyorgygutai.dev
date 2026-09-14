import type { Paragraph, Root } from "mdast"
import type { Processor } from "unified"
import type { Wikilink } from "@quartz-community/remark-obsidian"
import grayMatter from "gray-matter"
import { SKIP, visit } from "unist-util-visit"
import type { VaultFiles } from "../index"

const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp|svg)$/i

function buildIndex(vaultFiles: VaultFiles): Map<string, string> {
  const index = new Map<string, string>()
  for (const key of Object.keys(vaultFiles)) {
    const base = key.split("/").pop() ?? key
    for (const variant of [key, base, base.replace(/\.md$/i, "")]) {
      const lowered = variant.toLowerCase()
      if (!index.has(lowered)) {
        index.set(lowered, key)
      }
    }
  }
  return index
}

function note(text: string): Paragraph {
  return {
    type: "paragraph",
    children: [{ type: "html", value: `<em>${text}</em>` }],
  }
}

function isEmbeddable(node: Paragraph): boolean {
  return node.children.every(
    (child) =>
      (child.type === "text" && child.value.trim() === "") ||
      (child.type === "wikilink" &&
        child.embedded &&
        child.path.length > 0 &&
        child.alias.length === 0 &&
        !IMAGE_EXT.test(child.path)),
  )
}

function resolveKey(index: Map<string, string>, target: string): string | undefined {
  return index.get(target.toLowerCase()) ?? index.get(`${target.toLowerCase()}.md`)
}

export function resolveTranscludes(this: Processor, options: { vaultFiles: VaultFiles; path?: string }) {
  const index = buildIndex(options.vaultFiles)
  const { vaultFiles } = options
  const rootKey = options.path ? index.get(options.path.toLowerCase()) : undefined

  const expand = (tree: Root, seen: Set<string>): void => {
    visit(tree, "paragraph", (node, idx, parent) => {
      if (!parent || typeof idx !== "number") {
        return
      }
      if (!isEmbeddable(node)) {
        return
      }
      const blocks: Root["children"] = []
      for (const child of node.children) {
        if (child.type !== "wikilink") {
          continue
        }
        const target = child.path.replace(/\.md$/i, "")
        const key = resolveKey(index, target)
        if (!key) {
          blocks.push(note(`Transclusion missing: ${child.path}`))
          continue
        }
        if (seen.has(key)) {
          blocks.push(note(`Transclusion cycle detected: ${child.path}`))
          continue
        }
        seen.add(key)
        const sub = this.parse(grayMatter(vaultFiles[key] ?? "").content) as Root
        expand(sub, seen)
        seen.delete(key)
        blocks.push(...sub.children)
      }
      parent.children.splice(idx, 1, ...blocks)
      return [SKIP, idx + blocks.length] as const
    })
  }

  return (tree: Root) => {
    const seen = new Set<string>()
    if (rootKey) {
      seen.add(rootKey)
    }
    expand(tree, seen)
  }
}
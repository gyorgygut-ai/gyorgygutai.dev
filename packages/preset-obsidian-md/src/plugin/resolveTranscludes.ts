import type { Paragraph, Root } from "mdast"
import remarkParse from "remark-parse"
import { unified } from "unified"
import { SKIP, visit } from "unist-util-visit"
import { parseFrontmatter } from "../parser/parseFrontmatter"
import type { VaultFiles } from "../types"
import remarkObsidian from "@quartz-community/remark-obsidian"

interface WikilinkNode {
  type: string
  embedded?: boolean
  path?: string
  alias?: string
}

function isNoteEmbed(node: WikilinkNode): boolean {
  if (!node.embedded) {
    return false
  }
  if (typeof node.path !== "string" || node.path.length === 0) {
    return false
  }
  if (node.alias && node.alias.length > 0) {
    return false
  }
  if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.path)) {
    return false
  }
  return true
}

function buildIndex(vaultFiles: VaultFiles): Map<string, string> {
  const index = new Map<string, string>()
  for (const key of Object.keys(vaultFiles)) {
    const base = key.split("/").pop() ?? key
    const noExt = base.replace(/\.md$/i, "")
    for (const variant of [key, base, noExt]) {
      const lowered = variant.toLowerCase()
      if (!index.has(lowered)) {
        index.set(lowered, key)
      }
    }
  }
  return index
}

function parseNote(markdown: string): Root {
  const { content } = parseFrontmatter(markdown)
  return unified()
    .use(remarkParse)
    .use(remarkObsidian, { wikilinks: true, highlights: true, comments: true, tags: true, customTaskChars: true, math: true })
    .parse(content)
}

function messageParagraph(text: string): Paragraph {
  return {
    type: "paragraph",
    children: [{ type: "html", value: `<em>${text}</em>` }],
  }
}

export interface ResolveTranscludesOptions {
  vaultFiles: VaultFiles
  path?: string
}

export function resolveTranscludes(options: ResolveTranscludesOptions) {
  const index = buildIndex(options.vaultFiles)
  const vaultFiles = options.vaultFiles
  const rootKey = options.path ? index.get(options.path.toLowerCase()) : undefined

  function resolveTarget(target: string): { key: string } | { missing: string } {
    const key = index.get(target.toLowerCase()) ?? index.get(`${target.toLowerCase()}.md`)
    if (!key) {
      return { missing: target }
    }
    return { key }
  }

  function expand(tree: Root, seen: Set<string>): void {
    visit(tree, "paragraph", (node, idx, parent) => {
      if (!parent || typeof idx !== "number") {
        return
      }
      const embeddable = node.children.every(
        (child) =>
          (child.type === "wikilink" && isNoteEmbed(child as WikilinkNode)) ||
          (child.type === "text" && (child as { value: string }).value.trim() === "")
      )
      if (!embeddable) {
        return
      }
      const blocks: Root["children"] = []
      for (const child of node.children) {
        if (child.type !== "wikilink") {
          continue
        }
        const link = child as WikilinkNode
        const target = (link.path ?? "").replace(/\.md$/i, "")
        const resolved = resolveTarget(target)
        if ("missing" in resolved) {
          blocks.push(messageParagraph(`Transclusion missing: ${resolved.missing}`))
          continue
        }
        if (seen.has(resolved.key)) {
          blocks.push(messageParagraph(`Transclusion cycle detected: ${link.path}`))
          continue
        }
        const raw = vaultFiles[resolved.key]
        if (typeof raw !== "string") {
          blocks.push(messageParagraph(`Transclusion missing: ${target}`))
          continue
        }
        const sub = parseNote(raw)
        seen.add(resolved.key)
        expand(sub, seen)
        seen.delete(resolved.key)
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

export default resolveTranscludes

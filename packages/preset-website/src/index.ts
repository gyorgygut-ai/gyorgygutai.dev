import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import type { PluggableList } from "unified"
import rehypeDocument from "rehype-document"
import rehypeStringify from "rehype-stringify"
import type { Element, Root, RootContent } from "hast"
import { rehypeMain } from "./rehypeMain"
import injectStyles from "./injectStyles"

const dirnamePath = dirname(new URL(import.meta.url).pathname)

const BUILTIN_CSS = [
  readFileSync(join(dirnamePath, "obsidian-vars.css"), "utf-8"),
  readFileSync(join(dirnamePath, "obsidian.css"), "utf-8"),
]

export interface ShellConfig {
  customCss?: string[]
  customJs?: string[]
  meta?: Record<string, unknown>
}

function isElement(node: RootContent): node is Element {
  return node.type === "element"
}

function injectMetaAndAssets(this: unknown, config: ShellConfig = {}): (tree: Root) => void {
  return (tree) => {
    const html = tree.children.find(isElement)
    if (!html || html.tagName !== "html") {
      return
    }
    const head = html.children.find(isElement)
    if (!head || head.tagName !== "head") {
      return
    }
    const hasColorScheme = head.children.some(
      (n): n is Element =>
        isElement(n) &&
        n.tagName === "meta" &&
        n.properties?.name === "color-scheme"
    )
    if (!hasColorScheme) {
      head.children.push({
        type: "element",
        tagName: "meta",
        properties: { name: "color-scheme", content: "dark light" },
        children: [],
      })
    }
    const meta = config.meta ?? {}
    if (meta.description) {
      const hasDesc = head.children.some(
        (n): n is Element =>
          isElement(n) &&
          n.tagName === "meta" &&
          n.properties?.name === "description"
      )
      if (!hasDesc) {
        head.children.push({
          type: "element",
          tagName: "meta",
          properties: { name: "description", content: String(meta.description) },
          children: [],
        })
      }
    }
    if (meta.title) {
      const hasTitle = head.children.some(
        (n): n is Element => isElement(n) && n.tagName === "title"
      )
      if (!hasTitle) {
        head.children.push({
          type: "element",
          tagName: "title",
          properties: {},
          children: [{ type: "text", value: String(meta.title) }],
        })
      }
    }
    const customJs = config.customJs ?? []
    for (const js of customJs) {
      head.children.push({
        type: "element",
        tagName: "script",
        properties: { type: "module" },
        children: [{ type: "text", value: js }],
      })
    }
  }
}

export function createShell(config: ShellConfig = {}): PluggableList {
  return [
    [rehypeDocument, { title: "", responsive: true, language: "en" }],
    [injectMetaAndAssets, config],
    [injectStyles, [...BUILTIN_CSS, ...(config.customCss ?? [])]],
    rehypeMain,
    [rehypeStringify, { allowDangerousHtml: true }],
  ]
}

export default createShell

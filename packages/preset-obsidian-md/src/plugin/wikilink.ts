import remarkRehype from "remark-rehype"
import type { Element, Root } from "hast"

function normalizeAssetPath(p: string): string {
  const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "")
  return "/" + cleaned
}

interface WikilinkNode {
  embedded?: boolean
  path?: string
  alias?: string
}

interface WikilinkState {
  all: (node: Root) => Element[]
}

export function wikilinkHandler(state: WikilinkState, node: WikilinkNode): Element {
  const rawPath = typeof node.path === "string" ? node.path : ""
  const path = normalizeAssetPath(rawPath)
  if (node.embedded && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path)) {
    const width = typeof node.alias === "string" && node.alias ? Number.parseInt(node.alias, 10) : Number.NaN
    return {
      type: "element",
      tagName: "img",
      properties: {
        src: path,
        alt: path.split("/").pop() || path,
        ...(Number.isFinite(width) ? { width } : {}),
      },
      children: [],
    }
  }
  if (node.embedded) {
    return {
      type: "element",
      tagName: "span",
      properties: {
        className: ["transclude"],
        "data-path": path,
      },
      children: [],
    }
  }
  return {
    type: "element",
    tagName: "a",
    properties: { href: "#" + path },
    children: state.all(node as unknown as Root),
  }
}

export default [
  remarkRehype,
  { allowDangerousHtml: true, handlers: { wikilink: wikilinkHandler } },
] as [typeof remarkRehype, Record<string, unknown>]

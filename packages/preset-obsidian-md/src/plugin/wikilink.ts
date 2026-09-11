import type { Element, Root } from "hast"
import type { Wikilink } from "@quartz-community/remark-obsidian"

function normalizeAssetPath(p: string): string {
  const cleaned = p.replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "")
  return "/" + cleaned
}

interface WikilinkState {
  all: (node: Root) => Element[]
}

export function wikilinkHandler(state: WikilinkState, node: Wikilink): Element {
  const path = normalizeAssetPath(node.path)
  if (node.embedded && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path)) {
    const width = node.alias ? Number.parseInt(node.alias, 10) : Number.NaN
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
    properties: { href: `#${path}` },
    children: state.all(node as unknown as Root),
  }
}

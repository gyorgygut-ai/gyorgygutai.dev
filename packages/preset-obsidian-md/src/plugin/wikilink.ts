import type { Element, Root } from "hast"
import type { Wikilink } from "@quartz-community/remark-obsidian"

const IMAGE_EXT = /\.(png|jpg|jpeg|gif|webp|svg)$/i

export function wikilinkHandler(state: { all: (node: Root) => Element[] }, node: Wikilink): Element {
  const path = "/" + node.path.replace(/^(\.\/|\.\.\/)+/, "").replace(/^\/+/, "")
  if (node.embedded && IMAGE_EXT.test(path)) {
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
      properties: { className: ["transclude"], "data-path": path },
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
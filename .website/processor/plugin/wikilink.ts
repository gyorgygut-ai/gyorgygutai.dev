import remarkRehype from "remark-rehype"

export function wikilinkHandler(state: unknown, node: unknown) {
  const n = node as { embedded?: unknown; path?: unknown; alias?: unknown }
  const s = state as { all: (node: unknown) => unknown }
  const path = typeof n.path === "string" ? n.path : ""
  if (n.embedded && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(path)) {
    return {
      type: "element",
      tagName: "img",
      properties: {
        src: path,
        alt: path.split("/").pop() || path,
        ...(typeof n.alias === "string" && n.alias ? { width: parseInt(n.alias) } : {}),
      },
      children: [],
    }
  }
  if (n.embedded) {
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
    children: [s.all(node)],
  }
}

export const wikilink: [typeof remarkRehype, Record<string, unknown>] = [
  remarkRehype,
  { allowDangerousHtml: true, handlers: { wikilink: wikilinkHandler } },
]

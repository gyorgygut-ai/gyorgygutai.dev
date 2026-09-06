import remarkRehype from "remark-rehype"

function normalizeAssetPath(p: string): string {
  return p.replace(/^(\.\/|\.\.\/)+/, "")
}

export function wikilinkHandler(state: unknown, node: unknown) {
  const n = node as { embedded?: unknown; path?: unknown; alias?: unknown }
  const s = state as { all: (node: unknown) => unknown }
  const rawPath = typeof n.path === "string" ? n.path : ""
  const path = normalizeAssetPath(rawPath)
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

export default [remarkRehype, { allowDangerousHtml: true, handlers: { wikilink: wikilinkHandler } }] as unknown as [typeof remarkRehype, Record<string, unknown>]

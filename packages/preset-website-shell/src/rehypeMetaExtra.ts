import type { Root, Element, RootContent } from "hast"
import type { VFile } from "vfile"

function isElement(node: RootContent): node is Element {
  return node.type === "element"
}

interface MetaData {
  title?: string
  description?: string
  colorScheme?: string
}

export function rehypeMetaExtra() {
  return (tree: Root, file: VFile) => {
    const data = file.data as Record<string, unknown>
    const meta = (data.meta ?? {}) as MetaData

    const html = tree.children.find(isElement)
    if (!html || html.tagName !== "html") 
{return}

    const head = html.children.find(isElement)
    if (!head || head.tagName !== "head") 
{return}

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
  }
}

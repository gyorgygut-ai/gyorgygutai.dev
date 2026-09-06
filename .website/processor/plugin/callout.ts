import { visit } from "unist-util-visit"

export default function callout() {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], "blockquote", (node: unknown) => {
      const n = node as {
        children?: Array<{
          type?: unknown
          children?: Array<{ value?: unknown }>
          value?: unknown
        }>
        data?: { hProperties?: unknown }
      }
      if (n.children && n.children.length > 0) {
        const firstChild = n.children[0]
        if (firstChild.type === "paragraph") {
          const text = typeof firstChild.children?.[0]?.value === "string" ? (firstChild.children[0].value as string) : ""
          const match = text.match(/^\[!([^\]]+)\]\s*(.*)$/)
          if (match) {
            const [, type, title] = match
            n.data = n.data || {}
            n.data.hProperties = {
              className: ["callout", `callout-${type.toLowerCase()}`],
              "data-callout": type.toLowerCase(),
              "data-callout-title": title || type,
            }
            const fc = firstChild as { children?: Array<{ value?: unknown }> }
            if (fc.children && fc.children[0]) {
              const target = fc.children[0] as { value: string }
              target.value = title || ""
            }
            if (title === "" || title === undefined) {
              firstChild.children?.shift()
            }
          }
        }
      }
    })
  }
}

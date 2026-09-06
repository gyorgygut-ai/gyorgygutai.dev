import { visit } from "unist-util-visit"

export function callout() {
  return (tree: any) => {
    visit(tree, "blockquote", (node: any) => {
      if (node.children && node.children.length > 0) {
        const firstChild = node.children[0]
        if (firstChild.type === "paragraph") {
          const text = firstChild.children?.[0]?.value || ""
          const match = text.match(/^\[!([^\]]+)\]\s*(.*)$/)
          if (match) {
            const [, type, title] = match
            node.data = node.data || {}
            node.data.hProperties = {
              className: ["callout", `callout-${type.toLowerCase()}`],
              "data-callout": type.toLowerCase(),
              "data-callout-title": title || type,
            }
            firstChild.children[0].value = title || ""
            if (title === "" || title === undefined) {
              firstChild.children.shift()
            }
          }
        }
      }
    })
  }
}

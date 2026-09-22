import type { Element, Root, RootContent } from "hast"

function isElement(node: RootContent): node is Element {
  return node.type === "element"
}

export default function injectStyles(css: string[]) {
  return (tree: Root) => {
    const html = tree.children.find(isElement)
    if (!html || html.tagName !== "html") {
      return
    }
    const head = html.children.find(isElement)
    if (!head || head.tagName !== "head") {
      return
    }
    for (const cssText of css) {
      head.children.push({
        type: "element",
        tagName: "style",
        properties: {},
        children: [{ type: "text", value: cssText }],
      })
    }
  }
}

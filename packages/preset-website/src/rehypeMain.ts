import type { Root, Element, RootContent } from "hast"

function isElement(node: RootContent): node is Element {
  return node.type === "element"
}

export function rehypeMain() {
  return (tree: Root) => {
    const html = tree.children.find(isElement)
    if (!html || html.tagName !== "html") 
{return}

    const body = html.children.find((c): c is Element => isElement(c) && c.tagName === "body")
    if (!body) 
{return}

    const main: Element = {
      type: "element",
      tagName: "main",
      properties: { className: ["content"] },
      children: [...body.children],
    }
    body.children = [main]
  }
}


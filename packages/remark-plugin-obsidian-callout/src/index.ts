import type { Blockquote, Paragraph, Root } from "mdast"
import { visit } from "unist-util-visit"

export default function remarkObsidianCallout() {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote) => {
      const firstChild = node.children[0]
      if (!firstChild || firstChild.type !== "paragraph") {return}
      const paragraph = firstChild as Paragraph
      const firstInline = paragraph.children[0]
      const text = firstInline?.type === "text" ? firstInline.value : ""
      const newlineAt = text.indexOf("\n")
      const firstLine = newlineAt === -1 ? text : text.slice(0, newlineAt)
      const rest = newlineAt === -1 ? "" : text.slice(newlineAt)
      const match = firstLine.match(/^\[!([^\]]+)\][ \t]*(.*)$/)
      if (!match) {return}
      const [, rawType, title] = match
      const type = (rawType ?? "").toLowerCase()
      const data = (node.data ?? {}) as NonNullable<Blockquote["data"]> & { hProperties: Record<string, unknown> }
      data.hProperties = {
        className: ["callout", `callout-${type}`],
        "data-callout": type,
        "data-callout-title": title || type,
      }
      node.data = data
      if (firstInline?.type === "text") {firstInline.value = (title || "") + rest}
      if ((title === "" || title === undefined) && rest.trim() === "") {paragraph.children.shift()}
    })
  }
}

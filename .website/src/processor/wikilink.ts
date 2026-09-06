import remarkRehype from "remark-rehype";

export function wikilinkHandler(state: any, node: any) {
  if (node.embedded && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(node.path)) {
    return {
      type: "element",
      tagName: "img",
      properties: {
        src: node.path,
        alt: node.path.split("/").pop() || node.path,
        ...(node.alias ? { width: parseInt(node.alias) } : {}),
      },
      children: [],
    };
  }
  if (node.embedded) {
    return {
      type: "element",
      tagName: "span",
      properties: {
        className: ["transclude"],
        "data-path": node.path,
      },
      children: [],
    };
  }
  return {
    type: "element",
    tagName: "a",
    properties: { href: "#" + node.path },
    children: [state.all(node)],
  };
}

export const wikilink: any = [
  remarkRehype as any,
  { allowDangerousHtml: true, handlers: { wikilink: wikilinkHandler } },
];

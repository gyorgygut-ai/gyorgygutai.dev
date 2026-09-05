import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remarkObsidian from "@quartz-community/remark-obsidian";
import rehypeObsidian from "@quartz-community/rehype-obsidian";
import grayMatter from "gray-matter";
import { visit } from "unist-util-visit";

interface HtmlOptions {
  cssDir?: string;
}

function remarkCallout() {
  return (tree: any) => {
    visit(tree, "blockquote", (node: any) => {
      if (node.children && node.children.length > 0) {
        const firstChild = node.children[0];
        if (firstChild.type === "paragraph") {
          const text = firstChild.children?.[0]?.value || "";
          const match = text.match(/^\[!([^\]]+)\]\s*(.*)$/);
          if (match) {
            const [, type, title] = match;
            node.data = node.data || {};
            node.data.hProperties = {
              className: ["callout", `callout-${type.toLowerCase()}`],
              "data-callout": type.toLowerCase(),
              "data-callout-title": title || type,
            };
            firstChild.children[0].value = title || "";
            if (title === "" || title === undefined) {
              firstChild.children.shift();
            }
          }
        }
      }
    });
  };
}

function wikilinkHandler(state: any, node: any) {
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

function readCssSnippets(cssDir: string): string {
  const files = readdirSync(cssDir).filter((f) => f.endsWith(".css"));
  return files
    .map((f) => readFileSync(join(cssDir, f), "utf-8"))
    .join("\n");
}

export async function htmlFromObsidianMd(
  markdown: string,
  options: HtmlOptions = {},
): Promise<string> {
  const { content, data: frontmatter } = grayMatter(markdown);
  const body = content || markdown;

  const processor = unified()
    .use(remarkParse)
    .use(remarkObsidian, { wikilinks: true, highlights: true, comments: true, tags: true, customTaskChars: true, math: true })
    .use(remarkCallout)
    .use(remarkRehype, { allowDangerousHtml: true, handlers: { wikilink: wikilinkHandler } })
    .use(rehypeRaw)
    .use(rehypeObsidian, { checkbox: true, mermaid: false })
    .use(rehypeStringify, { allowDangerousHtml: true });

  const html = String(await processor.process(body));

  if (options.cssDir) {
    const css = readCssSnippets(options.cssDir);
    if (css) {
      return `<style>\n${css}\n</style>\n${html}`;
    }
  }

  return html;
}
import { unified } from "unified";
import { parseFrontmatter } from "./parser/parseFrontmatter";
import { markdown } from "./processor/markdown";
import { obsidian } from "./processor/obsidian";
import { callout } from "./processor/callout";
import { wikilink } from "./processor/wikilink";
import { raw } from "./processor/raw";
import { obsidianHtml } from "./processor/obsidianHtml";
import { stringify } from "./processor/stringify";

export async function processObsidianMdToHtml(input: string, cssOrOptions?: string | { cssDir?: string }): Promise<string> {
  const { content } = parseFrontmatter(input);
  const body = content;

  const processor = unified()
    .use(markdown)
    .use(...(obsidian as any))
    .use(callout)
    .use(...(wikilink as any))
    .use(raw)
    .use(...(obsidianHtml as any))
    .use(...(stringify as any));

  const html = String(await processor.process(body));

  let css: string | undefined;
  if (typeof cssOrOptions === "string") {
    css = cssOrOptions;
  } else if (cssOrOptions && typeof cssOrOptions === "object" && (cssOrOptions as any).cssDir) {
    const { readCssSnippets } = await import("./glue/readCssSnippets");
    css = readCssSnippets((cssOrOptions as any).cssDir);
  }

  if (css) {
    return `<style>\n${css}\n</style>\n${html}`;
  }

  return html;
}

export default processObsidianMdToHtml;

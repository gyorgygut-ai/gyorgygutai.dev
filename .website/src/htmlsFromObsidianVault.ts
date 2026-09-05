import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import grayMatter from "gray-matter";
import { htmlFromObsidianMd } from "./htmlFromObsidianMd";

interface HtmlOptions {
  cssDir?: string;
}

export async function htmlsFromObsidianVault(
  vaultDir: string,
  options: HtmlOptions = {},
): Promise<Record<string, string>> {
  const files = readdirSync(vaultDir).filter((f) => f.endsWith(".md"));
  const result: Record<string, string> = {};

  for (const file of files) {
    const content = readFileSync(join(vaultDir, file), "utf-8");
    const { data } = grayMatter(content);

    if (data["dg-publish"] !== true && data["publish"] !== true) {
      continue;
    }

    result[file] = await htmlFromObsidianMd(content, options);
  }

  return result;
}
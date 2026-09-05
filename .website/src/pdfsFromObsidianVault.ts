import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import grayMatter from "gray-matter";
import { pdfFromObsidianMd } from "./pdfFromObsidianMd";

export async function pdfsFromObsidianVault(
  vaultDir: string,
): Promise<Record<string, Uint8Array>> {
  const files = readdirSync(vaultDir).filter((f) => f.endsWith(".md"));
  const result: Record<string, Uint8Array> = {};

  for (const file of files) {
    const content = readFileSync(join(vaultDir, file), "utf-8");
    const { data } = grayMatter(content);

    if (data["dg-publish"] !== true && data["publish"] !== true) {
      continue;
    }

    result[file] = await pdfFromObsidianMd(content);
  }

  return result;
}
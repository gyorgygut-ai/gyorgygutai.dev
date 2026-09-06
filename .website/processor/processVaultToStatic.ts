import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { parseFrontmatter } from "./parser/parseFrontmatter"
import { processObsidianMdToHtml } from "./processObsidianMdToHtml"
import { processObsidianMdToPdf } from "./processObsidianMdToPdf"
import { readCssSnippets } from "./glue/readCssSnippets"

interface VaultOptions {
  cssDir?: string;
}

function hasAs(data: Record<string, unknown>, target: string): boolean {
  const as = data["as"]
  if (Array.isArray(as)) return as.includes(target)
  return as === target
}

export async function processVaultToStatic(
  vaultDir: string,
  options: VaultOptions = {},
): Promise<{ html: Record<string, string>; pdf: Record<string, Uint8Array> }> {
  const files = readdirSync(vaultDir).filter((f) => f.endsWith(".md"))
  const html: Record<string, string> = {}
  const pdf: Record<string, Uint8Array> = {}
  const css = options.cssDir ? readCssSnippets(options.cssDir) : undefined

  for (const file of files) {
    const content = readFileSync(join(vaultDir, file), "utf-8")
    const { data } = parseFrontmatter(content)

    const isPage = hasAs(data, "page")
    const isHome = hasAs(data, "home")
    const isPdf = hasAs(data, "pdf")
    if (!isPage && !isHome && !isPdf) continue

    if (isPage || isHome) {
      html[file] = await processObsidianMdToHtml(content, css)
    }
    if (isPdf) {
      pdf[file] = await processObsidianMdToPdf(content)
    }
  }

  return { html, pdf }
}

export default processVaultToStatic

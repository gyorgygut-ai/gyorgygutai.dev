import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, relative } from "node:path"
import { parseFrontmatter } from "./parser/parseFrontmatter"
import { hasAs } from "./parser/hasAs"
import { processObsidianMdToHtml } from "./processObsidianMdToHtml"
import { processObsidianMdToPdf } from "./processObsidianMdToPdf"
import { readCssSnippets } from "./glue/readCssSnippets"

interface VaultOptions {
  cssDir?: string
}

function collectMd(dir: string, base: string, out: string[]) {
  if (!existsSync(dir)) {
    return
  }
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name.startsWith(".") || e.name === "node_modules" || e.name === ".website") {
        continue
      }
      collectMd(full, base, out)
    } else if (e.isFile() && e.name.endsWith(".md")) {
      out.push(relative(base, full))
    }
  }
}

export async function processVaultToStatic(
  vaultDir: string,
  options: VaultOptions = {},
): Promise<{ html: Record<string, string>; pdf: Record<string, Uint8Array> }> {
  const files: string[] = []
  collectMd(vaultDir, vaultDir, files)
  files.sort()
  const html: Record<string, string> = {}
  const pdf: Record<string, Uint8Array> = {}
  const css = options.cssDir ? readCssSnippets(options.cssDir) : undefined

  for (const file of files) {
    const content = readFileSync(join(vaultDir, file), "utf-8")
    const { data } = parseFrontmatter(content)

    const isPage = hasAs(data, "page")
    const isHome = hasAs(data, "home")
    const isPdf = hasAs(data, "pdf")
    if (!isPage && !isHome && !isPdf) {
      continue
    }

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

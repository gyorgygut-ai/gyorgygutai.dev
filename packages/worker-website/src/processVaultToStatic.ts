import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, relative } from "node:path"
import { parseFrontmatter, hasAs } from "@gyorgygutai/processor-md-to-html"
import { processObsidianMdToHtml } from "@gyorgygutai/processor-md-to-html"
import { processObsidianMdToPdf } from "@gyorgygutai/processor-md-to-pdf"
import { readCssSnippets } from "@gyorgygutai/processor-md-to-html"

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
      if (e.name.startsWith(".") || e.name === "node_modules") {
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

  const vaultFiles: Record<string, string> = {}
  for (const file of files) {
    try {
      vaultFiles[file] = readFileSync(join(vaultDir, file), "utf-8")
    } catch {}
  }

  for (const file of files) {
    const content = vaultFiles[file]
    if (content === undefined) {
      continue
    }
    const { data } = parseFrontmatter(content)

    const isPage = hasAs(data, "page")
    const isHome = hasAs(data, "home")
    const isPdf = hasAs(data, "pdf")
    if (!isPage && !isHome && !isPdf) {
      continue
    }

    if (isPage || isHome) {
      html[file] = await processObsidianMdToHtml(content, css, vaultFiles)
    }
    if (isPdf) {
      pdf[file] = await processObsidianMdToPdf(content, vaultFiles)
    }
  }

  return { html, pdf }
}

export default processVaultToStatic
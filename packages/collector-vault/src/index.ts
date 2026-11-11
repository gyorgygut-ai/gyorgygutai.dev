import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, relative, resolve } from "node:path"

export interface VaultData {
  mdFiles: Array<readonly [string, string]>
  assetFiles: Array<readonly [string, string]>
  cssBundle: string[]
  appearanceOrder: string[]
}

function collectFiles(dir: string, root: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      return entry.name.startsWith(".") ? [] : collectFiles(path, root)
    }
    return entry.isFile() ? [relative(root, path)] : []
  }).sort()
}

export function parseVaultArgs(args = process.argv.slice(2)): { vaultRoot: string } {
  const [option, value, ...extra] = args
  const vaultRoot = option === "--vault" && value && extra.length === 0 ? resolve(value) : undefined
  if (args.length > 0 && vaultRoot === undefined) {
    throw new Error(`Unknown or incomplete argument: ${args.find((argument) => argument !== "--vault") ?? args[0]}`)
  }
  if (!vaultRoot) { throw new Error("--vault is required") }
  return { vaultRoot }
}

export function collectVault(vaultRoot: string, includeAssets = true): VaultData {
  const root = resolve(vaultRoot)
  if (!existsSync(root)) { throw new Error(`Vault root does not exist: ${root}`) }
  const files = collectFiles(root, root)
  const mdFiles = files
    .filter((path) => path.toLowerCase().endsWith(".md"))
    .map((path) => [path, readFileSync(join(root, path), "utf8")] as const)

  const snippetDir = join(root, ".obsidian/snippets")
  const snippetFiles = existsSync(snippetDir)
    ? readdirSync(snippetDir).filter((name) => name.endsWith(".css")).sort()
    : []
  const appearancePath = join(root, ".obsidian/appearance.json")
  let appearanceOrder: string[] = []
  if (existsSync(appearancePath)) {
    const appearance: unknown = JSON.parse(readFileSync(appearancePath, "utf8"))
    if (typeof appearance !== "object" || appearance === null) {
      throw new Error(`Invalid enabledCssSnippets in ${appearancePath}`)
    }
    const enabled = "enabledCssSnippets" in appearance ? appearance.enabledCssSnippets : []
    if (!Array.isArray(enabled)) {throw new Error(`Invalid enabledCssSnippets in ${appearancePath}`)}
    appearanceOrder = enabled.filter((item): item is string => typeof item === "string")
  }
  const normalizedOrder = appearanceOrder.map((name) => name.endsWith(".css") ? name : `${name}.css`)
  const orderedSnippetFiles = [...new Set([...normalizedOrder.filter((name) => snippetFiles.includes(name)), ...snippetFiles])]
  const cssBundle = orderedSnippetFiles.map((name) => readFileSync(join(snippetDir, name), "utf8"))

  const assetFiles = includeAssets
    ? files.filter((path) => !path.toLowerCase().endsWith(".md"))
      .map((path) => [path, readFileSync(join(root, path)).toString("base64")] as const)
    : []

  return { mdFiles, assetFiles, cssBundle, appearanceOrder }
}

import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { collectVault } from "@gyorgygutai/collector-vault"
import { buildVaultToWebsite } from "./index.js"

export async function buildWebsite(vaultRoot: string, outputDir: string): Promise<void> {
  const vault = collectVault(vaultRoot, true)
  const { htmlFiles, assetFiles } = await buildVaultToWebsite({
    vaultFiles: Object.fromEntries(vault.mdFiles),
    assetFiles: Object.fromEntries(vault.assetFiles),
    cssBundle: vault.cssBundle,
  })
  const target = resolve(outputDir)
  Object.entries(htmlFiles).map(([route, html]) => {
    const relative = route === "/" ? "index.html" : join(route.slice(1), "index.html")
    const output = resolve(target, relative)
    if (output !== target && !output.startsWith(`${target}${sep}`)) {throw new Error(`Invalid website route: ${route}`)}
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, html)
  })
  Object.entries(assetFiles).map(([route, base64]) => {
    const output = resolve(target, route.replace(/^\/+/, ""))
    if (output !== target && !output.startsWith(`${target}${sep}`)) {throw new Error(`Invalid asset route: ${route}`)}
    mkdirSync(dirname(output), { recursive: true })
    writeFileSync(output, Buffer.from(base64, "base64"))
  })
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === entry) {
  const vaultRoot = argument("--vault")
  const outputDir = argument("--out")
  if (!vaultRoot || !outputDir) {throw new Error("usage: buildWebsite --vault <vaultRoot> --out <outputDir>")}
  await buildWebsite(vaultRoot, outputDir)
  console.log(`built website -> ${resolve(outputDir)}`)
}

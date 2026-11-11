import { mkdirSync, writeFileSync } from "node:fs"
import { basename, join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import grayMatter from "gray-matter"
import { collectVault } from "@gyorgygutai/collector-vault"
import { process as renderPdf } from "./process.js"

export interface BuiltPdf {
  path: string
  file: string
  bytes: Uint8Array
}

function isPdfNote(raw: string): boolean {
  const as = grayMatter(raw).data.as
  const flags = Array.isArray(as) ? as : [as]
  return flags.includes("pdf")
}

export async function buildPdfs(vaultRoot: string, outDir: string): Promise<BuiltPdf[]> {
  const vault = collectVault(vaultRoot, true)
  const vaultFiles = Object.fromEntries(vault.mdFiles)
  const assets = Object.fromEntries(vault.assetFiles)
  const target = resolve(outDir)
  mkdirSync(target, { recursive: true })

  const pdfNotes = vault.mdFiles.filter(([, raw]) => isPdfNote(raw))
  pdfNotes.reduce((outputs, [path]) => {
    const filename = `${basename(path, ".md")}.pdf`
    const previous = outputs.get(filename)
    if (previous) {throw new Error(`PDF filename collision ${filename}: ${previous} and ${path}`)}
    outputs.set(filename, path)
    return outputs
  }, new Map<string, string>())

  return pdfNotes.reduce<Promise<BuiltPdf[]>>(async (previous, [path, raw]) => {
    const built = await previous
    const bytes = await renderPdf({
      markdown: raw,
      vaultFiles,
      path,
      customCss: vault.cssBundle,
      assets,
    })
    const file = join(target, `${basename(path, ".md")}.pdf`)
    writeFileSync(file, bytes)
    built.push({ path, file, bytes })
    return built
  }, Promise.resolve([]))
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : ""
if (import.meta.url === entry) {
  const vaultRoot = arg("--vault")
  const outDir = arg("--out")
  if (!vaultRoot || !outDir) {
    throw new Error("usage: buildPdfs --vault <vaultRoot> --out <outDir>")
  }
  const built = await buildPdfs(vaultRoot, outDir)
  console.log(`built ${built.length} PDFs -> ${resolve(outDir)}`)
}

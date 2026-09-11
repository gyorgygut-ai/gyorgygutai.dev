import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { collectVault, parseArgs, writeBundle } from "@gyorgygutai/collect-vault"

const __dirname = dirname(fileURLToPath(import.meta.url))
const { vaultRoot, outFile } = parseArgs(
  join(__dirname, "../../obsidian-vault"),
  join(__dirname, "./generated/bundle.ts"),
)
writeBundle(outFile, collectVault(vaultRoot, false), false)

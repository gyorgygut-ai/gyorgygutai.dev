import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { collectVault, parseArgs, writeBundle } from "@gyorgygutai/collect-vault"

const { vaultRoot, shellDir, outFile } = parseArgs()
const __dirname = dirname(fileURLToPath(import.meta.url))
if (!shellDir) { throw new Error("--shell is required") }
writeBundle(join(__dirname, "./generated/bundle.ts"), collectVault(vaultRoot, shellDir, true), true)

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { collectVault, parseArgs, writeBundle } from "@gyorgygutai/collect-vault"

const { vaultRoot, outFile } = parseArgs()
const __dirname = dirname(fileURLToPath(import.meta.url))
writeBundle(join(__dirname, "./generated/bundle.ts"), collectVault(vaultRoot, "", false), false)

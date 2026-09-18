import { watch } from "node:fs"
import { spawn } from "node:child_process"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const VAULT_DIR = join(__dirname, "../../../inputs/obsidian-vault")

const allowedExts = new Set(["md", "png", "jpg", "jpeg", "svg", "gif", "webp", "avif", "ico", "css", "json"])

let lastBundle = 0
const debounceMs = 500

function scheduleBundle() {
  const now = Date.now()
  if (now - lastBundle < debounceMs) {
    setTimeout(scheduleBundle, debounceMs - (now - lastBundle))
    return
  }
  lastBundle = Date.now()
  console.log("[vault-watcher] bundling...")

  const child = spawn("npx", ["tsx", "src/bundleVaultIntoWorker.ts", "--vault", "../../inputs/obsidian-vault", "--out", "./src/generated/bundle.ts"], {
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  })

  child.on("exit", (code) => {
    if (code === 0) {
      console.log("[vault-watcher] bundle written — wrangler will reload")
    } else {
      console.log("[vault-watcher] bundle failed")
    }
  })
}

console.log("[vault-watcher] watching vault at", VAULT_DIR)

const watcher = watch(VAULT_DIR, { recursive: true }, (eventType, filename) => {
  if (!filename) 
{return}
  const ext = filename.split(".").pop()?.toLowerCase()
  if (!allowedExts.has(ext as string)) 
{return}

  scheduleBundle()
})

function shutdown() {
  watcher.close()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

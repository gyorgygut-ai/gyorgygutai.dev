import { watch } from "node:fs"
import { spawn } from "node:child_process"
import { join, dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const VAULT_DIR = resolve(process.env.VAULT_ROOT ?? join(__dirname, "../../../inputs/vault-gyorgygutai"))

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

  const child = spawn("npm", ["run", "build"], {
    stdio: ["pipe", "inherit", "inherit"],
    shell: true,
  })

  child.on("exit", (code) => {
    if (code === 0) {
      console.log("[vault-watcher] dist updated")
    } else {
      console.log("[vault-watcher] bundle failed")
    }
  })
}

console.log("[vault-watcher] watching vault at", VAULT_DIR)

const watcher = watch(VAULT_DIR, { recursive: true }, (_eventType, filename) => {
  if (!filename) {return}

  scheduleBundle()
})

function shutdown() {
  watcher.close()
  process.exit(0)
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

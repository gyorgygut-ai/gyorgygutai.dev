import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawn } from "node:child_process"
import { setTimeout } from "node:timers/promises"
import { fileURLToPath } from "node:url"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const ROOT = fileURLToPath(new URL("..", import.meta.url))

const WEBSITE_PORT = 8787
const PDF_PORT = 8788
const BASE_URL_WEBSITE = `http://localhost:${WEBSITE_PORT}`
const BASE_URL_PDF = `http://localhost:${PDF_PORT}`

function resolveCwd(workspace: string): string {
  return fileURLToPath(new URL(`../${workspace}`, import.meta.url))
}

let websiteProcess: ReturnType<typeof spawn> | null = null
let pdfProcess: ReturnType<typeof spawn> | null = null

function killWorkers() {
  if (websiteProcess) {
    websiteProcess.kill("SIGTERM")
    websiteProcess = null
  }
  if (pdfProcess) {
    pdfProcess.kill("SIGTERM")
    pdfProcess = null
  }
}

process.on("SIGINT", killWorkers)
process.on("SIGTERM", killWorkers)

async function runCommand(args: string[], cwd?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), {
      cwd: cwd ?? ROOT,
      shell: true,
      stdio: "inherit",
    })
    child.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`command failed: ${args.join(" ")} (code ${code})`))
    })
  })
}

async function waitForPort(port: number, timeoutMs = 60000): Promise<void> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${port}/`)
      if (res.ok || res.status === 404) {
        return
      }
    } catch {
      // not ready yet
    }
    await setTimeout(500)
  }
  throw new Error(`Port ${port} did not become ready within ${timeoutMs}ms`)
}

describe("integration: full pipeline", () => {
  beforeAll(async () => {
    await runCommand(["npm", "run", "build"])
    await runCommand(["npm", "run", "bundleVaultIntoWorker", "--workspace=packages/worker-website"])
    await runCommand(["npm", "run", "bundleVaultIntoWorker", "--workspace=packages/worker-pdf"])

    websiteProcess = spawn("npx", ["wrangler", "dev", "--config", "src/wrangler.jsonc", "--inspector-port", "0"], {
      cwd: resolveCwd("packages/worker-website"),
      env: { ...process.env, HTTP_PROXY: "" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    })
    websiteProcess.stdout.pipe(process.stdout)
    websiteProcess.stderr.pipe(process.stderr)

    pdfProcess = spawn("npx", ["wrangler", "dev", "--config", "src/wrangler.jsonc", "--port", String(PDF_PORT), "--inspector-port", "0"], {
      cwd: resolveCwd("packages/worker-pdf"),
      env: { ...process.env, HTTP_PROXY: "" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    })
    pdfProcess.stdout.pipe(process.stdout)
    pdfProcess.stderr.pipe(process.stderr)

    await waitForPort(WEBSITE_PORT)
    await waitForPort(PDF_PORT)
  }, 120000)

  afterAll(async () => {
    killWorkers()
  })

  it("GET / returns 200 HTML with immutable cache", async () => {
    const res = await fetch(`${BASE_URL_WEBSITE}/`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
  })

  it("GET /links returns 200 HTML with immutable cache", async () => {
    const res = await fetch(`${BASE_URL_WEBSITE}/links`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
  })

  it("GET /assets/cv_photo_2026_2.png returns 200 PNG with immutable cache", async () => {
    const res = await fetch(`${BASE_URL_WEBSITE}/assets/cv_photo_2026_2.png`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("image/png")
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
  })

  it("GET *.pdf on website returns 404 no-store", async () => {
    const res = await fetch(`${BASE_URL_WEBSITE}/anything.pdf`)
    expect(res.status).toBe(404)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })

  it("GET unknown route on website returns 404 no-store", async () => {
    const res = await fetch(`${BASE_URL_WEBSITE}/unknown`)
    expect(res.status).toBe(404)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })

  it("GET /pdf/chronological.pdf returns 200 PDF with immutable cache", async () => {
    const res = await fetch(`${BASE_URL_PDF}/pdf/chronological.pdf`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("application/pdf")
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    const buf = new Uint8Array(await res.arrayBuffer())
    expect(buf[0]).toBe(0x25)
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-")
  })

  it("GET /pdf/project-based.pdf returns 200 PDF with immutable cache", async () => {
    const res = await fetch(`${BASE_URL_PDF}/pdf/project-based.pdf`)
    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("application/pdf")
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    const buf = new Uint8Array(await res.arrayBuffer())
    expect(buf[0]).toBe(0x25)
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-")
  })

  it("GET unknown.pdf on pdf worker returns 404 no-store", async () => {
    const res = await fetch(`${BASE_URL_PDF}/unknown.pdf`)
    expect(res.status).toBe(404)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })

  it("GET non-pdf route on pdf worker returns 404 no-store", async () => {
    const res = await fetch(`${BASE_URL_PDF}/not-a-pdf`)
    expect(res.status).toBe(404)
    expect(res.headers.get("cache-control")).toBe("no-store")
  })
})

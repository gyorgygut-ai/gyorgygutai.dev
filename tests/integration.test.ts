import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { spawn } from "node:child_process"
import { setTimeout } from "node:timers/promises"
import { fileURLToPath } from "node:url"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

const WEBSITE_PORT = 8787
const BASE_URL = `http://localhost:${WEBSITE_PORT}`

let devProcess: ReturnType<typeof spawn> | null = null

function killWorker() {
  if (devProcess) {
    devProcess.kill("SIGTERM")
    devProcess = null
  }
}

process.on("SIGINT", killWorker)
process.on("SIGTERM", killWorker)

async function runCommand(args: string[], cwd?: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(args[0], args.slice(1), {
      cwd: cwd ?? ROOT,
      shell: true,
      stdio: "inherit",
    })
    child.on("close", (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`command failed: ${args.join(" ")} (code ${code})`))
      }
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

interface Snapshot {
  status: number
  contentType: string | null
  cacheControl: string | null
  body: string
}

interface BinarySnapshot {
  status: number
  contentType: string | null
  cacheControl: string | null
  bytes: Uint8Array
}

async function snapshot(url: string): Promise<Snapshot> {
  const response = await fetch(url)
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    body: await response.text(),
  }
}

async function binarySnapshot(url: string): Promise<BinarySnapshot> {
  const response = await fetch(url)
  return {
    status: response.status,
    contentType: response.headers.get("content-type"),
    cacheControl: response.headers.get("cache-control"),
    bytes: new Uint8Array(await response.arrayBuffer()),
  }
}

function pdfMagic(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes.slice(0, 5))
}

function pdfHref(html: string, label: string): string {
  const match = html.match(new RegExp(`href="([^"]+\\.pdf)"[^>]*>PDF download: ${label}`))
  if (!match?.[1]) throw new Error(`Missing PDF link: ${label}`)
  return new URL(match[1], `${BASE_URL}/`).pathname
}

let home: Snapshot
let unpublished: Snapshot
let asset: BinarySnapshot
let websitePdf: Snapshot
let websiteUnknown: Snapshot
let cvPdf: BinarySnapshot
let projectPdf: BinarySnapshot
let chronologicalHref = ""
let projectBasedHref = ""
let pdfUnknown: Snapshot
let pdfNonPdf: Snapshot

describe("integration: full pipeline", () => {
  beforeAll(async () => {
    await runCommand(["npm", "run", "build"])

    devProcess = spawn("npx", [
      "--yes", "wrangler@latest", "dev",
      "--config", "packages/worker-website/src/wrangler.jsonc",
      "--config", "packages/worker-pdf/src/wrangler.jsonc",
      "--port", String(WEBSITE_PORT),
      "--inspector-port", "0",
    ], {
      cwd: ROOT,
      env: { ...process.env, HTTP_PROXY: "" },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    })
    devProcess.stdout.pipe(process.stdout)
    devProcess.stderr.pipe(process.stderr)

    await waitForPort(WEBSITE_PORT)

    home = await snapshot(`${BASE_URL}/`)
    chronologicalHref = pdfHref(home.body, "chronological")
    projectBasedHref = pdfHref(home.body, "project-based")
    unpublished = await snapshot(`${BASE_URL}/web/sections/links`)
    asset = await binarySnapshot(`${BASE_URL}/assets/cv_photo_2026_3.png`)
    websitePdf = await snapshot(`${BASE_URL}/anything.pdf`)
    websiteUnknown = await snapshot(`${BASE_URL}/unknown`)
    cvPdf = await binarySnapshot(`${BASE_URL}${chronologicalHref}`)
    projectPdf = await binarySnapshot(`${BASE_URL}${projectBasedHref}`)
    pdfUnknown = await snapshot(`${BASE_URL}/unknown.pdf`)
    pdfNonPdf = await snapshot(`${BASE_URL}/not-a-pdf`)
  }, 180000)

  afterAll(async () => {
    killWorker()
  })

  it("GET / returns 200", () => {
    expect(home.status).toBe(200)
  })

  it("GET / returns html content type", () => {
    expect(home.contentType).toBe("text/html; charset=utf-8")
  })

  it("GET / returns immutable cache", () => {
    expect(home.cacheControl).toBe("public, max-age=31536000, immutable")
  })

  it("GET / has a doctype", () => {
    expect(home.body).toContain("<!doctype html>")
  })

  it("GET / renders the site title", () => {
    expect(home.body).toContain("<title>György Gutai - Full Stack Web Developer</title>")
  })

  it("GET / renders the main landmark", () => {
    expect(home.body).toContain("<main")
  })

  it("keeps the chronological PDF href relative in generated HTML", () => {
    expect(home.body).toMatch(/href="cv_gyorgygutai\.pdf"[^>]*>PDF download: chronological/)
  })

  it("keeps the project PDF href relative in generated HTML", () => {
    expect(home.body).toMatch(/href="cv_gyorgygutai_project_based\.pdf"[^>]*>PDF download: project-based/)
  })

  it("resolves the chronological PDF link to the website origin", () => {
    expect(new URL(chronologicalHref, `${BASE_URL}/`).origin).toBe(new URL(BASE_URL).origin)
  })

  it("resolves the project PDF link to the website origin", () => {
    expect(new URL(projectBasedHref, `${BASE_URL}/`).origin).toBe(new URL(BASE_URL).origin)
  })

  it("GET a note without as: returns 404", () => {
    expect(unpublished.status).toBe(404)
  })

  it("GET a note without as: returns no-store", () => {
    expect(unpublished.cacheControl).toBe("no-store")
  })

  it("GET /assets/cv_photo_2026_3.png returns 200", () => {
    expect(asset.status).toBe(200)
  })

  it("GET /assets/cv_photo_2026_3.png returns image/png", () => {
    expect(asset.contentType).toBe("image/png")
  })

  it("GET /assets/cv_photo_2026_3.png returns immutable cache", () => {
    expect(asset.cacheControl).toBe("public, max-age=31536000, immutable")
  })

  it("GET *.pdf on website returns 404", () => {
    expect(websitePdf.status).toBe(404)
  })

  it("GET *.pdf on website returns no-store", () => {
    expect(websitePdf.cacheControl).toBe("no-store")
  })

  it("GET unknown route on website returns 404", () => {
    expect(websiteUnknown.status).toBe(404)
  })

  it("GET unknown route on website returns no-store", () => {
    expect(websiteUnknown.cacheControl).toBe("no-store")
  })

  it("GET /cv_gyorgygutai.pdf returns 200", () => {
    expect(cvPdf.status).toBe(200)
  })

  it("GET /cv_gyorgygutai.pdf returns application/pdf", () => {
    expect(cvPdf.contentType).toBe("application/pdf")
  })

  it("GET /cv_gyorgygutai.pdf returns immutable cache", () => {
    expect(cvPdf.cacheControl).toBe("public, max-age=31536000, immutable")
  })

  it("GET /cv_gyorgygutai.pdf serves a valid PDF header", () => {
    expect(pdfMagic(cvPdf.bytes)).toBe("%PDF-")
  })

  it("GET /cv_gyorgygutai_project_based.pdf returns 200", () => {
    expect(projectPdf.status).toBe(200)
  })

  it("GET /cv_gyorgygutai_project_based.pdf returns application/pdf", () => {
    expect(projectPdf.contentType).toBe("application/pdf")
  })

  it("GET /cv_gyorgygutai_project_based.pdf returns immutable cache", () => {
    expect(projectPdf.cacheControl).toBe("public, max-age=31536000, immutable")
  })

  it("GET /cv_gyorgygutai_project_based.pdf serves a valid PDF header", () => {
    expect(pdfMagic(projectPdf.bytes)).toBe("%PDF-")
  })

  it("GET unknown.pdf on pdf worker returns 404", () => {
    expect(pdfUnknown.status).toBe(404)
  })

  it("GET unknown.pdf on pdf worker returns no-store", () => {
    expect(pdfUnknown.cacheControl).toBe("no-store")
  })

  it("GET non-pdf route on pdf worker returns 404", () => {
    expect(pdfNonPdf.status).toBe(404)
  })

  it("GET non-pdf route on pdf worker returns no-store", () => {
    expect(pdfNonPdf.cacheControl).toBe("no-store")
  })
})

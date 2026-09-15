import { describe, test, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { processVaultToPdf, __resetCache } from "../processVaultToPdf"
import { slugFor } from "../processVaultToPdf"

const fixturesDir = resolve(join(import.meta.dirname, "fixtures"))
const inputDir = join(fixturesDir, "input")
const expectedDir = join(fixturesDir, "expected")

function readDir(dir: string): string[] {
  return readdirSync(dir)
}

function md(name: string): string {
  return readFileSync(join(inputDir, name), "utf-8")
}

function fixture(name: string): Uint8Array {
  const buf = readFileSync(join(expectedDir, name))
  return new Uint8Array(buf)
}

describe("worker-pdf handler", () => {
  test("empty vault", () => {
    __resetCache()
    const handler = processVaultToPdf({ vaultFiles: {} })
    expect(handler.knownPdf).toEqual(new Set())
  })

  test("routes from frontmatter", () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })

    // resume.md → /resume.pdf, not-pdf.md → not in knownPdf, nopdf.md → not in knownPdf
    expect(handler.knownPdf).toEqual(new Set(["/resume.pdf"]))
  })

  test("GET /resume.pdf returns resume.pdf bytes", async () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })
    const res = new Request("http://localhost:8787/resume.pdf")
    await handler.buildRoute("/resume.pdf")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("application/pdf")
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    const buf = new Uint8Array(await response.arrayBuffer())
    expect(buf).toEqual(fixture("resume.pdf"))
  })

  test("GET /resume.pdf returns 404 (as: [page] not as: [pdf])", async () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })
    const res = new Request("http://localhost:8787/not-pdf.pdf")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  test("GET /nopdf.pdf returns 404 (no frontmatter)", async () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })
    const res = new Request("http://localhost:8787/nopdf.pdf")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  test("GET unknown route returns 404", async () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })
    const res = new Request("http://localhost:8787/unknown.pdf")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  test("GET non-pdf route returns 404", async () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })
    const res = new Request("http://localhost:8787/not-a-pdf")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  test("slugFor: /index → /", () => {
    expect(slugFor("index.md")).toBe("/")
  })

  test("slugFor: /sub/index → /sub", () => {
    expect(slugFor("sub/index.md")).toBe("/sub")
  })

  test("slugFor: /sub/page → /sub/page", () => {
    expect(slugFor("sub/page.md")).toBe("/sub/page")
  })

  test("files without as: [pdf] are not in knownPdf", () => {
    __resetCache()
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToPdf({ vaultFiles })

    // not-pdf.md has as: [page], nopdf.md has no frontmatter
    expect(handler.knownPdf.has("/not-pdf.pdf")).toBe(false)
    expect(handler.knownPdf.has("/nopdf.pdf")).toBe(false)
  })
})
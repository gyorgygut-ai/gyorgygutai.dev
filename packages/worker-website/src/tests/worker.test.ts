import { describe, test, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { processVaultToStatic } from "../processVaultToStatic"
import { slugFor } from "../processVaultToStatic"
import { parseFrontmatter, hasAs } from "@gyorgygutai/preset-obsidian-md"

const fixturesDir = resolve(join(import.meta.dirname, "fixtures"))
const inputDir = join(fixturesDir, "input")
const expectedDir = join(fixturesDir, "expected")

function readDir(dir: string): string[] {
  return readdirSync(dir)
}

function md(name: string): string {
  return readFileSync(join(inputDir, name), "utf-8")
}

function fixture(name: string): string {
  return readFileSync(join(expectedDir, name), "utf-8")
}

function expectedFileForRoute(route: string): string | null {
  if (route === "/") return "home.html"
  if (route === "/page") return "page.html"
  return null
}

describe("worker-website handler", () => {
  test("empty vault", () => {
    const handler = processVaultToStatic({ vaultFiles: {} })
    expect(handler.knownHtml).toEqual(new Set())

    const res = new Request("http://localhost:8787/")
    expect(res.url).toBe("http://localhost:8787/")
  })

  test("routes from frontmatter", () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })

    // home.md → /, page.md → /page
    expect(handler.knownHtml).toEqual(new Set(["/", "/page"]))
  })

  test("GET / returns home.html", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })
    const res = new Request("http://localhost:8787/")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    expect(await response.text()).toBe(fixture("home.html"))
  })

  test("GET /page returns page.html", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })
    const res = new Request("http://localhost:8787/page")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8")
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
    expect(await response.text()).toBe(fixture("page.html"))
  })

  test("GET /nopage.md returns 404 (no frontmatter)", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })
    const res = new Request("http://localhost:8787/nopage")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  test("GET /unknown returns 404", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })
    const res = new Request("http://localhost:8787/unknown")
    const response = await handler.handleRequest(res)

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  test("GET *.pdf returns 404 no-store", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })
    const res = new Request("http://localhost:8787/anything.pdf")
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

  test("files without as: [home|page] are not in knownHtml", () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }

    const handler = processVaultToStatic({ vaultFiles })

    // nopage.md has no frontmatter, invalid.md has as: [something]
    expect(handler.knownHtml.has("/nopage")).toBe(false)
    expect(handler.knownHtml.has("/invalid")).toBe(false)
  })
})
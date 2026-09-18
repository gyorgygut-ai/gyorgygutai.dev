import { describe, test, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { processVaultToStatic } from "../processVaultToStatic"

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

describe("worker-website handler", () => {
  test("empty vault", () => {
    const input = { vaultFiles: {}, cssBundle: [] }
    const handler = processVaultToStatic(input)
    expect(handler.knownHtml).toEqual(new Set())
    const res = new Request("http://localhost:8787/")
    expect(handler.handleRequest(res)).resolves.toBeDefined()
  })

  test("routes from frontmatter", () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }
    const input = { vaultFiles, cssBundle: [] }
    const handler = processVaultToStatic(input)
    expect(handler.knownHtml).toEqual(new Set(["/", "/page"]))
  })

  test("GET / returns home.html", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }
    const input = { vaultFiles, cssBundle: [] }
    const handler = processVaultToStatic(input)
    const res = new Request("http://localhost:8787/")
    const response = await handler.handleRequest(res)
    const body = await response.text()
    expect(body).toBe(fixture("home.html"))
  })

  test("GET /page returns page.html", async () => {
    const inputFiles = readDir(inputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = md(name)
    }
    const input = { vaultFiles, cssBundle: [] }
    const handler = processVaultToStatic(input)
    const res = new Request("http://localhost:8787/page")
    const response = await handler.handleRequest(res)
    const body = await response.text()
    expect(body).toBe(fixture("page.html"))
  })

  test("cssBundle inlines style tag", async () => {
    const fixtureDir = join(fixturesDir, "css-bundle")
    const fixtureInputDir = join(fixtureDir, "input")
    const fixtureExpectedDir = join(fixtureDir, "expected")
    const inputFiles = readDir(fixtureInputDir)
    const vaultFiles: Record<string, string> = {}
    for (const name of inputFiles) {
      vaultFiles[name] = readFileSync(join(fixtureInputDir, name), "utf-8")
    }
    const cssBundle = [readFileSync(join(fixtureInputDir, "style.css"), "utf-8")]
    const input = { vaultFiles, cssBundle }
    const handler = processVaultToStatic(input)
    const res = new Request("http://localhost:8787/")
    const response = await handler.handleRequest(res)
    const body = await response.text()
    expect(body).toBe(readFileSync(join(fixtureExpectedDir, "home.html"), "utf-8"))
  })
})

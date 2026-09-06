import { describe, test, expect } from "vitest"
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { processVaultToStatic } from "../src/processVaultToStatic"

const fixturesDir = join(import.meta.dirname, "fixtures")

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8")
}

function createVaultWithAs(): string {
  const dir = mkdtempSync(join(tmpdir(), "vault-test-"))
  writeFileSync(join(dir, "home.md"), "---\nas: home\n---\n# Home\n\nWelcome")
  writeFileSync(join(dir, "page.md"), "---\nas: page\n---\n# Page\n\nContent")
  writeFileSync(join(dir, "pdf.md"), "---\nas: pdf\n---\n# PdfOnly\n\nContent")
  writeFileSync(join(dir, "no-as.md"), "# No Frontmatter\n\nHello")
  writeFileSync(join(dir, "empty.md"), "")
  writeFileSync(join(dir, "invalid.md"), "---\nas: draft\n---\n# Draft")
  return dir
}

function isPdfStart(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d
}

describe("processVaultToStatic", () => {
  test("returns only notes with as page/home/pdf", async () => {
    const dir = createVaultWithAs()
    const result = await processVaultToStatic(dir)
    expect(Object.keys(result.html).sort()).toEqual(["home.md", "page.md"])
    expect(Object.keys(result.pdf).sort()).toEqual(["pdf.md"])
  })

  test("no-as excluded", async () => {
    const dir = createVaultWithAs()
    const result = await processVaultToStatic(dir)
    expect(result.html).not.toHaveProperty("no-as.md")
    expect(result.pdf).not.toHaveProperty("no-as.md")
  })

  test("empty excluded", async () => {
    const dir = createVaultWithAs()
    const result = await processVaultToStatic(dir)
    expect(result.html).not.toHaveProperty("empty.md")
  })

  test("invalid as value excluded", async () => {
    const dir = createVaultWithAs()
    const result = await processVaultToStatic(dir)
    expect(result.html).not.toHaveProperty("invalid.md")
  })

  test("html values contain html tags", async () => {
    const dir = createVaultWithAs()
    const result = await processVaultToStatic(dir)
    for (const html of Object.values(result.html)) {
      expect(html).toMatch(/<h[1-6]|<p>/)
    }
  })

  test("pdf values are valid pdfs", async () => {
    const dir = createVaultWithAs()
    const result = await processVaultToStatic(dir)
    for (const pdf of Object.values(result.pdf)) {
      expect(pdf).toBeInstanceOf(Uint8Array)
      expect(isPdfStart(pdf)).toBe(true)
    }
  })

  test("deterministic across calls", async () => {
    const dir = createVaultWithAs()
    const a = await processVaultToStatic(dir)
    const b = await processVaultToStatic(dir)
    expect(Object.keys(a.html)).toEqual(Object.keys(b.html))
    for (const key of Object.keys(a.html)) {
      expect(a.html[key]).toBe(b.html[key])
    }
    for (const key of Object.keys(a.pdf)) {
      expect(Buffer.compare(a.pdf[key], b.pdf[key])).toBe(0)
    }
  })

  test("cssDir inlined into html but pdf unaffected", async () => {
    const dir = mkdtempSync(join(tmpdir(), "vault-css-"))
    writeFileSync(join(dir, "page.md"), "---\nas: page\n---\n" + readFixture("simple-note/input.md"))
    const cssDir = join(fixturesDir, "long-note")
    const withCss = await processVaultToStatic(dir, { cssDir })
    const withoutCss = await processVaultToStatic(dir)
    expect(withCss.html["page.md"]).toContain("--background-primary")
    expect(withoutCss.html["page.md"]).not.toContain("--background-primary")
  })
})

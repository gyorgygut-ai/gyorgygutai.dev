import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { process } from "../process"

const fixturesDir = resolve(join(import.meta.dirname, "fixtures"))

function md(name: string, dir: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

function header(bytes: Uint8Array): string {
  return String.fromCharCode(...bytes.slice(0, 5))
}

describe("processor-pdf", () => {
  test("empty produces valid PDF bytes", async () => {
    const output = await process({ markdown: md("input.md", "empty") })
    expect(header(output)).toBe("%PDF-")
  })

  test("simple produces valid PDF bytes", async () => {
    const output = await process({ markdown: md("input.md", "simple") })
    expect(header(output)).toBe("%PDF-")
  })

  test("transcluded produces valid PDF bytes", async () => {
    const output = await process({
      markdown: md("input.md", "transcluded"),
      vaultFiles: { "inner.md": md("inner.md", "transcluded") },
      path: "input.md",
    })
    expect(header(output)).toBe("%PDF-")
  })
})

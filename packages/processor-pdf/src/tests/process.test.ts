import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { process } from "../process"

const fixturesDir = resolve(join(import.meta.dirname, "fixtures"))

function md(name: string, dir: string): string {
  const p = join(fixturesDir, dir, name)
  return readFileSync(p, "utf-8")
}

function pdf(name: string, dir: string): Uint8Array {
  const p = join(fixturesDir, dir, name)
  const buf = readFileSync(p)
  return new Uint8Array(buf)
}

describe("processor-pdf", () => {
  test("empty", async () => {
    const input = { markdown: md("input.md", "empty") }
    const expected = pdf("expected.pdf", "empty")
    const output = await process(input)
    expect(output).toEqual(expected)
  })

  test("simple", async () => {
    const input = { markdown: md("input.md", "simple") }
    const expected = pdf("expected.pdf", "simple")
    const output = await process(input)
    expect(output).toEqual(expected)
  })

  test("transcluded", async () => {
    const input = {
      markdown: md("input.md", "transcluded"),
      vaultFiles: { "inner.md": md("inner.md", "transcluded") },
      path: "input.md",
    }
    const expected = pdf("expected.pdf", "transcluded")
    const output = await process(input)
    expect(output).toEqual(expected)
  })
})

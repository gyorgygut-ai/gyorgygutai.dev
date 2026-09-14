import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { process } from "../index"

const fixturesDir = join(import.meta.dirname, "fixtures")

function md(name: string, dir: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

function html(name: string, dir: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

describe("processor-html", () => {
  test("empty", async () => {
    const output = await process({ markdown: md("input.md", "empty") })
    expect(output).toBe(html("expected.html", "empty"))
  })

  test("simple", async () => {
    const output = await process({ markdown: md("input.md", "simple") })
    expect(output).toBe(html("expected.html", "simple"))
  })

  test("transcluded", async () => {
    const output = await process({
      markdown: md("input.md", "transcluded"),
      vaultFiles: { "inner.md": md("inner.md", "transcluded") },
      path: "input.md",
    })
    expect(output).toBe(html("expected.html", "transcluded"))
  })
})
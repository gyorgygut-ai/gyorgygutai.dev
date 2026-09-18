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
    const input = { markdown: md("input.md", "empty"), css: [] }
    const expected = html("expected.html", "empty")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("simple", async () => {
    const input = { markdown: md("input.md", "simple"), css: [] }
    const expected = html("expected.html", "simple")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("transcluded", async () => {
    const input = {
      markdown: md("input.md", "transcluded"),
      vaultFiles: { "inner.md": md("inner.md", "transcluded") },
      path: "input.md",
      css: [],
    }
    const expected = html("expected.html", "transcluded")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("styled", async () => {
    const input = {
      markdown: md("input.md", "styled"),
      css: [
        readFileSync(join(fixturesDir, "styled/input1.css"), "utf-8"),
        readFileSync(join(fixturesDir, "styled/input2.css"), "utf-8"),
      ],
    }
    const expected = html("expected.html", "styled")
    const output = await process(input)
    expect(output).toBe(expected)
  })
})

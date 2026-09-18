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
    const input = { markdown: md("input.md", "empty"), customCss: [] }
    const expected = html("expected.html", "empty")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("simple", async () => {
    const input = { markdown: md("input.md", "simple"), customCss: [] }
    const expected = html("expected.html", "simple")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("transcluded", async () => {
    const input = {
      markdown: md("input.md", "transcluded"),
      vaultFiles: { "inner.md": md("inner.md", "transcluded") },
      path: "input.md",
      customCss: [],
    }
    const expected = html("expected.html", "transcluded")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("styled", async () => {
    const input = {
      markdown: md("input.md", "styled"),
      customCss: [
        readFileSync(join(fixturesDir, "styled/input1.css"), "utf-8"),
        readFileSync(join(fixturesDir, "styled/input2.css"), "utf-8"),
      ],
    }
    const expected = html("expected.html", "styled")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("custom assets", async () => {
    const input = {
      markdown: md("input.md", "custom-assets"),
      customCss: [readFileSync(join(fixturesDir, "custom-assets/customCss.css"), "utf-8")],
      customJs: [readFileSync(join(fixturesDir, "custom-assets/customJs.js"), "utf-8")],
    }
    const expected = html("expected.html", "custom-assets")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("combined css snippets and shell css", async () => {
    const input = {
      markdown: md("input.md", "combined"),
      customCss: [
        readFileSync(join(fixturesDir, "combined/snippet1.css"), "utf-8"),
        readFileSync(join(fixturesDir, "combined/snippet2.css"), "utf-8"),
      ],
      customJs: [readFileSync(join(fixturesDir, "combined/shell.js"), "utf-8")],
    }
    const expected = html("expected.html", "combined")
    const output = await process(input)
    expect(output).toBe(expected)
  })

  test("meta title produces title element", async () => {
    const input = {
      markdown: md("input.md", "title"),
      meta: { title: "My Title" },
      customCss: [md("customCss.css", "title")],
      customJs: [md("customJs.js", "title")],
    }
    const expected = html("expected.html", "title")
    const output = await process(input)
    expect(output).toBe(expected)
  })
})

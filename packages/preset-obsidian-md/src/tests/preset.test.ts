import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { unified } from "unified"
import rehypeStringify from "rehype-stringify"
import preset from "../index"

const fixturesDir = join(import.meta.dirname, "fixtures")

function read(dir: string, name: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

async function render(markdown: string, vaultFiles: Record<string, string> = {}, path?: string): Promise<string> {
  const file = await unified()
    .use(preset)
    .use(rehypeStringify)
    .process({ value: markdown, data: { vaultFiles, path } })
  return String(file)
}

describe("preset-obsidian-md", () => {
  test("default export is an array", () => {
    expect(Array.isArray(preset)).toBe(true)
  })

  test("default export contains no nullish plugins", () => {
    expect(preset.every((plugin) => plugin !== null && plugin !== undefined)).toBe(true)
  })

  test("wikilinks render as anchors", async () => {
    const output = await render(read("wikilink", "input.md"))
    expect(output).toBe(read("wikilink", "expected.html"))
  })

  test("callouts render with type classes and title", async () => {
    const output = await render(read("callout", "input.md"))
    expect(output).toBe(read("callout", "expected.html"))
  })

  test("transclusions inline the target note", async () => {
    const output = await render(read("transclusion", "input.md"), { "inner.md": read("transclusion", "inner.md") }, "input.md")
    expect(output).toBe(read("transclusion", "expected.html"))
  })

  test("embedded images render with src and width", async () => {
    const output = await render(read("image", "input.md"))
    expect(output).toBe(read("image", "expected.html"))
  })
})

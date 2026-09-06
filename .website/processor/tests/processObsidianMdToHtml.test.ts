import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { processObsidianMdToHtml } from "../processObsidianMdToHtml"
import { readCssSnippets } from "../glue/readCssSnippets"

const fixturesDir = join(import.meta.dirname, "fixtures")

describe("processObsidianMdToHtml", () => {
  test("simple-note fixture deterministic html", async () => {
    const input = readFileSync(join(fixturesDir, "simple-note/input.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "simple-note/expected.html"), "utf-8")

    const output = await processObsidianMdToHtml(input)

    expect(output).toBe(expected)
  })

  test("long-note fixture deterministic html with css", async () => {
    const input = readFileSync(join(fixturesDir, "long-note/input.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "long-note/expected.html"), "utf-8")
    const css = readCssSnippets(join(fixturesDir, "long-note"))

    const output = await processObsidianMdToHtml(input, css)

    expect(output).toBe(expected)
  })

  test("nested-transclusion three levels resolved", async () => {
    const input = readFileSync(join(fixturesDir, "nested-transclusion/outer.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "nested-transclusion/outer.expected.html"), "utf-8")

    const output = await processObsidianMdToHtml(input)

    expect(output).toBe(expected)
  })

  test("full-recursive cycle guard", async () => {
    const input = readFileSync(join(fixturesDir, "full-recursive/cycle-a.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "full-recursive/cycle-a.expected.html"), "utf-8")

    const output = await processObsidianMdToHtml(input)

    expect(output).toBe(expected)
  })

  test("full-recursive diamond shared node", async () => {
    const input = readFileSync(join(fixturesDir, "full-recursive/diamond.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "full-recursive/diamond.expected.html"), "utf-8")

    const output = await processObsidianMdToHtml(input)

    expect(output).toBe(expected)
  })

  test("full-recursive missing transclusion", async () => {
    const input = readFileSync(join(fixturesDir, "full-recursive/missing.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "full-recursive/missing.expected.html"), "utf-8")

    const output = await processObsidianMdToHtml(input)

    expect(output).toBe(expected)
  })

  test("frontmatter array as", async () => {
    const input = readFileSync(join(fixturesDir, "frontmatter/array-as.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "frontmatter/array-as.expected.html"), "utf-8")

    const output = await processObsidianMdToHtml(input)

    expect(output).toBe(expected)
  })
})

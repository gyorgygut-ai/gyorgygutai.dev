import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { processObsidianMdToHtml } from "../src/processObsidianMdToHtml"
import { readCssSnippets } from "../src/glue/readCssSnippets"

const fixturesDir = join(import.meta.dirname, "fixtures")

function readFixture(path: string): string {
  return readFileSync(join(fixturesDir, path), "utf-8")
}

describe("processObsidianMdToHtml", () => {
  test("empty input returns string without throwing", async () => {
    const result = await processObsidianMdToHtml("")
    expect(typeof result).toBe("string")
  })

  test("basic markdown converts to HTML elements", async () => {
    const result = await processObsidianMdToHtml("# Hello\n\nWorld")
    expect(result).toContain("<h1>")
    expect(result).toContain("<p>")
  })

  test("bold text produces strong tags", async () => {
    const result = await processObsidianMdToHtml("**bold**")
    expect(result).toContain("<strong>")
  })

  test("links produce anchor tags", async () => {
    const result = await processObsidianMdToHtml("[text](https://example.com)")
    expect(result).toContain('<a href="https://example.com"')
  })

  test("inline code produces code tags", async () => {
    const result = await processObsidianMdToHtml("`code`")
    expect(result).toContain("<code>")
  })

  test("lists produce list item tags", async () => {
    const result = await processObsidianMdToHtml("- item one\n- item two")
    expect(result).toContain("<li>")
  })

  test("horizontal rules produce hr tags", async () => {
    const result = await processObsidianMdToHtml("---")
    expect(result).toContain("<hr")
  })

  test("raw HTML is preserved", async () => {
    const result = await processObsidianMdToHtml('<hr class="header-separator">')
    expect(result).toContain("header-separator")
  })

  test("frontmatter is stripped from output", async () => {
    const md = "---\nas: page\ntitle: Test\n---\n\n# Hello"
    const result = await processObsidianMdToHtml(md)
    expect(result).not.toContain("as:")
    expect(result).not.toContain("title:")
    expect(result).toContain("<h1>")
  })

  test("transclusions produce transclude markup", async () => {
    const md = readFixture("long-note/input.md")
    const result = await processObsidianMdToHtml(md)
    expect(result).toContain("transclude")
  })

  test("callouts produce callout markup", async () => {
    const md = readFixture("long-note/input.md")
    const result = await processObsidianMdToHtml(md)
    expect(result).toMatch(/callout|data-callout/)
  })

  test("image embeds produce img tags", async () => {
    const md = readFixture("long-note/input.md")
    const result = await processObsidianMdToHtml(md)
    expect(result).toContain("<img")
  })

  test("CSS snippets are inlined into output", async () => {
    const md = readFixture("long-note/input.md")
    const css = readCssSnippets(join(fixturesDir, "long-note"))
    const result = await processObsidianMdToHtml(md, css)
    expect(result).toContain("--background-primary")
    expect(result).toContain("<style>")
  })

  test("simple-note fixture deterministic html", async () => {
    const md = readFixture("simple-note/input.md")
    const expected = readFixture("simple-note/expected.html")
    const result = await processObsidianMdToHtml(md)
    expect(result).toBe(expected)
  })

  test("long-note fixture deterministic html with css", async () => {
    const md = readFixture("long-note/input.md")
    const expected = readFixture("long-note/expected.html")
    const css = readCssSnippets(join(fixturesDir, "long-note"))
    const result = await processObsidianMdToHtml(md, css)
    expect(result).toBe(expected)
  })

  test("same input always produces same html", async () => {
    const md = "# Hello\n\n**bold**"
    const a = await processObsidianMdToHtml(md)
    const b = await processObsidianMdToHtml(md)
    expect(a).toBe(b)
  })
})

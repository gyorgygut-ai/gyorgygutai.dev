import { readFileSync } from "node:fs"
import { join } from "node:path"
import { unified } from "unified"
import rehypeParse from "rehype-parse"
import rehypeStringify from "rehype-stringify"
import { createShell } from "../index"

const fixturesDir = join(import.meta.dirname, "fixtures")

function md(name: string, dir: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

function html(name: string, dir: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

describe("preset-website-shell", () => {
  test("injects custom css and js", async () => {
    const input = {
      customCss: [md("customCss.css", "shell")],
      customJs: [md("customJs.js", "shell")],
    }
    const expected = html("expected.html", "shell")
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(createShell(input))
      .use(rehypeStringify, { allowDangerousHtml: true })
    const output = String(await processor.process(md("input.md", "shell")))
    expect(output).toBe(expected)
  })
})

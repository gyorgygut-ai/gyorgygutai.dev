import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { unified } from "unified"
import rehypeParse from "rehype-parse"
import rehypeStringify from "rehype-stringify"
import { createShell } from "../index"

const fixturesDir = join(import.meta.dirname, "fixtures")
const builtinDir = join(dirname(new URL(import.meta.url).pathname), "../..", "src")

function md(name: string, dir: string): string {
  return readFileSync(join(fixturesDir, dir, name), "utf-8")
}

const BUILTIN_CSS = [
  readFileSync(join(builtinDir, "obsidian-vars.css"), "utf-8"),
  readFileSync(join(builtinDir, "obsidian.css"), "utf-8"),
]

function buildExpected(userCss: string[], userJs: string[], metaDesc: string): string {
  const styles = BUILTIN_CSS
    .concat(userCss)
    .map((c) => `<style>${c}</style>`)
    .join("")
  const scripts = userJs
    .map((j: string) => `<script type="module">${j}</script>`)
    .join("")
  const meta = metaDesc
    ? `<meta name="description" content="${metaDesc}">`
    : ""

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1" name="viewport">
<meta name="color-scheme" content="dark light">${meta}${scripts}${styles}</head>
<body><main class="content">
<h1>Test</h1>

</main></body>
</html>
`
}

describe("preset-website", () => {
  test("injects custom css and js", async () => {
    const input = {
      customCss: [md("customCss.css", "shell")],
      customJs: [md("customJs.js", "shell")],
    }
    const expected = buildExpected(
      input.customCss,
      input.customJs,
      "",
    )
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(createShell(input))
      .use(rehypeStringify, { allowDangerousHtml: true })
    const output = String(await processor.process(md("input.md", "shell")))
    expect(output).toBe(expected)
  })

  test("injects description from meta", async () => {
    const input = {
      customCss: [md("customCss.css", "meta")],
      customJs: [md("customJs.js", "meta")],
      meta: { description: "My description" },
    }
    const expected = buildExpected(
      input.customCss,
      input.customJs,
      input.meta.description,
    )
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(createShell(input))
      .use(rehypeStringify, { allowDangerousHtml: true })
    const output = String(await processor.process(md("input.md", "meta")))
    expect(output).toBe(expected)
  })

  test("injects multiple scripts", async () => {
    const input = {
      customCss: [md("customCss.css", "multi-js")],
      customJs: [
        readFileSync(join(fixturesDir, "multi-js/js1.js"), "utf-8"),
        readFileSync(join(fixturesDir, "multi-js/js2.js"), "utf-8"),
      ],
    }
    const expected = buildExpected(
      input.customCss,
      input.customJs,
      "",
    )
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(createShell(input))
      .use(rehypeStringify, { allowDangerousHtml: true })
    const output = String(await processor.process(md("input.md", "multi-js")))
    expect(output).toBe(expected)
  })

  test("produces exactly one description meta", async () => {
    const input = {
      meta: { description: "Only one" },
    }
    const expected = buildExpected([], [], input.meta.description)
    const processor = unified()
      .use(rehypeParse, { fragment: true })
      .use(createShell(input))
      .use(rehypeStringify, { allowDangerousHtml: true })
    const output = String(await processor.process(md("input.md", "one-desc")))
    expect(output).toBe(expected)
  })
})

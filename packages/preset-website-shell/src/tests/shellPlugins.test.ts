import { describe, it, expect } from "vitest"
import { unified } from "unified"
import rehypeParse from "rehype-parse"
import { VFile } from "vfile"
import shellPlugins from "../"

function usePlugins(processor: any, plugins: unknown[]) {
  for (const p of plugins) {
    if (Array.isArray(p)) {
      processor.use(p[0], ...(p.slice(1)))
    } else {
      processor.use(p)
    }
  }
}

describe("shellPlugins", () => {
  it("wraps fragment in full HTML document", async () => {
    const processor = unified().use(rehypeParse, { fragment: true })
    usePlugins(processor, shellPlugins as unknown[])
    const file = new VFile("<h1>Hello</h1>")
    const out = String(await processor.process(file))
    expect(out).toContain("<!doctype html>")
    expect(out).toContain("<h1>Hello</h1>")
    expect(out).toContain("</html>")
  })

  it("wraps body in main.content", async () => {
    const processor = unified().use(rehypeParse, { fragment: true })
    usePlugins(processor, shellPlugins as unknown[])
    const file = new VFile("<p>test</p>")
    const out = String(await processor.process(file))
    expect(out).toContain('<main class="content">')
  })

  it("injects description from meta", async () => {
    const processor = unified().use(rehypeParse, { fragment: true })
    usePlugins(processor, shellPlugins as unknown[])
    const file = new VFile("<p>test</p>")
    ;(file.data as Record<string, unknown>).meta = { description: "My desc" }
    const out = String(await processor.process(file))
    expect(out).toContain('name="description"')
    expect(out).toContain("My desc")
  })

  it("injects color-scheme", async () => {
    const processor = unified().use(rehypeParse, { fragment: true })
    usePlugins(processor, shellPlugins as unknown[])
    const file = new VFile("<p>test</p>")
    const out = String(await processor.process(file))
    expect(out).toContain('name="color-scheme"')
  })
})

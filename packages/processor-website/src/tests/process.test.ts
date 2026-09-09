import { describe, it, expect } from "vitest"
import { process } from "../index"

describe("processor-website", () => {
  it("produces HTML with <main class=\"content\">", async () => {
    const html = await process({ markdown: "# Hello" })
    expect(html).toContain("<main class=\"content\">")
    expect(html).toContain("<h1")
    expect(html).toContain("Hello")
  })

  it("parses frontmatter title", async () => {
    const html = await process({ markdown: "---\ntitle: Test\n---\nHello" })
    expect(html).toContain("<title>Test</title>")
  })

  it("resolves transclusions from vaultFiles", async () => {
    const vaultFiles = {
      "outer.md": "# Outer\n\n![[inner]]",
      "inner.md": "# Inner\n\nhello",
    }
    const html = await process({ markdown: vaultFiles["outer.md"]!, vaultFiles, path: "outer.md" })
    expect(html).toContain("Outer")
    expect(html).toContain("Inner")
  })
})

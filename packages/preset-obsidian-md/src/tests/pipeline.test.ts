import { describe, test, expect } from "vitest"
import { unified } from "unified"
import rehypeStringify from "rehype-stringify"
import { createPreset, parseFrontmatter, type VaultFiles } from "../index"

async function render(markdown: string, vaultFiles: VaultFiles = {}, path?: string): Promise<string> {
  const { content } = parseFrontmatter(markdown)
  const processor = unified().use(createPreset({ vaultFiles, path }))
  processor.use(rehypeStringify, { allowDangerousHtml: true })
  return String(await processor.process(content))
}

describe("rebuilt pipeline (RED)", () => {
  test("wikilink renders anchor", async () => {
    const out = await render("See [[My Note]] here.")
    expect(out).toContain("<a")
    expect(out).toContain("My Note")
  })

  test("image embed renders img with width", async () => {
    const out = await render("![[photo.png|60]]")
    expect(out).toContain("<img")
    expect(out).toContain("60")
  })

  test("note transclusion resolves from vaultFiles map", async () => {
    const vaultFiles: VaultFiles = {
      "outer.md": "# Outer\n\n![[middle]]",
      "middle.md": "# Middle\n\n![[inner]]",
      "inner.md": "# Inner Content\n\nhello from inner",
    }
    const out = await render(vaultFiles["outer.md"]!, vaultFiles)
    expect(out).toContain("Outer")
    expect(out).toContain("Middle")
    expect(out).toContain("Inner Content")
  })

  test("cycle guard emits message", async () => {
    const vaultFiles: VaultFiles = {
      "cycle-a.md": "# Cycle A\n\n![[cycle-b]]",
      "cycle-b.md": "# Cycle B\n\n![[cycle-a]]",
    }
    const out = await render(vaultFiles["cycle-a.md"]!, vaultFiles, "cycle-a.md")
    expect(out).toContain("Cycle A")
    expect(out).toContain("Cycle B")
    expect(out).toMatch(/cycle detected/i)
  })

  test("missing transclusion emits message", async () => {
    const out = await render("# Hi\n\n![[nope]]", {})
    expect(out).toMatch(/missing/i)
  })

  test("callout renders", async () => {
    const out = await render("> [!note] Title\n> body text")
    expect(out).toMatch(/callout/i)
  })

  test("frontmatter stripped, no fs fallback", async () => {
    const out = await render("---\ntitle: T\n---\n# Hello", {})
    expect(out).toContain("Hello")
    expect(out).not.toContain("title: T")
  })
})

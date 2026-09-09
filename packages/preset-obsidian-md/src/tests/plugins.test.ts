import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { unified } from "unified"
import { createPreset, parseFrontmatter, type VaultFiles } from "../index"
import rehypeStringify from "rehype-stringify"

const fixturesDir = join(import.meta.dirname, "fixtures")

function load(names: string[], dir: string): VaultFiles {
  const files: VaultFiles = {}
  for (const name of names) {
    files[name] = readFileSync(join(fixturesDir, dir, name), "utf-8")
  }
  return files
}

async function processMd(input: string, vaultFiles: VaultFiles = {}, path?: string): Promise<string> {
  const { content } = parseFrontmatter(input)
  const processor = unified().use(createPreset({ vaultFiles, path }))
  processor.use(rehypeStringify, { allowDangerousHtml: true } as Record<string, unknown>)
  return String(await processor.process(content))
}

describe("contentPlugins", () => {
  test("simple-note fixture deterministic html", async () => {
    const input = readFileSync(join(fixturesDir, "simple-note/input.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "simple-note/expected.html"), "utf-8")

    const output = await processMd(input)

    expect(output).toBe(expected)
  })

  test("long-note fixture deterministic html", async () => {
    const input = readFileSync(join(fixturesDir, "long-note/input.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "long-note/expected.html"), "utf-8")
    const vaultFiles: VaultFiles = {
      "content/header.md": readFileSync(join(fixturesDir, "long-note/content/header.md"), "utf-8"),
    }

    const output = await processMd(input, vaultFiles)

    expect(output).toBe(expected)
  })

  test("nested-transclusion three levels resolved", async () => {
    const vaultFiles = load(["outer.md", "middle.md", "inner.md"], "nested-transclusion")
    const expected = readFileSync(join(fixturesDir, "nested-transclusion/outer.expected.html"), "utf-8")

    const output = await processMd(vaultFiles["outer.md"]!, vaultFiles)

    expect(output).toBe(expected)
  })

  test("full-recursive cycle guard", async () => {
    const vaultFiles = load(["cycle-a.md", "cycle-b.md"], "full-recursive")
    const expected = readFileSync(join(fixturesDir, "full-recursive/cycle-a.expected.html"), "utf-8")

    const output = await processMd(vaultFiles["cycle-a.md"]!, vaultFiles, "cycle-a.md")

    expect(output).toBe(expected)
  })

  test("full-recursive diamond shared node", async () => {
    const vaultFiles = load(["diamond.md", "b.md", "c.md", "d.md"], "full-recursive")
    const expected = readFileSync(join(fixturesDir, "full-recursive/diamond.expected.html"), "utf-8")

    const output = await processMd(vaultFiles["diamond.md"]!, vaultFiles)

    expect(output).toBe(expected)
  })

  test("full-recursive missing transclusion", async () => {
    const vaultFiles = load(["missing.md"], "full-recursive")
    const expected = readFileSync(join(fixturesDir, "full-recursive/missing.expected.html"), "utf-8")

    const output = await processMd(vaultFiles["missing.md"]!, vaultFiles)

    expect(output).toBe(expected)
  })

  test("frontmatter array as", async () => {
    const input = readFileSync(join(fixturesDir, "frontmatter/array-as.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "frontmatter/array-as.expected.html"), "utf-8")

    const output = await processMd(input)

    expect(output).toBe(expected)
  })
})

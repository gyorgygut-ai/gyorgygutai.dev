import { describe, test, expect } from "vitest"
import { join, resolve } from "node:path"
import { collectVault, parseVaultArgs } from "../index"

const fixturesDir = resolve(join(import.meta.dirname, "fixtures"))
const fullInput = join(fixturesDir, "full", "input", "vault")
const noAssetsInput = join(fixturesDir, "no-assets", "input", "vault")
const arbitraryInput = join(fixturesDir, "arbitrary", "input", "vault")

describe("collector-vault", () => {
  test("collects markdown recursively from arbitrary vault directories in sorted order", () => {
    expect(collectVault(fullInput, true).mdFiles).toEqual([
      ["pdf/cv.md", "---\nas: pdf\n---\n\n# CV\n"],
      ["web/index.md", "---\nas: page\ntitle: Home\n---\n\n# Home\n"],
      ["web/sections/about.md", "---\nas: page\n---\n\n# About\n"],
    ])
  })

  test("collects assets as base64", () => {
    expect(collectVault(fullInput, true).assetFiles).toEqual([
      ["assets/photo.png", "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M8AAwBhAQCBlwAAAABJRU5ErkJggg=="],
    ])
  })

  test("orders snippets by appearance.json then remaining", () => {
    expect(collectVault(fullInput, true).cssBundle).toEqual([
      ":root { --color: red; }\n",
      ":root { --color: blue; }\n",
      ":root { --alpha: true; }\n",
    ])
  })

  test("exposes appearance order", () => {
    expect(collectVault(fullInput, true).appearanceOrder).toEqual(["theme-colors", "global-overrides"])
  })

  test("throws when vault root is missing", () => {
    expect(() => collectVault(resolve(join(fullInput, "does-not-exist")))).toThrow(/Vault root does not exist/)
  })

  test("collects markdown and attachments from arbitrary vault directories", () => {
    expect(collectVault(arbitraryInput, true)).toMatchObject({
      mdFiles: [["Journal/2026/note.md", "---\nas: page\n---\nA note\n"]],
      assetFiles: [["Media/diagram.canvas", "eyJ0eXBlIjoiY2FudmFzIn0K"]],
    })
  })

  test("missing assets directories produce an empty asset collection", () => {
    expect(collectVault(noAssetsInput, true).assetFiles).toEqual([])
  })

  test("skips assets when includeAssets is false", () => {
    expect(collectVault(noAssetsInput, false).assetFiles).toEqual([])
  })

  test("parses a vault path argument", () => {
    expect(parseVaultArgs(["--vault", fullInput])).toEqual({ vaultRoot: resolve(fullInput) })
  })

  test("requires a vault path argument", () => {
    expect(() => parseVaultArgs([])).toThrow(/--vault is required/)
  })
})

import { describe, test, expect } from "vitest"
import { readFileSync, readdirSync } from "node:fs"
import { join, resolve } from "node:path"
import { buildVaultToWebsite } from "../index"

const fixturesDir = resolve(join(import.meta.dirname, "fixtures", "vault"))
const inputDir = join(fixturesDir, "input")
const expectedDir = join(fixturesDir, "expected")

function vaultFilesFrom(dir: string): Record<string, string> {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".md"))
    .reduce<Record<string, string>>((files, name) => ({
      ...files,
      [name]: readFileSync(join(dir, name), "utf-8"),
    }), {})
}

const vaultFiles = vaultFilesFrom(inputDir)

describe("builder-website vault build", () => {
  test("empty vault produces no pages", async () => {
    const { htmlFiles } = await buildVaultToWebsite({ vaultFiles: {}, cssBundle: [] })
    expect(htmlFiles).toEqual({})
  })

  test("routes come from as: home and as: page", async () => {
    const { htmlFiles } = await buildVaultToWebsite({ vaultFiles, cssBundle: [] })
    expect(Object.keys(htmlFiles).sort()).toEqual(["/", "/page"])
  })

  test("home route renders home.html", async () => {
    const { htmlFiles } = await buildVaultToWebsite({ vaultFiles, cssBundle: [] })
    expect(htmlFiles["/"]).toBe(readFileSync(join(expectedDir, "home.html"), "utf-8"))
  })

  test("page route renders page.html", async () => {
    const { htmlFiles } = await buildVaultToWebsite({ vaultFiles, cssBundle: [] })
    expect(htmlFiles["/page"]).toBe(readFileSync(join(expectedDir, "page.html"), "utf-8"))
  })

  test("cssBundle is inlined into the document", async () => {
    const dir = join(fixturesDir, "css-bundle")
    const { htmlFiles } = await buildVaultToWebsite({
      vaultFiles: vaultFilesFrom(join(dir, "input")),
      cssBundle: [readFileSync(join(dir, "input", "style.css"), "utf-8")],
    })
    expect(htmlFiles["/"]).toBe(readFileSync(join(dir, "expected", "home.html"), "utf-8"))
  })

  test("shell assets are inlined into the document", async () => {
    const dir = join(fixturesDir, "shell-assets")
    const { htmlFiles } = await buildVaultToWebsite({
      vaultFiles: vaultFilesFrom(join(dir, "input")),
      cssBundle: [],
      customCss: [readFileSync(join(dir, "assets", "customCss.css"), "utf-8")],
      customJs: [readFileSync(join(dir, "assets", "customJs.js"), "utf-8")],
    })
    expect(htmlFiles["/"]).toBe(readFileSync(join(dir, "expected", "home.html"), "utf-8"))
  })

  test("asset files are keyed by route", async () => {
    const { assetFiles } = await buildVaultToWebsite({
      vaultFiles: {},
      cssBundle: [],
      assetFiles: { "assets/pixel.png": "abc" },
    })
    expect(assetFiles).toEqual({ "/assets/pixel.png": "abc" })
  })
})

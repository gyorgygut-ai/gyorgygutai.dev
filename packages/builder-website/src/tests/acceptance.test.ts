import { describe, test, expect } from "vitest"
import { buildVaultToWebsite } from "../index"

const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M8AAwBhAQCBlwAAAABJRU5ErkJggg=="

const HOME = [
  "---",
  "as: home",
  "title: Acceptance Home",
  "description: Acceptance description",
  "---",
  "# Welcome",
  "",
  "> [!warning] Careful",
  "> Callout body.",
  "",
  "![[web/sections/about]]",
  "",
  "![[assets/pixel.png|32]]",
  "",
  "[[web/sections/about|About page]]",
  "",
  "[Download](cv_gyorgygutai.pdf)",
].join("\n")

const ABOUT = ["---", "as: page", "title: About", "---", "# About", "", "Transcluded body."].join("\n")

function build() {
  return buildVaultToWebsite({
    vaultFiles: { "web/web.md": HOME, "web/sections/about.md": ABOUT },
    assetFiles: { "assets/pixel.png": PNG_BASE64 },
    cssBundle: [":root { --acceptance-snippet: 1; }"],
  })
}

describe("builder-website acceptance", () => {
  test("links render as anchors", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain('href="/web/sections/about"')
  })

  test("callouts render with type classes", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain("callout-warning")
  })

  test("transclusions inline the target note", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain("Transcluded body.")
  })

  test("images render with an asset route", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain('src="/assets/pixel.png"')
  })

  test("images keep their width", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain('width="32"')
  })

  test("css snippets are bundled", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain("--acceptance-snippet")
  })

  test("the thin obsidian theme is bundled", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain("--h1-weight")
  })

  test("meta description is emitted", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain('name="description" content="Acceptance description"')
  })

  test("title is emitted", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain("<title>Acceptance Home</title>")
  })

  test("slugs come from the vault path", async () => {
    const { htmlFiles } = await build()
    expect(Object.keys(htmlFiles).sort()).toEqual(["/", "/web/sections/about"])
  })

  test("cross-links keep the vault path", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain('<a href="/web/sections/about">About page</a>')
  })

  test("pdf links are preserved", async () => {
    const { htmlFiles } = await build()
    expect(htmlFiles["/"]).toContain('href="cv_gyorgygutai.pdf"')
  })
})

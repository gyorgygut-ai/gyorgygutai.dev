import { describe, expect, test } from "vitest"
import { buildVaultToWebsite } from "../index"

const markdown = ["---", "as: home", "---", "# Home"].join("\n")

async function build(cssBundle: string[] = []) {
  const { htmlFiles } = await buildVaultToWebsite({
    vaultFiles: { "home.md": markdown },
    cssBundle,
  })
  return htmlFiles["/"] ?? ""
}

describe("website layout CSS", () => {
  test("content width uses the native Obsidian variable", async () => {
    expect(await build()).toContain("max-width: var(--file-line-width, 700px)")
  })

  test("content width can be overridden by a vault snippet", async () => {
    expect(await build([":root { --file-line-width: 42rem; }"])).toContain("--file-line-width: 42rem")
  })

  test("content padding uses native Obsidian file margins", async () => {
    expect(await build()).toContain("padding: var(--file-margins, 2rem 1.5rem)")
  })

  test("callout styles target the generated blockquote", async () => {
    expect(await build()).toContain("blockquote.callout {")
  })
})

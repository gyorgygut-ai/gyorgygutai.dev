import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { processVaultToStatic } from "../processVaultToStatic"

const fixturesDir = join(import.meta.dirname, "fixtures")
const vaultDir = join(fixturesDir, "vault")

describe("processVaultToStatic", () => {
  test("vault html value home.md", async () => {
    const input = vaultDir
    const expected = readFileSync(join(fixturesDir, "vault/home.expected.html"), "utf-8")

    const output = await processVaultToStatic(input)

    expect(output.html["home.md"]).toBe(expected)
  })

  test("vault html value page.md", async () => {
    const input = vaultDir
    const expected = readFileSync(join(fixturesDir, "vault/page.expected.html"), "utf-8")

    const output = await processVaultToStatic(input)

    expect(output.html["page.md"]).toBe(expected)
  })

  test("vault html value both.md", async () => {
    const input = vaultDir
    const expected = readFileSync(join(fixturesDir, "vault/both.expected.html"), "utf-8")

    const output = await processVaultToStatic(input)

    expect(output.html["both.md"]).toBe(expected)
  })

  test("vault html value a/b.md", async () => {
    const input = vaultDir
    const expected = readFileSync(join(fixturesDir, "vault/a/b.expected.html"), "utf-8")

    const output = await processVaultToStatic(input)

    expect(output.html["a/b.md"]).toBe(expected)
  })

  test("vault pdf value both.md", async () => {
    const input = vaultDir
    const expected = readFileSync(join(vaultDir, "both.expected.pdf"))

    const output = await processVaultToStatic(input)

    expect(Buffer.from(output.pdf["both.md"])).toEqual(expected)
  })
})

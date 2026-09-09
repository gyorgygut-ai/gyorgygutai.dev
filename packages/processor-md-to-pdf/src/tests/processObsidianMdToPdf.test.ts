import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { processObsidianMdToPdf } from "../processObsidianMdToPdf"

const fixturesDir = join(import.meta.dirname, "fixtures")

describe("processObsidianMdToPdf", () => {
  test("simple-note fixture pdf header and non-empty", async () => {
    const input = readFileSync(join(fixturesDir, "simple-note/input.md"), "utf-8")

    const output = await processObsidianMdToPdf(input)
    const buf = Buffer.from(output)

    expect(buf[0]).toBe(0x25)
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-")
    expect(buf.length).toBeGreaterThan(0)
  })

  test("long-note fixture pdf header and non-empty", async () => {
    const input = readFileSync(join(fixturesDir, "long-note/input.md"), "utf-8")

    const output = await processObsidianMdToPdf(input)
    const buf = Buffer.from(output)

    expect(buf[0]).toBe(0x25)
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-")
    expect(buf.length).toBeGreaterThan(0)
  })

  test("nested-transclusion fixture pdf header and non-empty", async () => {
    const input = readFileSync(join(fixturesDir, "nested-transclusion/outer.md"), "utf-8")

    const output = await processObsidianMdToPdf(input)
    const buf = Buffer.from(output)

    expect(buf[0]).toBe(0x25)
    expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-")
    expect(buf.length).toBeGreaterThan(0)
  })
})
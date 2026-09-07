import { describe, test, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { processObsidianMdToPdf } from "../processObsidianMdToPdf"

const fixturesDir = join(import.meta.dirname, "fixtures")

describe("processObsidianMdToPdf", () => {
  test("simple-note fixture deterministic pdf", async () => {
    const input = readFileSync(join(fixturesDir, "simple-note/input.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "simple-note/expected.pdf"))

    const output = await processObsidianMdToPdf(input)

    expect(Buffer.from(output)).toEqual(expected)
  })

  test("long-note fixture deterministic pdf", async () => {
    const input = readFileSync(join(fixturesDir, "long-note/input.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "long-note/expected.pdf"))

    const output = await processObsidianMdToPdf(input)

    expect(Buffer.from(output)).toEqual(expected)
  })

  test("nested-transclusion fixture deterministic pdf", async () => {
    const input = readFileSync(join(fixturesDir, "nested-transclusion/outer.md"), "utf-8")
    const expected = readFileSync(join(fixturesDir, "nested-transclusion/outer.expected.pdf"))

    const output = await processObsidianMdToPdf(input)

    expect(Buffer.from(output)).toEqual(expected)
  })
})

import { beforeAll, describe, test, expect } from "vitest"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { basename, join, resolve } from "node:path"
import { buildPdfs } from "../buildPdfs"

const vaultRoot = resolve(join(import.meta.dirname, "fixtures", "vault"))

let built: Awaited<ReturnType<typeof buildPdfs>> = []

beforeAll(async () => {
  const outDir = mkdtempSync(join(tmpdir(), "builder-pdf-"))
  try {
    built = await buildPdfs(vaultRoot, outDir)
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}, 120000)

describe("builder-pdf acceptance", () => {
  test("as: pdf notes build a PDF artifact", () => {
    expect(built.map(({ file }) => basename(file))).toEqual(["cv.pdf"])
  })

  test("built artifacts are valid pdf documents", () => {
    expect(Buffer.from(built[0]!.bytes).subarray(0, 5).toString()).toBe("%PDF-")
  })
})

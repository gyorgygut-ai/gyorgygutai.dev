import { describe, it, expect, beforeEach } from "vitest"
import worker from "../index"
import { __resetCache, __cachedKeys, slugFor } from "../processVaultToPdf"
import { vaultFiles } from "../generated/bundle"
import { hasAs, parseFrontmatter } from "@gyorgygutai/preset-obsidian-md"

function expectedPdfRoutes() {
  const pdf = new Set<string>()
  for (const [path, raw] of Object.entries(vaultFiles)) {
    const { data } = parseFrontmatter(raw)
    const slug = slugFor(path)
    if (hasAs(data, "pdf")) {
      pdf.add(slug === "/" ? "/index.pdf" : `${slug}.pdf`)
    }
  }
  return pdf
}

describe("worker-pdf.fetch", () => {
  beforeEach(() => {
    __resetCache()
  })

  it("each pdf route serves application/pdf with %PDF- header", async () => {
    const pdf = expectedPdfRoutes()
    if (pdf.size === 0) {
      const res = await worker.fetch(new Request("http://example.com/missing.pdf"))
      expect(res.status).toBe(404)
      return
    }
    for (const route of pdf) {
      const res = await worker.fetch(new Request(`http://example.com${route}`))
      expect(res.status).toBe(200)
      expect(res.headers.get("Content-Type")).toBe("application/pdf")
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
      const buf = new Uint8Array(await res.arrayBuffer())
      expect(buf[0]).toBe(0x25)
      expect(String.fromCharCode(...buf.slice(0, 5))).toBe("%PDF-")
    }
  })

  it("lazy build: one pdf request caches only that pdf route", async () => {
    const pdf = expectedPdfRoutes()
    const first = Array.from(pdf)[0]
    if (!first) {
      return
    }
    await worker.fetch(new Request(`http://example.com${first}`))
    const keys = __cachedKeys()
    expect(keys.pdf).toEqual([first])
  })

  it("stub sanity: hello/doc still work when stub bundle present", async () => {
    if (!vaultFiles["hello.md"] || !vaultFiles["doc.md"]) {
      return
    }
    const res = await worker.fetch(new Request("http://example.com/hello.pdf"))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/pdf")
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
  })
})

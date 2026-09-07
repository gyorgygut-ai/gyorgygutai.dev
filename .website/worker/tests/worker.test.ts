import { describe, it, expect, beforeEach } from "vitest"
import worker, { __resetCache, slugFor } from "../index"
import { vaultFiles, assetFiles } from "../generated/bundle"
import { parseFrontmatter } from "../../processor/parser/parseFrontmatter"
import { hasAs } from "../../processor/parser/hasAs"

function expectedRoutes() {
  const html = new Set<string>()
  const pdf = new Set<string>()
  for (const [path, raw] of Object.entries(vaultFiles)) {
    const { data } = parseFrontmatter(raw)
    const slug = slugFor(path)
    if (hasAs(data, "home")) {
      html.add("/")
    }
    if (hasAs(data, "page")) {
      html.add(slug)
    }
    if (hasAs(data, "pdf")) {
      pdf.add(slug === "/" ? "/index.pdf" : `${slug}.pdf`)
    }
  }
  return { html, pdf }
}

describe("worker.fetch", () => {
  beforeEach(() => {
    __resetCache()
  })

  it("GET / responds according to vault", async () => {
    const { html } = expectedRoutes()
    const res = await worker.fetch(new Request("http://example.com/"))
    if (html.has("/")) {
      expect(res.status).toBe(200)
      expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8")
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
      expect((await res.text()).length).toBeGreaterThan(0)
    } else {
      expect(res.status).toBe(404)
    }
  })

  it("each html route serves 200 with trailing-slash alias", async () => {
    const { html } = expectedRoutes()
    expect(html.size).toBeGreaterThan(0)
    for (const route of html) {
      const res = await worker.fetch(new Request(`http://example.com${route}`))
      expect(res.status).toBe(200)
      expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8")
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
      const slash = route === "/" ? "/" : `${route}/`
      const res2 = await worker.fetch(new Request(`http://example.com${slash}`))
      expect(res2.status).toBe(200)
    }
  })

  it("each pdf route serves application/pdf with %PDF- header", async () => {
    const { pdf } = expectedRoutes()
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

  it("GET unknown returns 404 no-store", async () => {
    const { html, pdf } = expectedRoutes()
    let missing = "/__missing__"
    while (html.has(missing) || pdf.has(missing)) {
      missing += "_x"
    }
    const res = await worker.fetch(new Request(`http://example.com${missing}`))
    expect(res.status).toBe(404)
    expect(res.headers.get("Cache-Control")).toBe("no-store")
    expect(await res.text()).toBe("Not found")
  })

  it("each asset route serves 200 with correct mime and immutable cache", async () => {
    const assets = Object.keys(assetFiles ?? {})
    if (assets.length === 0) 
{return}
    for (const rel of assets) {
      const route = "/" + rel.replace(/^\/+/, "")
      const res = await worker.fetch(new Request(`http://example.com${route}`))
      expect(res.status).toBe(200)
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
      const ct = res.headers.get("Content-Type")
      expect(ct).toBeTruthy()
      const buf = new Uint8Array(await res.arrayBuffer())
      expect(buf.length).toBeGreaterThan(0)
      if (route.endsWith(".png")) {
        expect(ct).toBe("image/png")
        expect(buf[0]).toBe(0x89)
        expect(buf[1]).toBe(0x50)
      }
    }
    const res404 = await worker.fetch(new Request("http://example.com/assets/__missing__.png"))
    expect(res404.status).toBe(404)
  })

  it("stub sanity: hello/doc still work when stub bundle present", async () => {
    if (!vaultFiles["hello.md"] || !vaultFiles["doc.md"]) {
      return
    }
    const res = await worker.fetch(new Request("http://example.com/hello"))
    expect(res.status).toBe(200)
    expect(await res.text()).toContain("<h1>Hello</h1>")
    const pdf = await worker.fetch(new Request("http://example.com/doc.pdf"))
    expect(pdf.status).toBe(200)
    expect(pdf.headers.get("Content-Type")).toBe("application/pdf")
  })
})

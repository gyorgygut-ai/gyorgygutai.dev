import { describe, it, expect, beforeEach } from "vitest"
import worker from "../index"
import { slugFor } from "@gyorgygutai/processor-md-to-html"
import { vaultFiles, assetFiles } from "../generated/bundle"
import { parseFrontmatter, hasAs } from "@gyorgygutai/processor-md-to-html"

function expectedHtmlRoutes() {
  const html = new Set<string>()
  for (const [path, raw] of Object.entries(vaultFiles)) {
    const { data } = parseFrontmatter(raw)
    const slug = slugFor(path)
    if (hasAs(data, "home")) {
      html.add("/")
    }
    if (hasAs(data, "page")) {
      html.add(slug)
    }
  }
  return html
}

describe("worker-website.fetch", () => {
  it("GET / responds according to vault", async () => {
    const html = expectedHtmlRoutes()
    const res = await worker.fetch(new Request("http://example.com/"))
    if (html.has("/")) {
      expect(res.status).toBe(200)
      expect(res.headers.get("Content-Type")).toBe("text/html; charset=utf-8")
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=31536000, immutable")
      const body = await res.text()
      expect(body.length).toBeGreaterThan(0)
      expect(body).toContain("<!DOCTYPE html>")
      expect(body).toContain("<html")
      expect(body).toContain("<main")
    } else {
      expect(res.status).toBe(404)
    }
  })

  it("each html route serves 200 with trailing-slash alias", async () => {
    const html = expectedHtmlRoutes()
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

  it("GET unknown returns 404 no-store", async () => {
    const html = expectedHtmlRoutes()
    let missing = "/__missing__"
    while (html.has(missing)) {
      missing += "_x"
    }
    const res = await worker.fetch(new Request(`http://example.com${missing}`))
    expect(res.status).toBe(404)
    expect(res.headers.get("Cache-Control")).toBe("no-store")
    expect(await res.text()).toBe("Not found")
  })

  it("each asset route serves 200 with correct mime and immutable cache", async () => {
    const assets = Object.keys(assetFiles ?? {})
    if (assets.length === 0) {
      return
    }
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
  })
})

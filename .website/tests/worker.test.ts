import { describe, it, expect, beforeEach } from "vitest"
import worker, { resetCache } from "../worker/index"

describe("worker", () => {
  beforeEach(() => {
    resetCache()
  })

  it("returns html for /", async () => {
    const res = await worker.fetch(new Request("https://example.com/"))
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toContain("text/html")
    expect(res.headers.get("Cache-Control")).toContain("immutable")
    const html = await res.text()
    expect(html).toContain("<")
    expect(html).toContain("<style>")
    expect(html).toContain("--background-primary")
  })

  it("returns html for /links", async () => {
    const res = await worker.fetch(new Request("https://example.com/links"))
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain("Face Value")
  })

  it("returns html for /project-based from pdf folder", async () => {
    const res = await worker.fetch(new Request("https://example.com/project-based"))
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain("Full Stack Developer")
  })

  it("trailing slash normalized", async () => {
    const res = await worker.fetch(new Request("https://example.com/links/"))
    expect(res.status).toBe(200)
  })

  it("returns 404 for unknown", async () => {
    const res = await worker.fetch(new Request("https://example.com/unknown"))
    expect(res.status).toBe(404)
  })

  it("second call returns same html (build once, cached)", async () => {
    const a = await (await worker.fetch(new Request("https://example.com/"))).text()
    const b = await (await worker.fetch(new Request("https://example.com/"))).text()
    expect(a).toBe(b)
  })

  it("pdf path 404 when no pdf variant", async () => {
    const res = await worker.fetch(new Request("https://example.com/project-based.pdf"))
    expect(res.status).toBe(404)
  })

  it("delegates to ASSETS when html miss and ASSETS provides", async () => {
    const fakeAsset = new Response("fake png", { status: 200, headers: { "Content-Type": "image/png" } })
    const env = { ASSETS: { fetch: async () => fakeAsset } }
    const res = await worker.fetch(new Request("https://example.com/assets/cv_photo_2026_2.png"), env)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe("fake png")
  })
})

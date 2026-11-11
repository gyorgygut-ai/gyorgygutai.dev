import { describe, expect, test, vi } from "vitest"
import worker from "../index"

const page = "<!doctype html><title>Home</title>"

function environment(status = 200, pdfFetch = async () => new Response("%PDF-test", {
  headers: { "content-type": "application/pdf" },
})) {
  return {
    ASSETS: {
      fetch: async () => new Response(status === 200 ? page : "Not found", {
        status,
        headers: { "content-type": "text/html; charset=utf-8" },
      }),
    },
    PDF: { fetch: pdfFetch },
  }
}

describe("worker-website", () => {
  test("serves the asset binding response", async () => {
    const response = await worker.fetch(new Request("https://example.test/"), environment())
    expect(await response.text()).toBe(page)
  })

  test("sets immutable cache headers on a served asset", async () => {
    const response = await worker.fetch(new Request("https://example.test/"), environment())
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
  })

  test("maps a missing asset to a no-store 404", async () => {
    const response = await worker.fetch(new Request("https://example.test/missing"), environment(404))
    expect([response.status, response.headers.get("cache-control")]).toEqual([404, "no-store"])
  })

  test("forwards PDF requests to the PDF service unchanged", async () => {
    const request = new Request("http://localhost:8787/cv_gyorgygutai.pdf")
    const pdfFetch = vi.fn(async () => new Response("%PDF-test"))
    const response = await worker.fetch(request, environment(200, pdfFetch))

    expect(pdfFetch).toHaveBeenCalledWith(request)
    expect(await response.text()).toBe("%PDF-test")
  })

  test("rejects methods other than GET and HEAD", async () => {
    const response = await worker.fetch(new Request("https://example.test/", { method: "POST" }), environment())
    expect(response.status).toBe(405)
  })
})

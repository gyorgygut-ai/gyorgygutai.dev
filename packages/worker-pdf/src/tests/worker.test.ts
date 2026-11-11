import { describe, expect, test } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import worker from "../index"

const pdf = new Uint8Array(readFileSync(join(import.meta.dirname, "fixtures", "expected", "resume.pdf")))

function environment(status = 200) {
  return {
    ASSETS: {
      fetch: async () => new Response(status === 200 ? pdf : "Not found", {
        status,
        headers: { "content-type": "application/octet-stream" },
      }),
    },
  }
}

describe("worker-pdf", () => {
  test("serves the asset binding response as PDF", async () => {
    const response = await worker.fetch(new Request("https://example.test/resume.pdf"), environment())
    expect(response.headers.get("content-type")).toBe("application/pdf")
  })

  test("sets immutable cache headers on a PDF", async () => {
    const response = await worker.fetch(new Request("https://example.test/resume.pdf"), environment())
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable")
  })

  test("returns artifact bytes", async () => {
    const response = await worker.fetch(new Request("https://example.test/resume.pdf"), environment())
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pdf)
  })

  test("maps a missing PDF to a no-store 404", async () => {
    const response = await worker.fetch(new Request("https://example.test/missing.pdf"), environment(404))
    expect([response.status, response.headers.get("cache-control")]).toEqual([404, "no-store"])
  })

  test("rejects non-PDF paths", async () => {
    const response = await worker.fetch(new Request("https://example.test/resume"), environment())
    expect(response.status).toBe(404)
  })

  test("rejects methods other than GET and HEAD", async () => {
    const response = await worker.fetch(new Request("https://example.test/resume.pdf", { method: "POST" }), environment())
    expect(response.status).toBe(405)
  })
})

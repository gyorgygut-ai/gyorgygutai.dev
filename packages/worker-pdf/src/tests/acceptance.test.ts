import { describe, expect, test } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import worker from "../index"

const pdf = new Uint8Array(readFileSync(join(import.meta.dirname, "fixtures", "expected", "resume.pdf")))
const env = {
  ASSETS: {
    fetch: async (request: Request) => new URL(request.url).pathname === "/resume.pdf"
      ? new Response(pdf, { headers: { "content-type": "application/pdf" } })
      : new Response("Not found", { status: 404 }),
  },
}

describe("worker-pdf acceptance", () => {
  test("serves a built PDF artifact", async () => {
    const response = await worker.fetch(new Request("http://localhost/resume.pdf"), env)
    expect(String.fromCharCode(...new Uint8Array(await response.arrayBuffer()).slice(0, 5))).toBe("%PDF-")
  })

  test("returns a no-store 404 for an unknown PDF", async () => {
    const response = await worker.fetch(new Request("http://localhost/missing.pdf"), env)
    expect([response.status, response.headers.get("cache-control")]).toEqual([404, "no-store"])
  })
})

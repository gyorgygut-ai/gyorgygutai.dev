import { describe, expect, test } from "vitest"
import worker from "../index"

const homeHtml = "<!doctype html><html><body><main>Home</main></body></html>"
const aboutHtml = "<!doctype html><html><body><main>About</main></body></html>"
const files: Record<string, string> = {
  "/index.html": homeHtml,
  "/web/sections/about/index.html": aboutHtml,
}

const env = {
  ASSETS: {
    fetch: async (request: Request) => {
      const path = new URL(request.url).pathname
      const resolvedPath = path === "/" ? "/index.html" : `${path}/index.html`
      const body = files[resolvedPath]
      return body
        ? new Response(body, { headers: { "content-type": "text/html; charset=utf-8" } })
        : new Response("Not found", { status: 404 })
    },
  },
  PDF: {
    fetch: async () => new Response("Not found", { status: 404 }),
  },
}

describe("worker-website acceptance", () => {
  test("serves the built home page through the asset binding", async () => {
    const response = await worker.fetch(new Request("http://localhost/"), env)
    expect(await response.text()).toBe(homeHtml)
  })

  test("serves a built pretty route through the asset binding", async () => {
    const response = await worker.fetch(new Request("http://localhost/web/sections/about"), env)
    expect(await response.text()).toBe(aboutHtml)
  })

  test("returns a no-store 404 for an unknown page", async () => {
    const response = await worker.fetch(new Request("http://localhost/unknown"), env)
    expect([response.status, response.headers.get("cache-control")]).toEqual([404, "no-store"])
  })
})

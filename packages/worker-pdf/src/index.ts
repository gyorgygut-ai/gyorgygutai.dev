interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const pathname = new URL(request.url).pathname
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD", "Cache-Control": "no-store" },
      })
    }
    if (!pathname.endsWith(".pdf")) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }

    const response = await env.ASSETS.fetch(request)
    if (response.status === 404) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }

    const headers = new Headers(response.headers)
    headers.set("Content-Type", "application/pdf")
    headers.set("Cache-Control", "public, max-age=31536000, immutable")
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
  },
}

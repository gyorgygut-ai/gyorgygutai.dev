import { processVaultToStatic } from "./processVaultToStatic"
import { cssBundle, vaultFiles, assetFiles } from "./generated/bundle"

const handler = processVaultToStatic({ vaultFiles, cssBundle, assetFiles })

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname.endsWith(".pdf")) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }
    return handler.handleRequest(request)
  },
}

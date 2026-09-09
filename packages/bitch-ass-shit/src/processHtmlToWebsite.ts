import { parseFrontmatter, hasAs, slugFor } from "@gyorgygutai/processor-md-to-html"
import { renderDocument } from "./renderDocument"

function mimeForBundle(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase()
  const map: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    avif: "image/avif",
  }
  return map[ext ?? ""] ?? "application/octet-stream"
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const u = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    u[i] = bin.charCodeAt(i)
  }
  return u
}

export function processHtmlToWebsite(
  processFn: (md: string, css?: string, vaultFiles?: Record<string, string>) => Promise<string>,
  bundle: { vaultFiles: Record<string, string>; cssBundle: string; assetFiles: Record<string, string> },
  { siteCss, siteJs }: { siteCss: string; siteJs: string }
) {
  const { vaultFiles, cssBundle, assetFiles } = bundle
  const routeToFile = new Map<string, string>()
  const assets = new Map<string, { bytes: Uint8Array; mime: string }>()

  for (const [path, raw] of Object.entries(vaultFiles)) {
    const { data } = parseFrontmatter(raw)
    if (hasAs(data, "home")) routeToFile.set("/", path)
    if (hasAs(data, "page")) routeToFile.set(slugFor(path), path)
  }

  for (const [rel, b64] of Object.entries(assetFiles ?? {})) {
    const route = "/" + rel.replace(/^\/+/, "")
    assets.set(route, { bytes: base64ToBytes(b64 as string), mime: mimeForBundle(rel) })
  }

  function extractMeta(pathname: string): Record<string, unknown> {
    const filePath = routeToFile.get(pathname)
    if (!filePath) return {}
    const { data } = parseFrontmatter(vaultFiles[filePath])
    return data || {}
  }

  return {
    async handleRequest(request: Request): Promise<Response> {
      const url = new URL(request.url)
      let pathname = url.pathname
      if (pathname.length > 1 && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1)
      }

      if (assets.has(pathname)) {
        const { bytes, mime } = assets.get(pathname)!
        return new Response(bytes as unknown as BodyInit, {
          headers: {
            "Content-Type": mime,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        })
      }

      if (pathname.endsWith(".pdf")) {
        return new Response("Not found", {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        })
      }

      const filePath = routeToFile.get(pathname)
      if (!filePath) {
        return new Response("Not found", {
          status: 404,
          headers: { "Cache-Control": "no-store" },
        })
      }

      const raw = vaultFiles[filePath]
      const html = await processFn(raw, cssBundle, vaultFiles)
      const meta = extractMeta(pathname)
      const document = renderDocument(html, { meta, siteCss, siteJs })
      return new Response(document, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    },
  }
}

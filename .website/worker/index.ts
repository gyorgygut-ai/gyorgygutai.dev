import { parseFrontmatter } from "../processor/parser/parseFrontmatter"
import { hasAs } from "../processor/parser/hasAs"
import { processObsidianMdToHtml } from "../processor/processObsidianMdToHtml"
import { processObsidianMdToPdf } from "../processor/processObsidianMdToPdf"
import { cssBundle, vaultFiles, assetFiles } from "./generated/bundle"

type Cache = {
  html: Map<string, string>
  pdf: Map<string, Uint8Array>
  assets: Map<string, { bytes: Uint8Array; mime: string }>
}

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
  for (let i = 0; i < bin.length; i++) 
{u[i] = bin.charCodeAt(i)}
  return u
}

let cache: Cache | null = null
let building: Promise<Cache> | null = null

export function __resetCache(): void {
  cache = null
  building = null
}

export function slugFor(path: string): string {
  const withoutExt = path.replace(/\.md$/, "")
  if (withoutExt === "index") {
    return "/"
  }
  if (withoutExt.endsWith("/index")) {
    return "/" + withoutExt.slice(0, -6)
  }
  return "/" + withoutExt
}

async function buildCache(): Promise<Cache> {
  if (cache) {
    return cache
  }
  if (building) {
    return building
  }
  building = (async () => {
    const html = new Map<string, string>()
    const pdf = new Map<string, Uint8Array>()
    for (const [path, raw] of Object.entries(vaultFiles)) {
      const { data } = parseFrontmatter(raw)
      if (!hasAs(data, "home") && !hasAs(data, "page") && !hasAs(data, "pdf")) {
        continue
      }
      const slug = slugFor(path)
      if (hasAs(data, "home")) {
        html.set("/", await processObsidianMdToHtml(raw, cssBundle, vaultFiles))
      }
      if (hasAs(data, "page")) {
        html.set(slug, await processObsidianMdToHtml(raw, cssBundle, vaultFiles))
      }
      if (hasAs(data, "pdf")) {
        const pdfSlug = slug === "/" ? "/index.pdf" : `${slug}.pdf`
        pdf.set(pdfSlug, await processObsidianMdToPdf(raw, vaultFiles))
      }
    }
    const assets = new Map<string, { bytes: Uint8Array; mime: string }>()
    for (const [rel, b64] of Object.entries(assetFiles ?? {})) {
      const bytes = base64ToBytes(b64 as string)
      assets.set("/" + rel.replace(/^\/+/, ""), { bytes, mime: mimeForBundle(rel) })
    }
    cache = { html, pdf, assets }
    return cache
  })()
  const result = await building
  building = null
  return result
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    let pathname = url.pathname
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1)
    }

    const c = await buildCache()

    if (pathname.endsWith(".pdf") && c.pdf.has(pathname)) {
      const bytes = c.pdf.get(pathname)!
      return new Response(bytes as unknown as BodyInit, {
        headers: {
          "Content-Type": "application/pdf",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    if (c.assets.has(pathname)) {
      const { bytes, mime } = c.assets.get(pathname)!
      return new Response(bytes as unknown as BodyInit, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    if (c.html.has(pathname)) {
      return new Response(c.html.get(pathname)!, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  },
}

import { parseFrontmatter, hasAs, processObsidianMdToHtml } from "@gyorgygutai/processor-md-to-html"
import { processObsidianMdToPdf } from "@gyorgygutai/processor-md-to-pdf"
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

const knownHtml = new Set<string>()
const knownPdf = new Set<string>()
const routeToFile = new Map<string, string>()
for (const [path, raw] of Object.entries(vaultFiles)) {
  const { data } = parseFrontmatter(raw)
  const slug = slugFor(path)
  if (hasAs(data, "home")) {
    knownHtml.add("/")
    routeToFile.set("/", path)
  }
  if (hasAs(data, "page")) {
    knownHtml.add(slug)
    routeToFile.set(slug, path)
  }
  if (hasAs(data, "pdf")) {
    const pdfSlug = slug === "/" ? "/index.pdf" : `${slug}.pdf`
    knownPdf.add(pdfSlug)
    routeToFile.set(pdfSlug, path)
  }
}

export function __resetCache(): void {
  cache = null
  buildingByFile.clear()
}

export function __cachedKeys(): { html: string[]; pdf: string[]; assets: string[] } {
  if (!cache) {
    return { html: [], pdf: [], assets: [] }
  }
  return {
    html: Array.from(cache.html.keys()),
    pdf: Array.from(cache.pdf.keys()),
    assets: Array.from(cache.assets.keys()),
  }
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

function ensureCache(): Cache {
  if (!cache) {
    const html = new Map<string, string>()
    const pdf = new Map<string, Uint8Array>()
    const assets = new Map<string, { bytes: Uint8Array; mime: string }>()
    for (const [rel, b64] of Object.entries(assetFiles ?? {})) {
      const bytes = base64ToBytes(b64 as string)
      assets.set("/" + rel.replace(/^\/+/, ""), { bytes, mime: mimeForBundle(rel) })
    }
    cache = { html, pdf, assets }
  }
  return cache
}

const buildingByFile = new Map<string, Promise<void>>()

async function buildRoute(route: string): Promise<void> {
  const filePath = routeToFile.get(route)
  if (!filePath) {
    return
  }
  const c = ensureCache()
  const targetMap = route.endsWith(".pdf") ? c.pdf : c.html
  if (targetMap.has(route)) {
    return
  }
  if (buildingByFile.has(filePath)) {
    await buildingByFile.get(filePath)
    return
  }
  const p = (async () => {
    const raw = vaultFiles[filePath]
    const { data } = parseFrontmatter(raw)
    const slug = slugFor(filePath)
    if (hasAs(data, "home")) {
      c.html.set("/", await processObsidianMdToHtml(raw, cssBundle, vaultFiles))
    }
    if (hasAs(data, "page")) {
      c.html.set(slug, await processObsidianMdToHtml(raw, cssBundle, vaultFiles))
    }
    if (hasAs(data, "pdf")) {
      const pdfSlug = slug === "/" ? "/index.pdf" : `${slug}.pdf`
      c.pdf.set(pdfSlug, await processObsidianMdToPdf(raw, vaultFiles))
    }
  })()
  buildingByFile.set(filePath, p)
  await p
  buildingByFile.delete(filePath)
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    let pathname = url.pathname
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1)
    }

    const c = ensureCache()

    if (pathname.endsWith(".pdf")) {
    if (!knownPdf.has(pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }
    await buildRoute(pathname)
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

  if (knownHtml.has(pathname)) {
    await buildRoute(pathname)
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

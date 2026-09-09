import { parseFrontmatter, hasAs } from "@gyorgygutai/processor-md-to-html"
import { processObsidianMdToPdf } from "@gyorgygutai/processor-md-to-pdf"
import { vaultFiles } from "./generated/bundle"

type Cache = {
  pdf: Map<string, Uint8Array>
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const u = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) {
    u[i] = bin.charCodeAt(i)
  }
  return u
}

let cache: Cache | null = null

const knownPdf = new Set<string>()
const routeToFile = new Map<string, string>()
for (const [path, raw] of Object.entries(vaultFiles)) {
  const { data } = parseFrontmatter(raw)
  const slug = slugFor(path)
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

export function __cachedKeys(): { pdf: string[] } {
  if (!cache) {
    return { pdf: [] }
  }
  return {
    pdf: Array.from(cache.pdf.keys()),
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
    cache = { pdf: new Map<string, Uint8Array>() }
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
  if (c.pdf.has(route)) {
    return
  }
  if (buildingByFile.has(filePath)) {
    await buildingByFile.get(filePath)
    return
  }
  const p = (async () => {
    const raw = vaultFiles[filePath]
    const slug = slugFor(filePath)
    const pdfSlug = slug === "/" ? "/index.pdf" : `${slug}.pdf`
    c.pdf.set(pdfSlug, await processObsidianMdToPdf(raw, vaultFiles))
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

    if (!pathname.endsWith(".pdf")) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }

    if (!knownPdf.has(pathname)) {
      return new Response("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      })
    }

    const c = ensureCache()
    await buildRoute(pathname)
    const bytes = c.pdf.get(pathname)!
    return new Response(bytes as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  },
}

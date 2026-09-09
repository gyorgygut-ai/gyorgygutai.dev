import { process } from "@gyorgygutai/processor-pdf"
import { hasAs, parseFrontmatter } from "@gyorgygutai/preset-obsidian-md"

export interface PdfBundle {
  vaultFiles: Record<string, string>
}

type PdfCache = {
  pdf: Map<string, Uint8Array>
}

let cache: PdfCache | null = null
const buildingByFile = new Map<string, Promise<void>>()

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

export function processVaultToPdf(bundle: PdfBundle): {
  buildRoute: (route: string) => Promise<void>
  ensureCache: () => PdfCache
  knownPdf: Set<string>
  handleRequest: (request: Request) => Promise<Response>
} {
  const { vaultFiles } = bundle

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

  function ensureCache(): PdfCache {
    if (!cache) {
      cache = { pdf: new Map<string, Uint8Array>() }
    }
    return cache
  }

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
      c.pdf.set(pdfSlug, await process({ markdown: raw, vaultFiles, path: filePath }))
    })()
    buildingByFile.set(filePath, p)
    await p
    buildingByFile.delete(filePath)
  }

  async function handleRequest(request: Request): Promise<Response> {
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
  }

  return { buildRoute, ensureCache, knownPdf, handleRequest }
}

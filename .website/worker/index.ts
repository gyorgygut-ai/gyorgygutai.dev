import { parseFrontmatter } from "../processor/parser/parseFrontmatter"
import { processObsidianMdToHtml } from "../processor/processObsidianMdToHtml"
import { processObsidianMdToPdf } from "../processor/processObsidianMdToPdf"
import { cssBundle, vaultFiles } from "./generated/vault"

type Cache = {
  html: Map<string, string>
  pdf: Map<string, Uint8Array>
}

let cache: Cache | null = null
let building: Promise<Cache> | null = null

function hasAs(data: Record<string, unknown>, target: string): boolean {
  const as = data.as as unknown
  if (Array.isArray(as)) {
    return (as as unknown[]).includes(target)
  }
  return as === target
}

function normalize(data: Record<string, unknown>): { isHome: boolean; isPage: boolean; isPdf: boolean } {
  const isHome = hasAs(data, "home")
  const isPage = hasAs(data, "page")
  const isPdf = hasAs(data, "pdf")
  if (isPdf) {
    return { isHome, isPage, isPdf }
  }
  if (isHome || isPage) {
    return { isHome, isPage, isPdf: false }
  }
  return { isHome: false, isPage: false, isPdf: false }
}

function slugFor(path: string): string {
  if (path === "index.md") {
    return "/"
  }
  const withoutExt = path.replace(/\.md$/, "")
  const withoutContent = withoutExt.replace(/^content\//, "").replace(/^pdf\//, "")
  return "/" + withoutContent
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
      const { isHome, isPage, isPdf } = normalize(data)
      if (!isHome && !isPage && !isPdf) {
        continue
      }
      const slug = slugFor(path)
      if (isHome) {
        html.set("/", await processObsidianMdToHtml(raw, cssBundle))
      }
      if (isPage && !isHome) {
        html.set(slug, await processObsidianMdToHtml(raw, cssBundle))
      }
      if (isHome && isPage) {
        const rendered = html.get("/")!
        if (!html.has(slug) && slug !== "/") {
          html.set(slug, rendered)
        }
      }
      if (isPdf) {
        const pdfSlug = slug === "/" ? "/index.pdf" : `${slug}.pdf`
        pdf.set(pdfSlug, await processObsidianMdToPdf(raw))
        if (isPage || isHome) {
          const htmlPdf = `${slug}.pdf`
          if (!pdf.has(htmlPdf) && htmlPdf !== pdfSlug) {
            pdf.set(htmlPdf, await processObsidianMdToPdf(raw))
          }
        }
      }
    }
    cache = { html, pdf }
    return cache
  })()
  const result = await building
  building = null
  return result
}

export function resetCache(): void {
  cache = null
  building = null
}

export default {
  async fetch(request: Request, env?: { ASSETS?: { fetch: typeof fetch } }): Promise<Response> {
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

    if (c.html.has(pathname)) {
      const accept = request.headers.get("Accept") ?? ""
      if (accept.includes("application/pdf")) {
        const pdfPath = pathname === "/" ? "/index.pdf" : `${pathname}.pdf`
        if (c.pdf.has(pdfPath)) {
          const bytes = c.pdf.get(pdfPath)!
          return new Response(bytes as unknown as BodyInit, {
            headers: {
              "Content-Type": "application/pdf",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          })
        }
      }
      return new Response(c.html.get(pathname)!, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      })
    }

    if (env?.ASSETS) {
      try {
        const assetRes = await env.ASSETS.fetch(request)
        if (assetRes.status !== 404) {
          return assetRes
        }
      } catch {}
    }

    return new Response("Not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  },
}

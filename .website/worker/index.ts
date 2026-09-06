import { parseFrontmatter } from "../processor/parser/parseFrontmatter"
import { hasAs } from "../processor/parser/hasAs"
import { processObsidianMdToHtml } from "../processor/processObsidianMdToHtml"
import { processObsidianMdToPdf } from "../processor/processObsidianMdToPdf"
import { cssBundle, vaultFiles } from "./generated/bundle"

type Cache = {
  html: Map<string, string>
  pdf: Map<string, Uint8Array>
}

let cache: Cache | null = null
let building: Promise<Cache> | null = null

function slugFor(path: string): string {
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
        html.set("/", await processObsidianMdToHtml(raw, cssBundle))
      }
      if (hasAs(data, "page")) {
        html.set(slug, await processObsidianMdToHtml(raw, cssBundle))
      }
      if (hasAs(data, "pdf")) {
        const pdfSlug = slug === "/" ? "/index.pdf" : `${slug}.pdf`
        pdf.set(pdfSlug, await processObsidianMdToPdf(raw))
      }
    }
    cache = { html, pdf }
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

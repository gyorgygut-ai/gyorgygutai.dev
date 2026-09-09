import { parseFrontmatter, hasAs, processObsidianMdToHtml } from "@gyorgygutai/processor-md-to-html"

export interface VaultBundle {
  vaultFiles: Record<string, string>
  cssBundle: string
  assetFiles: Record<string, string>
}

export interface StaticHandler {
  buildRoute: (route: string) => Promise<void>
  ensureCache: () => Cache
  knownHtml: Set<string>
  assets: Map<string, { bytes: Uint8Array; mime: string }>
  handleRequest: (request: Request) => Promise<Response>
}

type Cache = {
  html: Map<string, string>
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
  for (let i = 0; i < bin.length; i++) {
    u[i] = bin.charCodeAt(i)
  }
  return u
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

export function processVaultToStatic(bundle: VaultBundle): StaticHandler {
  const { vaultFiles, cssBundle, assetFiles } = bundle

  let cache: Cache | null = null

  const knownHtml = new Set<string>()
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
  }

  function ensureCache(): Cache {
    if (!cache) {
      const html = new Map<string, string>()
      const assets = new Map<string, { bytes: Uint8Array; mime: string }>()
      for (const [rel, b64] of Object.entries(assetFiles ?? {})) {
        const bytes = base64ToBytes(b64 as string)
        assets.set("/" + rel.replace(/^\/+/, ""), { bytes, mime: mimeForBundle(rel) })
      }
      cache = { html, assets }
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
    if (c.html.has(route)) {
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

    const c = ensureCache()

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
  }

  return { buildRoute, ensureCache, knownHtml, assets: ensureCache().assets, handleRequest, slugFor }
}

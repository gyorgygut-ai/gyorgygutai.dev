import grayMatter from "gray-matter"
import process from "./process.js"

export { process }
export default process

export interface BuildWebsiteInput {
  vaultFiles: Record<string, string>
  assetFiles?: Record<string, string>
  cssBundle: string[]
  customCss?: string[]
  customJs?: string[]
}

export interface BuildWebsiteOutput {
  htmlFiles: Record<string, string>
  assetFiles: Record<string, string>
}

function slugFor(path: string): string {
  const withoutExtension = path.replace(/\.md$/i, "")
  if (withoutExtension === "index") {return "/"}
  if (withoutExtension.endsWith("/index")) {return `/${withoutExtension.slice(0, -6)}`}
  return `/${withoutExtension}`
}

function pageRoutes(vaultFiles: Record<string, string>): Map<string, string> {
  return Object.entries(vaultFiles).reduce((routes, [path, raw]) => {
    const as = grayMatter(raw).data.as
    const flags = Array.isArray(as) ? as : [as]
    if (flags.includes("home")) {addRoute(routes, "/", path)}
    if (flags.includes("page")) {addRoute(routes, slugFor(path), path)}
    return routes
  }, new Map<string, string>())
}

function addRoute(routes: Map<string, string>, route: string, path: string): void {
  const existing = routes.get(route)
  if (existing && existing !== path) {
    throw new Error(`Duplicate website route ${route}: ${existing} and ${path}`)
  }
  routes.set(route, path)
}

export async function buildVaultToWebsite(input: BuildWebsiteInput): Promise<BuildWebsiteOutput> {
  const htmlFiles: Record<string, string> = {}
  await [...pageRoutes(input.vaultFiles)].reduce<Promise<void>>(async (previous, [route, path]) => {
    await previous
    const raw = input.vaultFiles[path]
    if (raw === undefined) {
      throw new Error(`Missing vault file for route ${route}: ${path}`)
    }
    const { data } = grayMatter(raw)
    htmlFiles[route] = await process({
      markdown: raw,
      meta: data,
      vaultFiles: input.vaultFiles,
      path,
      customCss: [...input.cssBundle, ...(input.customCss ?? [])],
      customJs: input.customJs,
    })
  }, Promise.resolve())
  const assetFiles = Object.fromEntries(
    Object.entries(input.assetFiles ?? {}).map(([rel, base64]) => ["/" + rel.replace(/^\/+/, ""), base64]),
  )
  return { htmlFiles, assetFiles }
}

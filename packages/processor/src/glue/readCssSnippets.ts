import { readFileSync, readdirSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"

export function orderCssFiles(files: string[], ordered: string[] | null): string[] {
  if (!ordered || ordered.length === 0) {
    return files
  }
  const set = new Set(files)
  const normalizedOrdered = ordered.map((f) => (f.endsWith(".css") ? f : f + ".css")).filter((f) => set.has(f))
  const remaining = files.filter((f) => !normalizedOrdered.includes(f))
  return [...normalizedOrdered, ...remaining]
}

export function cleanCss(css: string): string {
  return css
    .split("\n")
    .filter((line) => line.trim() !== "")
    .join("\n")
}

export function readCssSnippets(cssDir: string): string {
  let files: string[]
  try {
    files = readdirSync(cssDir).filter((f) => f.endsWith(".css")).sort()
  } catch {
    return ""
  }
  if (files.length === 0) {
    return ""
  }

  let ordered: string[] | null = null
  try {
    const appearancePath = join(dirname(cssDir), "appearance.json")
    if (existsSync(appearancePath)) {
      const data = JSON.parse(readFileSync(appearancePath, "utf-8"))
      if (Array.isArray(data.enabledCssSnippets)) {
        ordered = data.enabledCssSnippets as string[]
      }
    } else {
      const altPath = join(cssDir, "appearance.json")
      if (existsSync(altPath)) {
        const data = JSON.parse(readFileSync(altPath, "utf-8"))
        if (Array.isArray(data.enabledCssSnippets)) {
          ordered = data.enabledCssSnippets as string[]
        }
      }
    }
  } catch {}

  files = orderCssFiles(files, ordered)

  const css = files.map((f) => readFileSync(join(cssDir, f), "utf-8")).join("\n")
  return cleanCss(css)
}

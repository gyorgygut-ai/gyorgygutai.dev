import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, resolve } from "node:path"
import type { Processor } from "unified"
import { parseFrontmatter } from "../parser/parseFrontmatter"

function vaultRoot(): string {
  return resolve(process.cwd(), process.env.VAULT_ROOT ?? "")
}

function withoutMarkdownExtension(path: string): string {
  return path.replace(/\.md$/, "")
}

function isNoteTransclusion(target: string): boolean {
  if (target.includes("|")) {
    return false
  }
  return !/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(target)
}

function searchNotes(dir: string, matches: (path: string) => boolean): string | null {
  let entries: string[]
  try {
    entries = readdirSync(dir).sort()
  } catch {
    return null
  }
  for (const entry of entries) {
    const full = join(dir, entry)
    let st: ReturnType<typeof statSync>
    try {
      st = statSync(full)
    } catch {
      continue
    }
    if (st.isDirectory()) {
      const found = searchNotes(full, matches)
      if (found !== null) {
        return found
      }
    } else if (matches(full)) {
      return full
    }
  }
  return null
}

function findInVaultFiles(fileName: string, vaultFiles: Record<string, string> | null): string | null {
  if (!vaultFiles) {
    return null
  }
  const keys = Object.keys(vaultFiles).sort()
  for (const k of keys) {
    if (k === fileName || k.endsWith("/" + fileName)) {
      return k
    }
  }
  return null
}

function findNoteFile(fileName: string, vaultFiles: Record<string, string> | null): string | null {
  const fromMap = findInVaultFiles(fileName, vaultFiles)
  if (fromMap !== null) {
    return fromMap
  }
  const direct = join(vaultRoot(), fileName)
  try {
    statSync(direct)
    return direct
  } catch {
    return searchNotes(vaultRoot(), (path) => path.endsWith(fileName))
  }
}

function findNoteFileByBody(body: string, vaultFiles: Record<string, string> | null): string | null {
  if (vaultFiles) {
    for (const [k, v] of Object.entries(vaultFiles)) {
      try {
        if (parseFrontmatter(v).content === body) {
          return k
        }
      } catch {}
    }
  }
  return searchNotes(vaultRoot(), (path) => {
    if (!path.endsWith(".md")) {
      return false
    }
    try {
      return parseFrontmatter(readFileSync(path, "utf-8")).content === body
    } catch {
      return false
    }
  })
}

function readNoteFile(key: string, vaultFiles: Record<string, string> | null): string | null {
  if (vaultFiles && key in vaultFiles) {
    return vaultFiles[key]
  }
  if (vaultFiles) {
    const mapped = findInVaultFiles(key, vaultFiles)
    if (mapped && mapped in vaultFiles) {
      return vaultFiles[mapped]
    }
  }
  try {
    return readFileSync(key, "utf-8")
  } catch {
    return null
  }
}

let fallbackVaultFiles: Record<string, string> | null = null

export function setVaultFiles(map: Record<string, string> | null): void {
  fallbackVaultFiles = map
}

function resolveTransclusions(content: string, seen: Set<string>, vaultFiles: Record<string, string> | null): string {
  const pattern = /!\[\[([^\]]+)\]\]/g
  let resolved = ""
  let cursor = 0
  let match: RegExpExecArray | null
  while ((match = pattern.exec(content)) !== null) {
    resolved += content.slice(cursor, match.index)
    cursor = pattern.lastIndex
    const target = match[1].trim()
    if (!isNoteTransclusion(target)) {
      resolved += match[0]
      continue
    }
    const name = withoutMarkdownExtension(target)
    const key = findNoteFile(`${name}.md`, vaultFiles)
    if (key === null) {
      resolved += `<p><em>Transclusion missing: ${name}</em></p>`
      continue
    }
    if (seen.has(key)) {
      resolved += `<p><em>Transclusion cycle detected: ${name}</em></p>`
      continue
    }
    const note = readNoteFile(key, vaultFiles)
    if (note === null) {
      resolved += `<p><em>Transclusion missing: ${name}</em></p>`
      continue
    }
    seen.add(key)
    resolved += resolveTransclusions(parseFrontmatter(note).content, seen, vaultFiles)
    seen.delete(key)
  }
  resolved += content.slice(cursor)
  return resolved
}

export default function transclude(this: Processor): void {
  const parse = this.parser
  if (!parse) {
    return
  }
  const dataVaultFiles = (this as unknown as { data(key: string): unknown }).data("vaultFiles") as Record<string, string> | undefined
  const getVaultFiles = (): Record<string, string> | null => dataVaultFiles ?? fallbackVaultFiles
  this.parser = (document, file) => {
    const vaultFiles = (this as unknown as { data(key: string): unknown }).data("vaultFiles") as Record<string, string> | undefined ?? getVaultFiles()
    const seen = new Set<string>()
    const root = findNoteFileByBody(document, vaultFiles)
    if (root !== null) {
      seen.add(root)
    }
    return parse(resolveTransclusions(document, seen, vaultFiles), file)
  }
}

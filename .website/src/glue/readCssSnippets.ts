import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export function readCssSnippets(cssDir: string): string {
  let files: string[];
  try {
    files = readdirSync(cssDir).filter((f) => f.endsWith(".css")).sort();
  } catch {
    return "";
  }
  if (files.length === 0) return "";

  let ordered: string[] | null = null;
  const candidates = [join(cssDir, "appearance.json"), join(cssDir, "../appearance.json"), join(cssDir, "../.obsidian/appearance.json"), join(cssDir, ".obsidian/appearance.json")];
  for (const p of candidates) {
    try {
      if (!existsSync(p)) continue;
      const raw = readFileSync(p, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.enabledCssSnippets)) {
        ordered = data.enabledCssSnippets as string[];
        break;
      }
    } catch {}
  }

  if (ordered && ordered.length > 0) {
    const set = new Set(files);
    const orderedFiles = ordered.filter((f) => set.has(f) || set.has(f + ".css") || set.has(f.replace(/\.css$/, "")));
    const normalizedOrdered = orderedFiles.map((f) => (f.endsWith(".css") ? f : f + ".css")).filter((f) => set.has(f));
    const remaining = files.filter((f) => !normalizedOrdered.includes(f));
    files = [...normalizedOrdered, ...remaining];
  }

  return files.map((f) => readFileSync(join(cssDir, f), "utf-8")).join("\n");
}

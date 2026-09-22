# Preset — Obsidian Markdown (unified plugin array)

## Why This Package Exists

One place that turns Obsidian-flavored markdown into mdast. Mostly npm plugins; custom code only where no library covers the syntax.

## Responsibility

- Export `createPreset({vaultFiles, path})`: imports + plugin array, nothing else
- Wikilinks, callouts, transclusions, embedded images

## Obsidian Support

- [x] Frontmatter: for per-note settings
  - [x] `as`: `page` | `home` | `pdf` (no default, can be array)
- [x] Obsidian-flavoured markdown:
  - [x] Links, Callouts, Transclusions
  - [x] Images: proper image files (+ numeric alias = width)

## File Structure

- `src/index.ts`: imports, `VaultFiles`, `PresetOptions`, `createPreset` — the plugin array
- `src/plugin/`: custom code — `callout.ts`, `wikilink.ts` (handler), `transclusion.ts` (in-memory `vaultFiles` resolver) — plus thin re-export wrappers per plugin
- `src/tests/`

## Public API

- `src/index.ts` is the single source of truth for exports: `createPreset`, `VaultFiles`, `PresetOptions`

## Contracts

- Every `createPreset` plugin-array item is imported from `src/plugin/` — vendor plugins via thin re-export wrappers; `gray-matter` (helper, not a plugin item) stays direct
- `Wikilink` type imported from `@quartz-community/remark-obsidian` — never redefined
- `resolveTranscludes` re-parses embeds with `this.parse` (same processor config, no second setup)
- Transclusion needs explicit `vaultFiles` + optional `path` (cycle root seed); no `node:fs`, no fallback

## Tests

- None. Covered indirectly via processor-html/processor-pdf tests, plus the integration suite.

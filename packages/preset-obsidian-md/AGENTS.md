# Preset — Obsidian Markdown (unified plugin array)

## Why This Package Exists

One place that turns Obsidian-flavored markdown into mdast. Mostly npm plugins; custom code only where no library covers the syntax.

## Responsibility

- Export `createPreset({vaultFiles, path})`: imports + plugin array, nothing else
- Frontmatter (`parseFrontmatter`, `hasAs`), callouts, transclusions, wikilinks, embedded images

## Obsidian Support

- [x] Frontmatter: for per-note settings
  - [x] `as`: `page` | `home` | `pdf` (no default, can be array)
- [x] Obsidian-flavoured markdown:
  - [x] Links, Callouts, Transclusions
  - [x] Images: proper image files (+ numeric alias = width)

## File Structure

- `src/index.ts`: imports, `VaultFiles`, `parseFrontmatter`, `hasAs`, `createPreset` — the plugin array
- `src/plugin/`: only custom code — `callout.ts`, `wikilink.ts` (handler), `resolveTranscludes.ts` (in-memory `vaultFiles` resolver)
- `src/tests/`

## Public API

- `src/index.ts` is the single source of truth for exports: `createPreset`, `parseFrontmatter`, `hasAs`, `VaultFiles`, `PresetOptions`

## Contracts

- Only `gray-matter` user in the repo (declared here, nowhere else)
- `Wikilink` type imported from `@quartz-community/remark-obsidian` — never redefined
- `resolveTranscludes` re-parses embeds with `this.parse` (same processor config, no second setup)
- Transclusion needs explicit `vaultFiles` + optional `path` (cycle root seed); no `node:fs`, no fallback

## Tests

- One `*.test.ts` per subject; input → assert output
- `pipeline.test.ts`: end-to-end render through `createPreset`
- Deterministic; no external I/O

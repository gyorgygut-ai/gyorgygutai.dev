# Processor — Markdown → HTML

## Why This Package Exists

All vault-to-HTML transformation logic lives here. It has zero Cloudflare dependencies and can be tested/debugged in plain Node.

## Responsibility

- Convert Obsidian-flavored markdown to HTML
- Handle frontmatter, callouts, transclusions, wikilinks, embedded images
- Read and inline CSS snippets in deterministic order
- Provide pure function: `processObsidianMdToHtml`

## Obsidian Support

- [x] Frontmatter: for per-note settings
  - [x] `as`: `page` | `home` | `pdf` (no default, can be array)
- [x] Obsidian-flavoured markdown:
  - [x] Links, Callouts, Transclusions
  - [x] Images: proper image files
- [x] CSS Snippets: inlined into HTML (appearance.json order, alphabetical fallback)

## File Structure

- `src/processObsidianMdToHtml.ts`: input md, output html
- `src/plugin/`: one file per processing step (Plugin, not Processor)
- `src/parser/`, `src/glue/`

## Public API

- `src/index.ts` is the single source of truth for exports

## Contracts

- `src/parser/parseFrontmatter.ts`: only `gray-matter` allowed
- `src/parser/hasAs.ts`: SSOT for frontmatter `as` parsing
- `src/glue/readCssSnippets.ts`: `orderCssFiles` + `cleanCss` is single source (`appearance.json` authoritative, alphabetical fallback)
- `src/plugin/transclude.ts`: pure `vaultFiles` param via `processor.data("vaultFiles")`; no global state, no fallback

## Tests

- One `*.test.ts` per subject; input → assert output
- Fixtures in `src/tests/fixtures/**`
- Deterministic; no external I/O

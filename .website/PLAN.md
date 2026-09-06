# Implementation Status — Obsidian Vault to HTML/PDF

## Current Architecture (matches AGENTS.md)

```
processor/
├── processObsidianMdToHtml.ts   # md → html (css?:string, vaultFiles?:Record)
├── processObsidianMdToPdf.ts    # md → pdf (via html → stripHtml → pdf-lib)
├── processVaultToStatic.ts      # vault dir → {html,pdf} (hasAs page/home/pdf)
├── plugin/                      # one file per unified step
│   ├── markdown.ts, obsidian.ts, transclude.ts, callout.ts, wikilink.ts, raw.ts, obsidianHtml.ts, stringify.ts
├── parser/                      # pure: parseFrontmatter, hasAs, stripHtml, generatePdf
└── glue/readCssSnippets.ts      # appearance.json order, alphabetical fallback
worker/
├── index.ts                     # thin wrapper, buildCache once, immutable, vaultFiles injected
├── bundleVaultIntoWorker.ts     # collects md + css (+ appearance order) → generated/bundle.ts
├── generated/bundle.ts          # auto-generated
└── wrangler.jsonc               # nodejs_compat, no assets SPA
```

## Done
- [x] Frontmatter `as: page|home|pdf` (string or array) via `hasAs`
- [x] Obsidian: links, callouts, transclusions (nested/diamond/cycle/missing), images
- [x] CSS snippets inlined via `<style>` with appearance.json ordering
- [x] Worker builds once, serves cached immutable, no R2
- [x] Transclude supports in-memory vaultFiles for Worker + FS fallback for local
- [x] Tests: 4 files, 20 tests, deterministic fixtures
- [x] Lint + coverage config fixed

## Verify locally
```
npm run lint
npm test                 # 20 pass
npm run bundleVaultIntoWorker
npm run dev              # wrangler dev
npm run deploy           # wrangler deploy
```

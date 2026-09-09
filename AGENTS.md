# Obsidian Vault to Static Website — Monorepo

## Structure

- `packages/obsidian-vault/` — Obsidian vault (content + `.obsidian`)
- `packages/processor-md-to-html/` — Pure markdown → HTML pipeline
- `packages/processor-md-to-pdf/` — Pure HTML → PDF pipeline
- `packages/worker-website/` — Cloudflare Worker (HTML + assets)
- `packages/worker-pdf/` — Cloudflare Worker (PDF only)

## How to Work with Packages

- `obsidian-vault`: Open in Obsidian or VS Code. No code, no build step.
  Edit markdown, assets, or `.obsidian/snippets/*.css`.
- `processor-md-to-html`: Pure Node package. Build with `npm run build --workspace=packages/processor-md-to-html`.
  Test with `npm test --workspace=packages/processor-md-to-html`.
  Import `processObsidianMdToHtml` to convert Obsidian markdown to HTML.
- `processor-md-to-pdf`: Depends on `processor-md-to-html`. Build with `npm run build --workspace=packages/processor-md-to-pdf`.
  Test with `npm test --workspace=packages/processor-md-to-pdf`.
  Import `processObsidianMdToPdf` to convert HTML to PDF.
- `worker-website`: Integration layer. Depends on both processors and the vault.
  Run `npm run dev --workspace=packages/worker-website` to bundle vault and start wrangler dev.
  Run `npm run deploy --workspace=packages/worker-website` to deploy to Cloudflare.
  Do NOT import vault paths directly from other packages — only `worker-website` and `worker-pdf` read `../../obsidian-vault`.
- `worker-pdf`: PDF generation layer. Depends on both processors and the vault.
  Run `npm run dev --workspace=packages/worker-pdf` to bundle vault and start wrangler dev.
  Run `npm run deploy --workspace=packages/worker-pdf` to deploy to Cloudflare.
  Serves only `*.pdf` routes. Independent from `worker-website`.

## Commands

- `npm test` — build both processors, then run all workspace tests
- `npm run dev` — build both processors, bundle vault, run wrangler dev (website)
- `npm run dev:pdf` — bundle vault, run wrangler dev (pdf)
- `npm run deploy` — build both processors, bundle vault, deploy both workers

## Cross-Package Contracts

- `processor-md-to-html/src/glue/readCssSnippets.ts:orderCssFiles` + `cleanCss` is single source (`appearance.json` authoritative, alphabetical fallback); `worker-website/src/bundleVaultIntoWorker.ts` and `worker-pdf/src/bundleVaultIntoWorker.ts` import it — no duplicate sort/clean
- `processor-md-to-html/src/parser/parseFrontmatter.ts` (only `gray-matter`) and `processor-md-to-html/src/parser/hasAs.ts` are SSOT for frontmatter
- `worker-website/src/index.ts:slugFor` is SSOT for URL slug transformation (`/index`→`/`, pdf `/index.pdf`)
- `worker-website/src/generated/bundle.ts` and `worker-pdf/src/generated/bundle.ts` are gitignored, produced only by `bundleVaultIntoWorker`

## Testing Conventions

- One `*.test.ts` per subject; input → assert output
- Fixtures deterministic; no shared `tests/`
- Vault-agnostic: tests never read `../../obsidian-vault`; only `processor-md-to-html/src/tests/fixtures/**` + `worker-website/src/generated/bundle.ts` and `worker-pdf/src/generated/bundle.ts` stubs
- Worker tests derive routes from bundle invariants — passes on stub and real bundle

# Obsidian Vault to Static Website — Monorepo

## Structure

- `packages/vault/` — Obsidian vault (content + `.obsidian`)
- `packages/processor/` — Pure TS: markdown → HTML/PDF
- `packages/worker/` — Cloudflare Worker thin wrapper

## Commands

- `npm test` — build processor, then run all workspace tests
- `npm run dev` — build processor, bundle vault, run wrangler dev
- `npm run deploy` — build processor, bundle vault, deploy

## Cross-Package Contracts

- `processor` is the only package that knows how to read/write vault files; `worker` depends on it via workspace link
- `processor/src/glue/readCssSnippets.ts` is single source for CSS ordering/cleaning; `worker/src/bundleVaultIntoWorker.ts` imports it
- `processor/src/parser/parseFrontmatter.ts` and `processor/src/parser/hasAs.ts` are SSOT for frontmatter
- `worker/src/index.ts:slugFor` is SSOT for URL slug transformation (`/index`→`/`, pdf `/index.pdf`)
- `worker/src/generated/bundle.ts` is gitignored, produced only by `bundleVaultIntoWorker`

## Testing Conventions

- One `*.test.ts` per subject; input → assert output
- Fixtures deterministic; no shared `tests/`
- Vault-agnostic: tests never read `../../../vault`; only `processor/src/tests/fixtures/**` + `worker/src/generated/bundle.ts` stub
- Worker tests derive routes from bundle invariants — passes on stub and real bundle

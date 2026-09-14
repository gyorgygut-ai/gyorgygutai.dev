# Worker — PDF Cloudflare Worker

## Why This Package Exists

It generates PDFs from vault content. It is the PDF generation layer — independent from the website Worker.

## Responsibility

- Cloudflare Worker generates and serves PDFs
- Worker is a wrapper; one function per file; using default export
- No R2; worker has source files; builds once, serves cached, immutable
- Handles PDF routes only: `*.pdf`

## File Structure

- `src/index.ts`: builds once, serves cached immutable PDFs
- `src/bundleVaultIntoWorker.ts`: reads vault from `../../obsidian-vault`, writes `src/generated/bundle.ts`
- `src/generated/bundle.ts`: auto-generated, gitignored
- `src/wrangler.jsonc`

## Contracts

- `src/generated/**`: gitignored, eslint/coverage ignored; stub exports `cssBundle`/`vaultFiles`/`appearanceOrder`; real `../../obsidian-vault` read only in `bundleVaultIntoWorker.ts`, run only via `bundleVaultIntoWorker`/`dev`/`deploy` — never `npm test`
- `src/wrangler.jsonc`: `name`, `main`, `compatibility_date`, `compatibility_flags` (`nodejs_compat`), `observability`, `routes` for `*.pdf` only; no `assets`/`r2`

## Commands

- `npm run bundleVaultIntoWorker` — regenerate bundle from vault (`../../obsidian-vault` → `src/generated/bundle.ts`, gitignored)
- `npm run dev` — `bundleVaultIntoWorker` + `wrangler dev --config src/wrangler.jsonc` — serve worker locally at `http://localhost:8787`
- `npm run deploy` — `bundleVaultIntoWorker` + `wrangler deploy --config src/wrangler.jsonc` — deploy to Cloudflare prod (immutable, cached)

## Tests

- `src/tests/pdf.test.ts` derives expected PDF routes from `vaultFiles` via `slugFor`/`hasAs` invariants
- Passes on stub and real bundle

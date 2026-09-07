# Worker — Cloudflare Worker Thin Wrapper

## Why This Package Exists

It packages the processor into a deployable Cloudflare Worker that builds once and serves cached, immutable assets. It is a thin wrapper — no business logic beyond routing and caching.

## Responsibility

- Cloudflare Worker generates and serves assets
- Worker is a wrapper; one function per file; using default export
- No R2; worker has source files; builds once, serves cached, immutable

## File Structure

- `src/index.ts`: builds once, serves cached immutable
- `src/bundleVaultIntoWorker.ts`: reads vault from `../../../vault`, writes `src/generated/bundle.ts`
- `src/generated/bundle.ts`: auto-generated, gitignored
- `src/wrangler.jsonc`

## Contracts

- `src/generated/**`: gitignored, eslint/coverage ignored; stub exports `cssBundle`/`vaultFiles`/`appearanceOrder`; real `../../../vault` read only in `bundleVaultIntoWorker.ts`, run only via `bundleVaultIntoWorker`/`dev`/`deploy` — never `npm test`
- `src/wrangler.jsonc`: `main`, `compatibility_date`, `nodejs_compat` only; no `assets`/`r2`
- `slugFor` in this file: `/index`→`/`, pdf `/index.pdf` (SSOT)

## Commands

- `npm run bundleVaultIntoWorker` — regenerate bundle from vault (`../../../vault` → `src/generated/bundle.ts`, gitignored)
- `npm run dev` — `bundleVaultIntoWorker` + `wrangler dev --config src/wrangler.jsonc` — serve worker locally at `http://localhost:8787`
- `npm run deploy` — `bundleVaultIntoWorker` + `wrangler deploy --config src/wrangler.jsonc` — deploy to Cloudflare prod (immutable, cached)

## Tests

- `src/tests/worker.test.ts` derives expected routes from `vaultFiles` via `slugFor`/`hasAs` invariants
- Passes on stub and real bundle

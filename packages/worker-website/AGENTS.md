# Worker — Website Cloudflare Worker

## Why This Package Exists

It composes the processors into a deployable Cloudflare Worker that builds once and serves cached, immutable assets. It is the integration layer — no business logic beyond routing and caching.

## Responsibility

- Cloudflare Worker generates and serves assets
- Worker is a wrapper; one function per file; using default export
- No R2; worker has source files; builds once, serves cached, immutable
- Orchestrates HTML + assets generation from inputs

## File Structure

- `src/index.ts`: builds once, serves cached immutable
- `src/bundleVaultIntoWorker.ts`: reads inputs from `../../inputs`, writes `src/generated/bundle.ts`
- `src/watchVault.ts`: dev-only inputs watcher → re-runs `bundleVaultIntoWorker` (reads no file contents)
- `src/processVaultToStatic.ts`: orchestrates HTML + assets generation
- `src/generated/bundle.ts`: auto-generated, gitignored
- `src/wrangler.jsonc`

## Contracts

- `src/generated/**`: gitignored, eslint/coverage ignored; stub exports `cssBundle`/`vaultFiles`/`assetFiles`/`customCss`/`customJs`/`appearanceOrder`; real `../../inputs` content read only in `bundleVaultIntoWorker.ts` (via `collect-vault`); `watchVault.ts` is dev-only fs-watch, never `npm test`
- `src/wrangler.jsonc`: `name`, `main`, `compatibility_date`, `compatibility_flags` (`nodejs_compat`), `observability` only; no `assets`/`r2`

## Commands

- `npm run bundleVaultIntoWorker` — regenerate bundle from inputs (`../../inputs` → `src/generated/bundle.ts`, gitignored)
- `npm run dev` — `bundleVaultIntoWorker` + `watchVault.ts` watcher + `wrangler dev --config src/wrangler.jsonc --port 8787` — serve worker locally at `http://localhost:8787`
- `npm run deploy` — `bundleVaultIntoWorker` + `wrangler deploy --config src/wrangler.jsonc` — deploy to Cloudflare prod (immutable, cached)

## Tests

- `src/tests/worker.test.ts` builds `vaultFiles` from fixtures and asserts known routes; independent of `generated/bundle`
- Passes on stub and real bundle

# Obsidian Vault to Static Website — Monorepo

## Structure

- `packages/obsidian-vault/` — Obsidian vault (content + `.obsidian`)
- `packages/preset-obsidian-md/` — unified preset: Obsidian markdown → mdast (npm plugins + 3 custom files)
- `packages/preset-website-shell/` — unified preset: mdast → HTML document shell
- `packages/processor-html/` — thin wrapper: preset + shell → HTML string
- `packages/processor-pdf/` — thin wrapper: preset → plain text → PDF bytes
- `packages/collect-vault/` — build-time vault reader: md/assets/css → generated bundle
- `packages/worker-website/` — Cloudflare Worker (HTML + assets)
- `packages/worker-pdf/` — Cloudflare Worker (PDF only)

## How to Work with Packages

- `obsidian-vault`: Open in Obsidian or VS Code. No code, no build step.
  Edit markdown, assets, or `.obsidian/snippets/*.css`.
- `preset-obsidian-md`: `src/index.ts` is imports + plugin array + tiny helpers (`VaultFiles`, `parseFrontmatter`, `hasAs`, `createPreset`). Custom code lives only in `src/plugin/` (`callout`, `wikilink`, `resolveTranscludes`).
  Test with `npx vitest run` in the package.
- `processor-html` / `processor-pdf`: thin `process()` wrappers over `createPreset`. No duplicated parsing.
- `collect-vault`: `collectVault(vaultRoot, includeAssets)` + `writeBundle`. Used only by the workers' `bundleVaultIntoWorker` scripts (run via `tsx`, never bundled to edge, never imported by tests).
- `worker-website`: Integration layer. Depends on both processors and the vault.
  Run `npm run dev --workspace=packages/worker-website` to bundle vault and start wrangler dev.
  Run `npm run deploy --workspace=packages/worker-website` to deploy to Cloudflare.
  Only `collect-vault` reads `../../obsidian-vault` — no other package touches the vault directly.
- `worker-pdf`: PDF generation layer. Same commands with `--workspace=packages/worker-pdf`.
  Serves only `*.pdf` routes, bundles no `assetFiles`. Independent from `worker-website`.

## Commands

- `npm test` — build presets/processors, then run all workspace tests
- `npm run test:integration` — live website + pdf workers against the real vault
- `npm run dev` — build, bundle vault, run wrangler dev (website)
- `npm run dev:pdf` — bundle vault, run wrangler dev (pdf)
- `npm run deploy` — deploy both workers
- `npm run lint --workspaces --if-present` — `curly: all` + multiline if bodies only

## Cross-Package Contracts

- `preset-obsidian-md/src/index.ts` is SSOT for `VaultFiles`, `parseFrontmatter` (only `gray-matter` user), `hasAs`, `createPreset({vaultFiles, path})`
- `Wikilink` node type comes from `@quartz-community/remark-obsidian` — no local redefinition
- `collect-vault/src/index.ts:collectVault` is the only vault reader (`appearance.json` authoritative, alphabetical fallback); both workers' `bundleVaultIntoWorker.ts` are ~10-line callers
- `worker-website/src/index.ts:slugFor` is SSOT for URL slug transformation (`/index`→`/`, pdf `/index.pdf`)
- `worker-website/src/generated/bundle.ts` and `worker-pdf/src/generated/bundle.ts` are gitignored, produced only by `bundleVaultIntoWorker` (website bundle has `assetFiles`, pdf bundle does not)

## Testing Conventions

- One `*.test.ts` per subject; input → assert output
- Fixtures deterministic; no shared `tests/`
- Vault-agnostic: tests never read `../../obsidian-vault`
- Worker tests derive routes from bundle invariants — passes on stub and real bundle

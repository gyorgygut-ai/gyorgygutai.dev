# Obsidian Vault to Static Website — Monorepo

## Structure

- `inputs/obsidian-vault/` — Obsidian vault (content + `.obsidian`)
- `inputs/website-shell/` — website shell config: global.css, app.js
- `packages/preset-obsidian-md/` — unified preset: Obsidian markdown → mdast (npm plugins + 3 custom files)
- `packages/preset-website-shell/` — unified preset: mdast → HTML document shell
- `packages/processor-html/` — thin wrapper: preset + shell → HTML string
- `packages/processor-pdf/` — thin wrapper: preset → plain text → PDF bytes
- `packages/collect-vault/` — build-time reader: inputs → generated bundle
- `packages/worker-website/` — Cloudflare Worker (HTML + assets)
- `packages/worker-pdf/` — Cloudflare Worker (PDF only)

## How to Work with Packages

- `inputs/obsidian-vault/`: Open in Obsidian or VS Code. No code, no build step.
  Edit markdown, assets, or `.obsidian/snippets/*.css`.
- `inputs/website-shell/`: Website config files (global.css, app.js). Bundled at build time by worker.
- `preset-obsidian-md`: `src/index.ts` is imports + plugin array + tiny helpers (`VaultFiles`, `parseFrontmatter`, `hasAs`, `createPreset`). Custom code lives only in `src/plugin/` (`callout`, `wikilink`, `transclusion`).
- `processor-html` / `processor-pdf`: thin `process()` wrappers over `createPreset`. No duplicated parsing.
- `collect-vault`: `collectVault(vaultRoot, shellDir, includeAssets)` + `writeBundle`. Used only by the workers' `bundleVaultIntoWorker` scripts (run via `tsx`, never bundled to edge, never imported by tests).
- `worker-website`: Integration layer. Depends on processor-html.
  Run `npm run dev --workspace=packages/worker-website` to bundle inputs and start wrangler dev.
  Run `npm run deploy --workspace=packages/worker-website` to deploy to Cloudflare.
  Only `collect-vault` reads `../../inputs` — no other package touches the inputs directly.
- `worker-pdf`: PDF generation layer. Same commands with `--workspace=packages/worker-pdf`.
  Serves only `*.pdf` routes, bundles no `assetFiles`. Independent from `worker-website`.

## Commands

- `npm test` — build presets/processors, then run all workspace tests
- `npm run test:integration` — live website + pdf workers against the real inputs
- `npm run dev` — build, bundle both inputs, run both workers (website :8787 + pdf :8788)
- `npm run dev:website` / `npm run dev:pdf` — single worker (run `npm run build` first)
- `npm run deploy` — deploy both workers
- `npm run bundleVaultIntoWorker` — both workers; `:website` / `:pdf` variants for one
- `npm run lint --workspaces --if-present` — `curly: all` + multiline if bodies only

## Cross-Package Contracts

- `preset-obsidian-md/src/index.ts` is SSOT for `VaultFiles`, `parseFrontmatter`, `hasAs`, `createPreset({vaultFiles, path})`
- `Wikilink` node type comes from `@quartz-community/remark-obsidian` — no local redefinition
- `collect-vault/src/index.ts:collectVault` is the only inputs reader (`appearance.json` authoritative, alphabetical fallback); both workers' `bundleVaultIntoWorker.ts` are ~10-line callers (dev-only `watchVault.ts` watchers excluded — they read no file contents)
- `worker-website/src/generated/bundle.ts` and `worker-pdf/src/generated/bundle.ts` are gitignored, produced only by `bundleVaultIntoWorker` (website bundle has `assetFiles`, pdf bundle does not)

## Testing Conventions

- Processors/workers: one `*.test.ts` per subject; input → assert output
- Presets without a dedicated suite are covered via processor tests + integration
- Inputs-agnostic: tests never read `../../inputs`
- Three-const pattern: `const input` → `const expected` → `const output = fn(input)` → exactly one `expect(output)` at end. No `as any`.

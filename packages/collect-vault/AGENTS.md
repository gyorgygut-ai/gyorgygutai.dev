# Collect — Build-Time Inputs Reader

## Why This Package Exists

The only code allowed to touch `../../inputs` with `node:fs`. Both workers' `bundleVaultIntoWorker.ts` scripts are ~10-line callers of this package. Never imported by edge runtime code or tests.

## Responsibility

- `collectVault(vaultRoot, shellDir, includeAssets)`: md files, optional base64 assets, `cssBundle` (vault snippets, `appearance.json` authoritative), `customCss` + `customJs` (from shellDir), `appearanceOrder`
- `writeBundle(outFile, data, includeAssets)`: writes `src/generated/bundle.ts` (gitignored)
- `parseArgs(defaultVaultRoot, defaultOutFile)`: `--vault` / `--out` CLI overrides

## Contracts

- Website bundles with `includeAssets: true` (serves `assetFiles` routes); pdf bundles with `false` (no `assetFiles` export at all)
- `shellDir` is optional — pass empty string or skip to omit custom CSS/JS
- Run only via `tsx` (`bundleVaultIntoWorker` / `dev` / `deploy` scripts) — never `npm test`, never bundled to edge

## Tests

- None. Verified by byte-identical output vs the scripts it replaced, plus the integration suite.

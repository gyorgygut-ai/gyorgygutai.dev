# Collect — Build-Time Vault Reader

## Why This Package Exists

The only code allowed to touch `../../obsidian-vault` with `node:fs`. Both workers' `bundleVaultIntoWorker.ts` scripts are ~10-line callers of this package. Never imported by edge runtime code or tests.

## Responsibility

- `collectVault(vaultRoot, includeAssets)`: md files, optional base64 assets, `cssBundle` (`appearance.json` authoritative, alphabetical fallback), `appearanceOrder`
- `writeBundle(outFile, data, includeAssets)`: writes `src/generated/bundle.ts` (gitignored)
- `parseArgs(defaultVaultRoot, defaultOutFile)`: `--vault` / `--out` CLI overrides

## Contracts

- Website bundles with `includeAssets: true` (serves `assetFiles` routes); pdf bundles with `false` (no `assetFiles` export at all)
- Run only via `tsx` (`bundleVaultIntoWorker` / `dev` / `deploy` scripts) — never `npm test`, never bundled to edge

## Tests

- None. Verified by byte-identical output vs the scripts it replaced, plus the integration suite.

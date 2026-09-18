# Plan: Refactor Inputs

## Objective
- Refactor monorepo input structure by moving vault and shell config out of `packages/` into `inputs/`, and implement proper custom CSS/JS injection in the document shell using HAST tree transforms instead of string replacement.

## Important Details
- `packages/obsidian-vault/` moved to `inputs/obsidian-vault/`; new `inputs/website-shell/` added for `global.css` and `app.js`.
- `collect-vault` extended to read `shellDir`, output `customCss`/`customJs` in `generated/bundle.ts`.
- `preset-website-shell` changed from static preset to `createShell({ customCss, customJs, meta })` factory.
- `processor-html` updated to pass `customCss`/`customJs` via `file.data`, removed `</head>` string replace.
- Workers updated to use new `inputs/` paths and pass `customCss`/`customJs` through the pipeline.
- Tests updated to match new interface (`customCss` in processor test, empty arrays in worker tests).
- PDF worker intentionally untouched (no custom CSS/JS needed).
- **CLI paths:** `parseArgs()` has no defaults. All paths come from required CLI args: `--vault`, `--shell`, `--out`.

## Work State
### Completed
- Moved vault to `inputs/obsidian-vault/`
- Created `inputs/website-shell/` structure
- Wrote/updated `README.md`, root `AGENTS.md`, and all package `AGENTS.md` files
- Final implementation plan documented (items covering filesystem, collect-vault, shell, processor, workers, and tests)

### Active
- Executing the code implementation plan

### Blocked
- (none)

## Next Move
1. Execute plan: move directories, update `collect-vault` for `shellDir` + `customCss`/`customJs` output, refactor `preset-website-shell` to factory with HAST injection, update `processor-html` to use `file.data` and remove string replace
2. Update worker bundle scripts and runtime interfaces to pass `customCss`/`customJs`, then update test fixtures and assertions to match new `customCss` field name

## Relevant Files
- `inputs/obsidian-vault/`: Obsidian markdown content and `.obsidian` config
- `inputs/website-shell/`: custom `global.css` and `app.js` shell config
- `packages/collect-vault/src/index.ts`: needs `shellDir` param, `customCss`/`customJs` bundle exports
- `packages/preset-website-shell/src/index.ts`: needs `createShell()` factory export
- `packages/preset-website-shell/src/rehypeMetaExtra.ts`: needs `<style>`/`<script>` HAST injection logic
- `packages/processor-html/src/process.ts`: needs `file.data` passing, interface update, remove string replace
- `packages/worker-website/src/bundleVaultIntoWorker.ts`: update paths and `collectVault` args
- `packages/worker-pdf/src/bundleVaultIntoWorker.ts`: update paths
- `packages/worker-website/src/processVaultToStatic.ts`: add `customCss`/`customJs` to `StaticBundle`
- `packages/worker-website/src/index.ts`: import and pass `customCss`/`customJs`
- `packages/processor-html/src/tests/process.test.ts`: add `customCss` and `customJs` fields to test input
- `packages/worker-website/src/tests/worker.test.ts`: add `customCss: []`/`customJs: []` arrays to test inputs

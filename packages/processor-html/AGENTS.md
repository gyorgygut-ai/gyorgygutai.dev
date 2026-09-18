# Processor — HTML Generation

## Why This Package Exists

Composes preset-obsidian-md + preset-website-shell into an HTML string. Pure function: markdown + config → HTML.

## Responsibility

- `process(input)`: markdown → HTML via unified pipeline
- Passes `customCss`/`customJs` to shell via `createShell({ customCss, customJs })` config
- `ProcessWebsiteInput` includes `markdown`, `meta`, `vaultFiles`, `path`, `customCss`, `customJs`

## Contracts

- Depends on `@gyorgygutai/preset-obsidian-md` for parsing + `@gyorgygutai/preset-website-shell` for document shell
- No filesystem access — all input via arguments
- Shell injects `<style>` and `<script>` into `<head>` via HAST tree transform (no string replace)

## Tests

- One `*.test.ts` per subject; input → assert output
- Fixtures in `src/tests/fixtures/**`

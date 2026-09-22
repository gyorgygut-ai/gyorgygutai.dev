# Shell — MDAST → HTML Document

## Why This Package Exists

Produces a complete HTML document shell from mdast. Plugs into `rehype-document` and adds `customCss`/`customJs`/layout injection.

## Responsibility

- `createShell({ customCss, customJs, meta })`: returns `PluggableList`
- Injects `<style>` elements for each CSS string into `<head>`
- Injects `<script>` elements for each JS string into `<head>`
- Wraps body content in `<main class="content">`
- Adds `color-scheme` and description meta tags

## Contracts

- Pure transform: receives config as arguments, produces HAST nodes
- Reusable: never reads files, never touches filesystem
- Export is `createShell(config)` — not a static preset (needs config closure)

## Tests

- One `*.test.ts` per subject; input config → assert output HTML

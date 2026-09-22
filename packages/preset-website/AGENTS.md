# Shell — MDAST → HTML Document

## Why This Package Exists

Produces a complete HTML document shell from mdast. Plugs into `rehype-document` and adds `customCss`/`customJs`/layout injection.

## Responsibility

- `createShell({ customCss, customJs, meta })`: returns `PluggableList`
- Injects `<style>` elements for built-in CSS (obsidian-vars.css, obsidian.css) and user CSS into `<head>`
- Injects `<script>` elements for each JS string into `<head>`
- Wraps body content in `<main class="content">`
- Adds `color-scheme` and description meta tags

## Source Files

- `obsidian-vars.css` — Official Obsidian CSS variable defaults (:root, .theme-light, .theme-dark, .mod-macos)
- `obsidian.css` — Website selectors consuming var() (body, headings, links, blockquote, code, tables, callouts, tags, scrollbars, print, responsive)
- `injectStyles.ts` — HAST plugin: takes string[], creates <style> nodes in order

## Injection Order (correct variable precedence)

1. obsidian-vars.css — official Obsidian defaults (--h1-size: 1.618em)
2. obsidian.css — website selectors (font-size: var(--h1-size, 2.25em))
3. customCss — user snippets/themes (cv-theme.css --h1-size: 40px) ← USER WINS
4. customJs — scripts

## Contracts

- Pure transform: receives config as arguments, produces HAST nodes
- Reusable: never reads files at runtime (CSS is read once at module load)
- Export is `createShell(config)` — not a static preset (needs config closure)

## Tests

- One `*.test.ts` per subject; input config → assert output HTML
- Tests read built-in CSS from source files (not fixtures)

# Phase 1: Rename `preset-website-shell` → `preset-website`

**Status: DONE** (committed & pushed)

---

# Phase 2: Trim `global.css`

**Status: DONE** (committed & pushed — 857 → 566 lines, removed 291 lines of Obsidian-desktop-only selectors)

Removed:
- `a.external-link::after` (desktop icon, not in HTML output)
- All `ul[data-task="*"]` rules (remark plugin produces `<input type="checkbox">`, not `data-task` attributes)
- Duplicate `hr` rule (exact duplicate of earlier `hr` at line 165)
- `p > img + em` (rehype produces `<figure><figcaption>`, not `<p><em>`)
- `.markdown-embed*`, `.markdown-embed-link*` (Digital Garden plugin classes)
- `.search-result*` (desktop search UI)
- `.table-view-table`, `.dv-table-header` (Dataview plugin classes)
- `.mermaid*` (remark-obsidian renders `<svg>` directly)

Kept `.internal-embed` as standalone selector (produced by `resolveTranscludes`).

---

# Phase 3: Split CSS with correct variable precedence

**Status: DONE** (all 31 tests pass)

- `preset-website/src/obsidian-vars.css` — official Obsidian CSS variable defaults (1228 lines)
- `preset-website/src/obsidian.css` — website selectors (539 lines)
- `preset-website/src/injectStyles.ts` — HAST plugin for `<style>` injection
- `preset-website/src/index.ts` — reads both CSS at module load, injects in correct order
- `preset-website/src/tests/shell.test.ts` — rewritten with `buildExpected()`, reads CSS from source
- 4x `expected.html` deleted from preset-website test fixtures
- `inputs/website-shell/global.css` deleted (moved to obsidian.css)
- CSS path resolution: `dirname` relative to each module's location (works from both `src/` and `dist/`)
- All fixture expected.html files regenerated (worker-website, processor-html) to include built-in CSS

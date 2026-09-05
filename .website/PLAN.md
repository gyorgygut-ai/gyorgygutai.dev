# Worker Plan — Obsidian Vault to HTML/PDF

## TODO

- [ ] 1. Init `worker/` (package.json, tsconfig.json, vitest.config.ts)
- [ ] 2. Create fixtures (7 markdown + 2 CSS snippets)
- [ ] 3. Write tests (4 test files, 29 tests total)
- [ ] 4. Implement `src/html.ts`
- [ ] 5. Implement `src/pdf.ts`
- [ ] 6. Create `src/index.ts` and `src/build.ts` with TODO comments
- [ ] 7. Run `npx vitest run` — all 29 tests pass

## Architecture

Business logic extracted. Worker is a thin wrapper.

```
src/
├── html.ts          ← reusable: htmlFromObsidianMd, htmlsFromObsidianVault
├── pdf.ts           ← reusable: pdfFromObsidianMd, pdfsFromObsidianVault
├── index.ts         ← TODO: Worker wrapper (thin, calls html.ts/pdf.ts)
└── build.ts         ← TODO: Build script wrapper (thin, calls html.ts/pdf.ts)
```

## Step 1: Init `worker/`

Create `package.json`, `tsconfig.json`, `vitest.config.ts`.

Dependencies:
- vitest, typescript, tsx
- unified, remark-parse, remark-rehype, rehype-stringify, rehype-raw
- @quartz-community/remark-obsidian, @quartz-community/rehype-obsidian
- pdf-lib, gray-matter

## Step 2: Fixtures

### Markdown (`tests/fixtures/`)

| File | Content |
|------|---------|
| `publish-true.md` | Frontmatter (`dg-publish: true`, `title`) + transclusion `![[content/header]]` + heading + `<hr>` + bold + inline code + list + link + `---` |
| `publish-callout.md` | Frontmatter (`publish: true`) + `> [!profile-header]` callout with `![[../assets/photo.png\|60]]` |
| `publish-false.md` | Frontmatter (`publish: false`) + heading |
| `no-frontmatter.md` | Just heading + paragraph |
| `empty.md` | Empty |
| `minimal.md` | `publish: true` + one word |
| `large.md` | `publish: true` + many project entries with all content types |

### CSS Snippets (`tests/fixtures/snippets/`)

| File | Content |
|------|---------|
| `cv-theme.css` | Subset of real: `:root` vars, `.theme-dark` |
| `cv-markdown.css` | Subset of real: `.markdown-embed` rules |

## Step 3: Tests

### `tests/htmlFromObsidianMd.test.ts` — 13 tests

| # | Requirement | Setup | Convert | Assert |
|---|------------|-------|---------|--------|
| 1 | Empty input | `""` | `htmlFromObsidianMd("")` | returns string, no throw |
| 2 | Basic markdown → HTML | `"# Hello"` | `htmlFromObsidianMd(md)` | contains `<h1>`, `<p>` |
| 3 | Transclusions rendered | `publish-true.md` (`![[content/header]]`) | `htmlFromObsidianMd(md)` | contains `<blockquote` or transclude class |
| 4 | Callouts rendered | `publish-callout.md` (`> [!profile-header]`) | `htmlFromObsidianMd(md)` | contains `callout` or `data-callout` |
| 5 | Image embed present | `publish-callout.md` (`![[../assets/photo.png\|60]]`) | `htmlFromObsidianMd(md)` | contains `<img` |
| 6 | Bold rendered | `"**bold**"` | `htmlFromObsidianMd(md)` | contains `<strong>` |
| 7 | Links rendered | `"[text](url)"` | `htmlFromObsidianMd(md)` | contains `<a href=\"url\">` |
| 8 | Inline code rendered | `` `"\`code\`" `` | `htmlFromObsidianMd(md)` | contains `<code>` |
| 9 | Lists rendered | `"- item"` | `htmlFromObsidianMd(md)` | contains `<li>` |
| 10 | Horizontal rules | `"---"` | `htmlFromObsidianMd(md)` | contains `<hr` |
| 11 | Raw HTML preserved | `'<hr class="header-separator">'` | `htmlFromObsidianMd(md)` | contains `header-separator` |
| 12 | Frontmatter stripped | `publish-true.md` | `htmlFromObsidianMd(md)` | does not contain `dg-publish` |
| 13 | CSS snippets inlined | `publish-true.md` + snippets dir | `htmlFromObsidianMd(md, { cssDir })` | contains `--background-primary` |

### `tests/htmlsFromObsidianVault.test.ts` — 5 tests

| # | Requirement | Setup | Convert | Assert |
|---|------------|-------|---------|--------|
| 1 | Returns only publish-true notes | 7 fixtures | `htmlsFromObsidianVault(dir)` | keys = `[\"publish-true.md\", \"publish-callout.md\", \"minimal.md\", \"large.md\"]` |
| 2 | publish-false excluded | 7 fixtures | `htmlsFromObsidianVault(dir)` | `publish-false.md` absent |
| 3 | no-frontmatter excluded | 7 fixtures | `htmlsFromObsidianVault(dir)` | `no-frontmatter.md` absent |
| 4 | empty excluded | 7 fixtures | `htmlsFromObsidianVault(dir)` | `empty.md` absent |
| 5 | vault values are HTML | 7 fixtures | `htmlsFromObsidianVault(dir)` | every value contains `<h1>` or `<h2>` or `<p>` |

### `tests/pdfFromObsidianMd.test.ts` — 6 tests

| # | Requirement | Setup | Convert | Assert |
|---|------------|-------|---------|--------|
| 1 | Empty → valid PDF | `""` | `pdfFromObsidianMd(\"")` | `Uint8Array`, starts `%PDF-` |
| 2 | Basic markdown → PDF | `"# Hello"` | `pdfFromObsidianMd(md)` | starts `%PDF-`, length > 0 |
| 3 | Transclusion in PDF | `publish-true.md` | `pdfFromObsidianMd(md)` | starts `%PDF-` |
| 4 | Callout in PDF | `publish-callout.md` | `pdfFromObsidianMd(md)` | starts `%PDF-` |
| 5 | Large → valid PDF | `large.md` | `pdfFromObsidianMd(md)` | starts `%PDF-`, length > small |
| 6 | Different → different PDFs | two fixtures | both | `!a.equals(b)` |

### `tests/pdfsFromObsidianVault.test.ts` — 5 tests

| # | Requirement | Setup | Convert | Assert |
|---|------------|-------|---------|--------|
| 1 | Returns only publish-true notes | 7 fixtures | `pdfsFromObsidianVault(dir)` | keys = `[\"publish-true.md\", \"publish-callout.md\", \"minimal.md\", \"large.md\"]` |
| 2 | publish-false excluded | 7 fixtures | `pdfsFromObsidianVault(dir)` | `publish-false.md` absent |
| 3 | no-frontmatter excluded | 7 fixtures | `pdfsFromObsidianVault(dir)` | `no-frontmatter.md` absent |
| 4 | empty excluded | 7 fixtures | `pdfsFromObsidianVault(dir)` | `empty.md` absent |
| 5 | all values are valid PDFs | 7 fixtures | `pdfsFromObsidianVault(dir)` | every value starts `%PDF-` |

## Step 4: Implement `src/html.ts`

Unified pipeline: `remarkParse` → `remarkObsidian` → `remarkRehype` → `rehypeRaw` → `rehypeObsidian` → `rehypeStringify`. gray-matter for frontmatter. CSS snippets read from disk and inlined into `<style>`.

## Step 5: Implement `src/pdf.ts`

Calls `htmlFromObsidianMd` internally, strips HTML tags, draws text lines with pdf-lib.

## Step 6: TODOs in `src/index.ts` and `src/build.ts`

Empty files with TODO comments describing what they'll do.

## Step 7: `npx vitest run` — all 29 tests pass

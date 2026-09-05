# Obsidian Vault to Static Website (HTML + PDF)

**Core Philosophy**:

> No shortcuts. No "lib" or "helpers"; name things for what they are.
> No nice to haves, no kindergarten level code comments;
> Elegant, clean code to get job done; no less, no more.

**Goals & Responsibilites**:

- Cloudflare Worker generates and serves assets
- Worker merely a wrapper; a function per file; using default export
- No R2; worker has source files; builds once, serves cached, immutable

---

## Architecture (`src/`)

**File Structure**:

- `processObsidianMdToHtml.ts`: input md, output html
- `processObsidianMdToPdf.ts`: input md, output pdf
- `processVaultToStatic.ts`: orchestrating the above
- `processor/`: one file per processing step

**Obsidian Support**:

- [ ] Frontmatter: for per-note ettings
  - [ ] `as`: `page` | `home` | `pdf` (no default)
- [ ] Obsidian-flavoured markdown:
  - [ ] Links, Callouts, Translucions
  - [ ] Images: proper image files
- [ ] CSS Snippets: inlined into HTML

---

## Tests (`tests/`)

- One `*.test.ts`; match subject under test; set input -> assert output
- Deterministic processing output must be proven using fixtures

**Fixtures Example**:

- `fixtures/simple-note/`: `simple-note.md` -> `simple-note.(html|pdf)`
- `fixtures/long-note/`: `long-note.md`, `style.css`, `example.css` -> `long-note.(html|pdf)`

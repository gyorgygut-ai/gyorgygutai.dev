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

## Architecture

**File Structure**:

- `processor/`: vault → static (pure)
  - `processObsidianMdToHtml.ts`: input md, output html
  - `processObsidianMdToPdf.ts`: input md, output pdf
  - `processVaultToStatic.ts`: orchestrating the above
  - `plugin/`: one file per processing step (Plugin, not Processor)
  - `parser/`, `glue/`
- `worker/`: Cloudflare Worker (thin wrapper, `default export`)
  - `index.ts`: builds once, serves cached immutable
  - `generated/vault.ts`: auto-generated (`worker/generateVault.ts`)
  - `wrangler.jsonc`

**Obsidian Support**:

- [ ] Frontmatter: for per-note ettings
  - [ ] `as`: `page` | `home` | `pdf` (no default, can be array)
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

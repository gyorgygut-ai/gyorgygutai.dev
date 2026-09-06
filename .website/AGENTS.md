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
  - `generated/bundle.ts`: auto-generated (`worker/bundleVaultIntoWorker.ts`)
  - `wrangler.jsonc`

**Obsidian Support**:

- [x] Frontmatter: for per-note settings
  - [x] `as`: `page` | `home` | `pdf` (no default, can be array)
- [x] Obsidian-flavoured markdown:
  - [x] Links, Callouts, Transclusions
  - [x] Images: proper image files
- [x] CSS Snippets: inlined into HTML (appearance.json order, alphabetical fallback)

---

## Tests (`processor/tests/`, `worker/tests/`)

- One `*.test.ts` per subject; input -> assert output
- Fixtures deterministic; no shared `tests/`
- Vault-agnostic: tests never read `../..`; only `processor/tests/fixtures/**` + `worker/generated/bundle.ts` stub; derive routes from `vaultFiles` via `slugFor`/`hasAs` invariants — passes on stub and real bundle

**Fixtures Example**:

- `fixtures/simple-note/`: `simple-note.md` -> `simple-note.(html|pdf)`
- `fixtures/long-note/`: `long-note.md`, `style.css`, `example.css` -> `long-note.(html|pdf)`

## Contracts

- CSS: `processor/glue/readCssSnippets.ts:orderCssFiles`+`cleanCss` is single source (`appearance.json` authoritative, alphabetical fallback); `worker/bundleVaultIntoWorker.ts:4` imports it — no duplicate sort/clean
- SSOT: `processor/parser/parseFrontmatter.ts` (only `gray-matter`), `processor/parser/hasAs.ts`, `worker/index.ts:20` `slugFor` (`/index`→`/`, pdf `/index.pdf`) — one def each
- `processor/plugin/transclude.ts`: pure `vaultFiles` param; no global, no `VAULT_ROOT` FS outside `processVaultToStatic.ts`/`bundleVaultIntoWorker.ts`
- `worker/generated/**`: gitignored, eslint/coverage ignored (`vitest.config.ts:32`); stub exports `cssBundle`/`vaultFiles`/`appearanceOrder`; real `../..` read only in `worker/bundleVaultIntoWorker.ts:7`, run only via `bundleVaultIntoWorker`/`dev`/`deploy` — never `npm test`
- `worker/wrangler.jsonc`: `main`, `compatibility_date`, `nodejs_compat` only; no `assets`/`r2`
- `eslint.config.js`: source of truth; `npm run lint` must pass

---

## Run / Deploy

- `npm test` — run processor + worker tests locally (deterministic fixtures; `worker/tests` derive expected routes from `worker/generated/bundle.ts` invariants, works on stub and real bundle)
- `npm run bundleVaultIntoWorker` — regenerate bundle from vault (`../..` → `worker/generated/bundle.ts`, gitignored)
- `npm run dev` — `bundleVaultIntoWorker` + `wrangler dev --config worker/wrangler.jsonc` — serve worker locally at `http://localhost:8787`
- `npm run deploy` — `bundleVaultIntoWorker` + `wrangler deploy --config worker/wrangler.jsonc` — deploy to Cloudflare prod (immutable, cached)

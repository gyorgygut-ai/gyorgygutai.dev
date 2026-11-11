# gyorgygutai.dev

**Value Proposition**: Monorepo of tooling to publish my Obsidian Vault.

---

## NON-NEGOTIABLES

**Correctness**:

- **Goal**: Spec adherence across the codebase without gaps
- **Approach**: Code matched to authoritive specs; NOT specs to code
- **Outcome**: Code fulfilling acceptance criteria as specs dictate

**Structure**:

- **Problem**: I want to convert and serve my vault on the internet
- **Approach**: 
  - `./inputs`: source content; like a Vault of `md` files
  - `./workers`: serve content; Cloudflare, composing packages
  - `./packages`: encapsulate reusable logic; single-responsibility

**Secrets**:

- **Problem**: I want to delegate env vars; while protecting sensitive values
- **Approach**:
  - `dotenvx` encrypted vars in tracked root `.env`
  - Use `packages/contracts` for variable names; use `zod`
  - Read the private key in `.env.local`; use cmd substitution
- **Acceptance**:
  - `.env` tracked, encrypted
  - `.env.local` gitignored
  - End-to-end type safety

---

## SPECS

**MD to HTML**:

- **Problem**: I want to serve notes as a website
- **Approach**:
  - `collector-vault` exports vault files; css, md, assets
  - `as[]`: `page` | `home` used as input
  - `preset-obsidian-md` defines presets
  - No hand-rolling; use existing plugins
  - Any custom plugin must be a package
  - `builder-website` converts
- **Outcome**: `worker-website` serves website
- **Acceptance**:
  - Supports Links, Callouts, Transclusions, Images
  - Bundles CSS snippets + thin Obsidian theme
  - `preset-*` exports only an array of plugins
  - Meta tags, title, slugs, cross-links work

**MD to PDF**:

- **Problem**: I want to serve notes as pdf
- **Approach**:
  - `collector-vault` exports vault files; css, md, assets
  - `as[]`: `pdf` used as input
  - `builder-pdf` converts
- **Outcome**: - `worker-pdf` serves pdfs
- **Acceptance**:
  - Pdfs built at build time
  - Links to pdfs in html work

**Tiny Packages**:

- **Problem**: I want well-tested, maintanable packages
- **Approach**:
  - Each package `src/index.ts` and `src/tests/`
  - If justified, extract logic to `src/*.ts`
  - Each package has `lint`, `build`, `test:unit`
- **Outcome**: Easy to reason about, predictable pipeline

**Thin Workers**:

- **Problem**: I want well-tested, thin Cloudflare workers
- **Approach**:
  - Each worker only orchestrates + serves
  - Each worker has `lint`, `build`, `test:unit`, `serve`, `deploy`
  - Each worker serves separate paths from `dist` on the same root domain
- **Outcome**: Build decoupled from serve; interchangability

---

## VERIFICATION

**Non-negotiable**:

- **Proof**: the verification chain must prove all changes
- **Progress**: tier-by-tier; until all passed or failure
- **Failures**: report; investigate; fix; restart verification
- **Fixtures**: one folder per case; `input`, `expected`
- **Uniform**: `setup(input)`\n`act(input)`\n`assert(expected, output)`
- **Pragmatic**: valuable tests only; verify behaviour; 1 assert per test 

**Gated Tiers**:

- **🧐 Tier 1**: `lint` -> `oxlint` each
- **📦 Tier 2**: `build` -> `build` each
- **🏡 Tier 3**: `test:unit` -> `test:unit` each
- **🏰 Tier 4**: `test:acceptance`
  -> prove `worker-website` acceptance
  -> prove `worker-pdf` acceptance
- **🏰 Tier 5**: `test:e2e`
  -> TBD
- **💪🏾 `verify`**: `t1` && `t2` && `t3` && `t4`

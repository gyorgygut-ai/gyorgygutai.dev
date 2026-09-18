# gyorgygutai.dev

Obsidian vault → static website → Cloudflare Worker.

## Motivation

Every existing tool was overengineered for what I needed: my Obsidian vault as the single source of truth for my website. No CMS. No double entry. No sync. Just write, deploy.

## Packages

- `packages/obsidian-vault/` — Obsidian vault (content + `.obsidian`)
- `packages/preset-obsidian-md/` — unified preset: Obsidian markdown → mdast (npm plugins + 3 custom files)
- `packages/preset-website-shell/` — unified preset: mdast → HTML document shell
- `packages/processor-html/` — thin wrapper: preset + shell → HTML string
- `packages/processor-pdf/` — thin wrapper: preset → plain text → PDF bytes
- `packages/collect-vault/` — build-time vault reader: md/assets/css → generated bundle
- `packages/worker-website/` — Cloudflare Worker (HTML + assets)
- `packages/worker-pdf/` — Cloudflare Worker (PDF only)

## Links

- **[Website]** — https://gyorgygutai.dev/
- **[Chronological CV (PDF)]** — https://gyorgygutai.dev/pdf/chronological.pdf
- **[Project-based CV (PDF)]** — https://gyorgygutai.dev/pdf/project-based.pdf

See `AGENTS.md` for the rest.

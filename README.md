# gyorgygutai.dev

Obsidian vault → static website → Cloudflare Worker.

## Motivation

Every existing tool was overengineered for what I needed: my Obsidian vault as the single source of truth for my website. No CMS. No double entry. No sync. Just write, deploy.

## Packages

- `packages/obsidian-vault/` — Obsidian vault
- `packages/processor-md-to-html/` — markdown → HTML
- `packages/processor-md-to-pdf/` — HTML → PDF
- `packages/worker-website/` — Cloudflare Worker

## Links

- **[Website]** — https://gyorgygutai.dev/
- **[Chronological CV (PDF)]** — https://gyorgygutai.dev/pdf/chronological.pdf
- **[Project-based CV (PDF)]** — https://gyorgygutai.dev/pdf/project-based.pdf

See `AGENTS.md` for the rest.

# gyorgygutai.dev

Publish the Obsidian vault as a website and PDFs.

The vault is the source of truth. No CMS. No duplicate content. Write, build, serve.

## Inputs

- `inputs/vault-gyorgygutai/` — source Obsidian vault; its layout is not prescribed

The collector discovers Markdown notes and attachments recursively. `as: home`, `as: page`, and `as: pdf` metadata classify published outputs independently of folder names. Builders are reusable packages; each worker invokes its builder at build time, copies the generated output into its own `dist`, and serves files only through its `ASSETS` binding. Requests do not build or transform vault content.

Vault → Obsidian Markdown → HTML and PDFs → Cloudflare Workers.

Run `npm run build` to build the packages.

No CMS. No double entry. No sync. Just write, deploy.

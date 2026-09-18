# Rules for Agents

The Obsidian vault for my CV.

## Key Facts + Rules

- Vault deployed as a Digital Garden website - [source](/Users/gyorgygutai/Projects/digitalgarden/digitalgarden-cv)
- **Vault = DG parity**: vault must look identical to the Digital Garden site
- **One-directional**: vault → DG only, never reverse
  - Notes published via DG plugin's GitHub integration
  - CSS snippets auto-sync'd via VS Code workflow (see below)
- Any css customization only using Obsidian css snippets as source of truth
- Css snippets are isolated units: one component/feature per file
- **Do not edit CSS snippets in Obsidian** — use VS Code instead
  - Open the workspace: `gyorgygutai-dev.code-workspace`
  - Install recommended "Run on Save" extension when prompted
  - Edit `.obsidian/snippets/*.css` in VS Code
  - On every save, `rsync` auto-copies to DG repo (`src/site/styles/user/`)
  - DG copies are overwritten — never edit them directly

## TODO

**Maybe AI-assisted**:

- [ ] Pdf gen
- [ ] Name gradient

**Human only**:"

- [ ] Restructure projects

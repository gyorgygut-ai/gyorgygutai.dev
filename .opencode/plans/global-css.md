# Phase 1: Rename `preset-website-shell` → `preset-website`

## Why
The package name "preset-website-shell" is misleading. It produces the full HTML document shell, not just a "preset". The new name is cleaner and matches its actual responsibility.

## Changes

### 1. Update package configs
- `packages/preset-website-shell/package.json`: `"@gyorgygutai/preset-website-shell"` → `"@gyorgygutai/preset-website"`
- `packages/preset-website-shell/tsconfig.json`: no change
- `packages/preset-website-shell/vitest.config.ts`: no change

### 2. Update all import references
Find every `@gyorgygutai/preset-website-shell` reference across the monorepo:
- `packages/processor-html/package.json` → `dependencies`
- `packages/worker-website/package.json` → `dependencies`
- `packages/worker-pdf/package.json` → `dependencies`
- `packages/processor-html/src/process.ts` → `import { createShell } from "@gyorgygutai/preset-website-shell"`
- `packages/worker-website/src/processVaultToStatic.ts` → if it imports anything from it
- `packages/preset-website-shell/src/tests/shell.test.ts` → test imports
- `packages/processor-html/src/tests/process.test.ts` → test imports
- `packages/worker-website/src/tests/worker.test.ts` → if it imports from it
- `packages/worker-pdf/package.json` → `dependencies`

### 3. Rename the directory
`packages/preset-website-shell/` → `packages/preset-website/`

### 4. Update AGENTS.md
Update structure section and all cross-package contract references.

### 5. Run `npm install` + `npm test` to verify no imports are broken.

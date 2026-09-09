# Processor — HTML → PDF

## Why This Package Exists

It converts rendered HTML into PDF. It depends on `processor-md-to-html` for the HTML input.

## Responsibility

- Strip HTML tags from rendered HTML
- Generate PDF bytes from plain text
- Provide pure function: `processObsidianMdToPdf`

## File Structure

- `src/processObsidianMdToPdf.ts`: input html, output pdf
- `src/parser/stripHtml.ts`: HTML → plain text
- `src/parser/generatePdf.ts`: plain text → PDF bytes

## Public API

- `src/index.ts` is the single source of truth for exports

## Contracts

- Depends on `@gyorgygutai/processor-md-to-html` for HTML generation
- Uses `pdf-lib` for PDF generation

## Tests

- One `*.test.ts` per subject; input → assert output
- Fixtures in `src/tests/fixtures/**`
- Deterministic; no external I/O

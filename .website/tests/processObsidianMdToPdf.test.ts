import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { processObsidianMdToPdf } from "../src/processObsidianMdToPdf";

const fixturesDir = join(import.meta.dirname, "fixtures");

function readFixture(path: string): string | Uint8Array {
  if (path.endsWith(".pdf")) {
    return readFileSync(join(fixturesDir, path));
  }
  return readFileSync(join(fixturesDir, path), "utf-8");
}

function isPdfStart(bytes: Uint8Array): boolean {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

describe("processObsidianMdToPdf", () => {
  test("empty input produces valid PDF", async () => {
    const result = await processObsidianMdToPdf("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(isPdfStart(result)).toBe(true);
  });

  test("basic markdown produces valid PDF", async () => {
    const result = await processObsidianMdToPdf("# Hello\n\nWorld");
    expect(isPdfStart(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("transclusion content produces valid PDF", async () => {
    const md = readFixture("long-note/input.md") as string;
    const result = await processObsidianMdToPdf(md);
    expect(isPdfStart(result)).toBe(true);
  });

  test("callout content produces valid PDF", async () => {
    const md = readFixture("long-note/input.md") as string;
    const result = await processObsidianMdToPdf(md);
    expect(isPdfStart(result)).toBe(true);
  });

  test("large content produces larger PDF than small", async () => {
    const small = await processObsidianMdToPdf("# Hello");
    const large = await processObsidianMdToPdf(readFixture("long-note/input.md") as string);
    expect(large.length).toBeGreaterThan(small.length);
  });

  test("different inputs produce different PDFs", async () => {
    const a = await processObsidianMdToPdf("# Hello");
    const b = await processObsidianMdToPdf("# World");
    expect(arraysEqual(a, b)).toBe(false);
  });

  test("same input always produces same pdf bytes", async () => {
    const md = "# Hello\n\nWorld";
    const a = await processObsidianMdToPdf(md);
    const b = await processObsidianMdToPdf(md);
    expect(arraysEqual(a, b)).toBe(true);
  });

  test("simple-note fixture deterministic pdf", async () => {
    const md = readFixture("simple-note/input.md") as string;
    const expected = readFixture("simple-note/expected.pdf") as Uint8Array;
    const result = await processObsidianMdToPdf(md);
    expect(arraysEqual(result, expected)).toBe(true);
  });

  test("long-note fixture deterministic pdf", async () => {
    const md = readFixture("long-note/input.md") as string;
    const expected = readFixture("long-note/expected.pdf") as Uint8Array;
    const result = await processObsidianMdToPdf(md);
    expect(arraysEqual(result, expected)).toBe(true);
  });
});

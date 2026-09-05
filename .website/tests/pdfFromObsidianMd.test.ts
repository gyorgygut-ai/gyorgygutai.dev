import { describe, test, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { pdfFromObsidianMd } from "../src/pdfFromObsidianMd";

const fixturesDir = join(import.meta.dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

function isPdfStart(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

describe("pdfFromObsidianMd", () => {
  test("empty input produces valid PDF", async () => {
    const result = await pdfFromObsidianMd("");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
    expect(isPdfStart(result)).toBe(true);
  });

  test("basic markdown produces valid PDF", async () => {
    const result = await pdfFromObsidianMd("# Hello\n\nWorld");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(isPdfStart(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  test("transclusion content produces valid PDF", async () => {
    const md = readFixture("publish-true.md");
    const result = await pdfFromObsidianMd(md);
    expect(isPdfStart(result)).toBe(true);
  });

  test("callout content produces valid PDF", async () => {
    const md = readFixture("publish-callout.md");
    const result = await pdfFromObsidianMd(md);
    expect(isPdfStart(result)).toBe(true);
  });

  test("large content produces valid PDF larger than small", async () => {
    const small = await pdfFromObsidianMd("# Hello");
    const large = await pdfFromObsidianMd(readFixture("large.md"));
    expect(isPdfStart(large)).toBe(true);
    expect(large.length).toBeGreaterThan(small.length);
  });

  test("different inputs produce different PDFs", async () => {
    const a = await pdfFromObsidianMd("# Hello");
    const b = await pdfFromObsidianMd("# World");
    expect(arraysEqual(a, b)).toBe(false);
  });
});
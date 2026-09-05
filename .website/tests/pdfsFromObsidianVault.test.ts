import { describe, test, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pdfsFromObsidianVault } from "../src/pdfsFromObsidianVault";

const fixturesDir = join(import.meta.dirname, "fixtures");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

function createTempVault(): string {
  const dir = mkdtempSync(join(tmpdir(), "vault-test-"));
  const files = [
    "publish-true.md",
    "publish-callout.md",
    "publish-false.md",
    "no-frontmatter.md",
    "empty.md",
    "minimal.md",
    "large.md",
  ];
  for (const file of files) {
    writeFileSync(join(dir, file), readFixture(file));
  }
  return dir;
}

function isPdfStart(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d;
}

describe("pdfsFromObsidianVault", () => {
  test("returns only publish-true notes", async () => {
    const dir = createTempVault();
    const result = await pdfsFromObsidianVault(dir);
    expect(Object.keys(result).sort()).toEqual([
      "large.md",
      "minimal.md",
      "publish-callout.md",
      "publish-true.md",
    ]);
  });

  test("publish-false is excluded", async () => {
    const dir = createTempVault();
    const result = await pdfsFromObsidianVault(dir);
    expect(result).not.toHaveProperty("publish-false.md");
  });

  test("no-frontmatter is excluded", async () => {
    const dir = createTempVault();
    const result = await pdfsFromObsidianVault(dir);
    expect(result).not.toHaveProperty("no-frontmatter.md");
  });

  test("empty is excluded", async () => {
    const dir = createTempVault();
    const result = await pdfsFromObsidianVault(dir);
    expect(result).not.toHaveProperty("empty.md");
  });

  test("all values are valid PDFs", async () => {
    const dir = createTempVault();
    const result = await pdfsFromObsidianVault(dir);
    for (const pdf of Object.values(result)) {
      expect(pdf).toBeInstanceOf(Uint8Array);
      expect(isPdfStart(pdf)).toBe(true);
    }
  });
});
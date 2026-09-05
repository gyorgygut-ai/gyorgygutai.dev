import { describe, test, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { htmlsFromObsidianVault } from "../src/htmlsFromObsidianVault";

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

describe("htmlsFromObsidianVault", () => {
  test("returns only publish-true notes", async () => {
    const dir = createTempVault();
    const result = await htmlsFromObsidianVault(dir);
    expect(Object.keys(result).sort()).toEqual([
      "large.md",
      "minimal.md",
      "publish-callout.md",
      "publish-true.md",
    ]);
  });

  test("publish-false is excluded", async () => {
    const dir = createTempVault();
    const result = await htmlsFromObsidianVault(dir);
    expect(result).not.toHaveProperty("publish-false.md");
  });

  test("no-frontmatter is excluded", async () => {
    const dir = createTempVault();
    const result = await htmlsFromObsidianVault(dir);
    expect(result).not.toHaveProperty("no-frontmatter.md");
  });

  test("empty is excluded", async () => {
    const dir = createTempVault();
    const result = await htmlsFromObsidianVault(dir);
    expect(result).not.toHaveProperty("empty.md");
  });

  test("all values are HTML with content", async () => {
    const dir = createTempVault();
    const result = await htmlsFromObsidianVault(dir);
    for (const html of Object.values(result)) {
      expect(html).toMatch(/<h[1-6]|<p>/);
    }
  });
});
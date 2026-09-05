import { describe, test, expect } from "vitest";
import { readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { htmlFromObsidianMd } from "../src/htmlFromObsidianMd";

const fixturesDir = join(import.meta.dirname, "fixtures");
const snippetsDir = join(fixturesDir, "snippets");

function readFixture(name: string): string {
  return readFileSync(join(fixturesDir, name), "utf-8");
}

describe("htmlFromObsidianMd", () => {
  test("empty input returns string without throwing", async () => {
    const result = await htmlFromObsidianMd("");
    expect(typeof result).toBe("string");
  });

  test("basic markdown converts to HTML elements", async () => {
    const result = await htmlFromObsidianMd("# Hello\n\nWorld");
    expect(result).toContain("<h1>");
    expect(result).toContain("<p>");
  });

  test("transclusions produce blockquote or transclude markup", async () => {
    const md = readFixture("publish-true.md");
    const result = await htmlFromObsidianMd(md);
    expect(result).toMatch(/blockquote|transclude/i);
  });

  test("callouts produce callout markup", async () => {
    const md = readFixture("publish-callout.md");
    const result = await htmlFromObsidianMd(md);
    expect(result).toMatch(/callout|data-callout/i);
  });

  test("image embeds produce img tags", async () => {
    const md = readFixture("publish-callout.md");
    const result = await htmlFromObsidianMd(md);
    expect(result).toContain("<img");
  });

  test("bold text produces strong tags", async () => {
    const result = await htmlFromObsidianMd("**bold**");
    expect(result).toContain("<strong>");
  });

  test("links produce anchor tags", async () => {
    const result = await htmlFromObsidianMd("[text](https://example.com)");
    expect(result).toContain('<a href="https://example.com"');
  });

  test("inline code produces code tags", async () => {
    const result = await htmlFromObsidianMd("`code`");
    expect(result).toContain("<code>");
  });

  test("lists produce list item tags", async () => {
    const result = await htmlFromObsidianMd("- item one\n- item two");
    expect(result).toContain("<li>");
  });

  test("horizontal rules produce hr tags", async () => {
    const result = await htmlFromObsidianMd("---");
    expect(result).toContain("<hr");
  });

  test("raw HTML is preserved", async () => {
    const result = await htmlFromObsidianMd('<hr class="header-separator">');
    expect(result).toContain("header-separator");
  });

  test("frontmatter is stripped from output", async () => {
    const md = readFixture("publish-true.md");
    const result = await htmlFromObsidianMd(md);
    expect(result).not.toContain("dg-publish");
  });

  test("CSS snippets are inlined into output", async () => {
    const md = readFixture("publish-true.md");
    const result = await htmlFromObsidianMd(md, { cssDir: snippetsDir });
    expect(result).toContain("--background-primary");
  });
});
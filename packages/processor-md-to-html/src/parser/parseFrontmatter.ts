import grayMatter from "gray-matter"

export function parseFrontmatter(markdown: string): { content: string; data: Record<string, unknown> } {
  const { content, data } = grayMatter(markdown)
  return { content, data }
}

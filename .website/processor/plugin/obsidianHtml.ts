import rehypeObsidian from "@quartz-community/rehype-obsidian"

export const obsidianHtml: [typeof rehypeObsidian, Record<string, unknown>] = [
  rehypeObsidian,
  { checkbox: true, mermaid: false },
]

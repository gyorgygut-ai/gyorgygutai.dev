import remarkObsidian from "@quartz-community/remark-obsidian"

export default [
  remarkObsidian,
  { wikilinks: true, highlights: true, comments: true, tags: true, customTaskChars: true, math: true },
] as [typeof remarkObsidian, Record<string, unknown>]

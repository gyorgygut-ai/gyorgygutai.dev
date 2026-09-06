import remarkObsidian from "@quartz-community/remark-obsidian"

export const obsidian: [typeof remarkObsidian, Record<string, unknown>] = [
  remarkObsidian,
  {
    wikilinks: true,
    highlights: true,
    comments: true,
    tags: true,
    customTaskChars: true,
    math: true,
  },
]

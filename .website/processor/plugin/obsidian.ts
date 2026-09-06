import remarkObsidian from "@quartz-community/remark-obsidian"

export const obsidian: any = [
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

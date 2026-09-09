import rehypeObsidian from "@quartz-community/rehype-obsidian"

export default [rehypeObsidian, { checkbox: true, mermaid: false }] as unknown as [typeof rehypeObsidian, Record<string, unknown>]

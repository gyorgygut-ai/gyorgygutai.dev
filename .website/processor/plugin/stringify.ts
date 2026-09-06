import rehypeStringify from "rehype-stringify"

export const stringify: [typeof rehypeStringify, Record<string, unknown>] = [
  rehypeStringify,
  { allowDangerousHtml: true },
]

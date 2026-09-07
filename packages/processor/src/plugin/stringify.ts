import rehypeStringify from "rehype-stringify"

export default [rehypeStringify, { allowDangerousHtml: true }] as unknown as [typeof rehypeStringify, Record<string, unknown>]

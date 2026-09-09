import rehypeDocument from "rehype-document"
import rehypeStringify from "rehype-stringify"
import { rehypeMain } from "./rehypeMain"
import { rehypeMetaExtra } from "./rehypeMetaExtra"

export default [
  [rehypeDocument, { title: "", responsive: true, language: "en" }],
  rehypeMetaExtra,
  rehypeMain,
  [rehypeStringify, { allowDangerousHtml: true }],
]
import type { PluggableList } from "unified"
import rehypeDocument from "rehype-document"
import rehypeStringify from "rehype-stringify"
import { rehypeMain } from "./rehypeMain"
import { rehypeMetaExtra } from "./rehypeMetaExtra"

const preset: PluggableList = [
  [rehypeDocument, { title: "", responsive: true, language: "en" }],
  rehypeMetaExtra,
  rehypeMain,
  [rehypeStringify, { allowDangerousHtml: true }],
]

export default preset

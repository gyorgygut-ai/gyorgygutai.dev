import { describe, it, expect } from "vitest"
import { renderDocument } from "../renderDocument"

describe("renderDocument", () => {
  it("wraps fragment in full HTML document", () => {
    const result = renderDocument("<h1>Hello</h1>", { meta: {}, siteCss: "", siteJs: "" })
    expect(result).toContain("<!DOCTYPE html>")
    expect(result).toContain("<h1>Hello</h1>")
    expect(result).toContain("</html>")
  })

  it("injects title from meta", () => {
    const result = renderDocument("<p>test</p>", { meta: { title: "My Title" }, siteCss: "", siteJs: "" })
    expect(result).toContain("<title>My Title</title>")
  })

  it("injects description from meta", () => {
    const result = renderDocument("<p>test</p>", { meta: { description: "My desc" }, siteCss: "", siteJs: "" })
    expect(result).toContain('<meta name="description" content="My desc">')
  })

  it("escapes HTML in meta values", () => {
    const result = renderDocument("<p>test</p>", { meta: { title: "<script>alert(1)</script>" }, siteCss: "", siteJs: "" })
    expect(result).not.toContain("<script>")
    expect(result).toContain("&lt;script&gt;")
  })

  it("injects siteCss in style tag", () => {
    const result = renderDocument("<p>test</p>", { meta: {}, siteCss: "body{}", siteJs: "" })
    expect(result).toContain("<style>body{}</style>")
  })

  it("injects siteJs in script tag when provided", () => {
    const result = renderDocument("<p>test</p>", { meta: {}, siteCss: "", siteJs: "console.log(1)" })
    expect(result).toContain("<script>console.log(1)</script>")
  })

  it("omits script tag when siteJs is empty", () => {
    const result = renderDocument("<p>test</p>", { meta: {}, siteCss: "", siteJs: "" })
    expect(result).not.toContain("<script>")
  })
})

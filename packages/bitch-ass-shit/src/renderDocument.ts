interface Meta {
  title?: string
  description?: string
  lang?: string
}

export function renderDocument(
  fragment: string,
  { meta, siteCss, siteJs }: { meta: Meta; siteCss: string; siteJs: string }
): string {
  const title = meta.title || ""
  const description = meta.description || ""
  const lang = meta.lang || "en"
  
  const metaTags: string[] = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<meta name="color-scheme" content="dark light">`,
    title ? `<title>${escapeHtml(title)}</title>` : "",
    description ? `<meta name="description" content="${escapeHtml(description)}">` : "",
  ]
  
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  ${metaTags.filter(Boolean).join("\n  ")}
  <style>${siteCss}</style>
</head>
<body>
  <main class="content">
    ${fragment}
  </main>
  ${siteJs ? `<script>${siteJs}</script>` : ""}
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

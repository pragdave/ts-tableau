export type PageOptions = {
  title: string
  bodyHtml: string
  toc: string
  cssHrefs?: string[]
  inlineCss?: string[]
}

export function renderPage({ title, bodyHtml, toc, cssHrefs = [], inlineCss = [] }: PageOptions): string {
  const cssLinks = cssHrefs.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n")
  const styleBlock = inlineCss.length > 0 ? `<style>\n${inlineCss.join("\n\n")}\n</style>` : ""

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
${cssLinks}
${styleBlock}
</head>
<body>
<div class="tb-page">
  <main class="tb-content">
${bodyHtml}
  </main>
  ${toc}
</div>
</body>
</html>
`
}

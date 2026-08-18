import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from "node:fs"
import { dirname, join, relative, extname } from "node:path"
import { fileURLToPath } from "node:url"
import { glob } from "glob"
import { renderMarkdown } from "./lib/render.mts"
import { renderPage } from "./lib/template.mts"
import { copyKatexAssets } from "./lib/assets.mts"

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, "..")
const sourceDir = join(rootDir, "docs", "guide")
const outputDir = join(rootDir, "docs-site")

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

copyFileSync(join(rootDir, "assets", "tableau.css"), join(outputDir, "tableau.css"))
copyFileSync(join(rootDir, "assets", "site.css"), join(outputDir, "site.css"))
copyKatexAssets(outputDir)

const allFiles = await glob("**/*", { cwd: sourceDir, nodir: true })
const mdCount = allFiles.filter((f) => extname(f) === ".md").length

type Page = { title: string; href: string }
const pages: Page[] = []

for (const relPath of allFiles) {
  const inputPath = join(sourceDir, relPath)
  // With a single page in the whole site, it IS the site -- serve it at
  // the root instead of also generating a one-link landing page. Once a
  // second page shows up, this reverts to one file per page plus a
  // generated index that links to all of them.
  const outputRelPath = mdCount === 1 && extname(relPath) === ".md" ? "index.html" : relPath.replace(/\.md$/, ".html")
  const outputPath = join(outputDir, outputRelPath)
  mkdirSync(dirname(outputPath), { recursive: true })

  if (extname(relPath) === ".md") {
    const markdown = readFileSync(inputPath, "utf-8")
    const { bodyHtml, toc, title } = await renderMarkdown(markdown)
    const depth = relative(outputDir, dirname(outputPath)).split(/[\\/]/).filter(Boolean).length
    const prefix = depth > 0 ? "../".repeat(depth) : ""

    const html = renderPage({
      title,
      bodyHtml,
      toc,
      cssHrefs: [`${prefix}tableau.css`, `${prefix}site.css`, `${prefix}katex.min.css`],
    })
    writeFileSync(outputPath, html)
    pages.push({ title, href: outputRelPath })
    console.log(`wrote ${relative(rootDir, outputPath)}`)
  } else {
    copyFileSync(inputPath, outputPath)
  }
}

if (mdCount > 1) {
  const indexHtml = renderPage({
    title: "Tableau Docs",
    bodyHtml: `<h1>Tableau Docs</h1>
<ul class="tb-index-list">
${pages.map((page) => `  <li><a href="${page.href}">${page.title}</a></li>`).join("\n")}
</ul>`,
    toc: "",
    cssHrefs: ["tableau.css", "site.css"],
  })
  writeFileSync(join(outputDir, "index.html"), indexHtml)
  console.log(`wrote ${relative(rootDir, join(outputDir, "index.html"))}`)
}

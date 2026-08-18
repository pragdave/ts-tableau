import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { renderMarkdown } from "./lib/render.mts"
import { renderPage } from "./lib/template.mts"
import { copyKatexAssets } from "./lib/assets.mts"

const __dirname = dirname(fileURLToPath(import.meta.url))

const [, , inputPath, outputPathArg] = process.argv
if (!inputPath) {
  console.error("usage: tsx cli/md2html.mts <input.md> [output.html]")
  process.exit(1)
}

const outputPath = outputPathArg ?? inputPath.replace(/\.[^./]+$/, ".html")
const outputDir = dirname(outputPath)
mkdirSync(outputDir, { recursive: true })

copyFileSync(join(__dirname, "..", "assets", "tableau.css"), join(outputDir, "tableau.css"))
copyFileSync(join(__dirname, "..", "assets", "site.css"), join(outputDir, "site.css"))
copyKatexAssets(outputDir)

const markdown = readFileSync(inputPath, "utf-8")
const { bodyHtml, toc, title } = await renderMarkdown(markdown)

const html = renderPage({
  title,
  bodyHtml,
  toc,
  cssHrefs: ["tableau.css", "site.css", "katex.min.css"],
})

writeFileSync(outputPath, html)
console.log(`wrote ${outputPath}`)

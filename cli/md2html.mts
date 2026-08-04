import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkFrontmatter from "remark-frontmatter"
import remarkTableau from "remark-tableau"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"

const __dirname = dirname(fileURLToPath(import.meta.url))

const [, , inputPath, outputPathArg] = process.argv
if (!inputPath) {
  console.error("usage: tsx cli/md2html.mts <input.md> [output.html]")
  process.exit(1)
}

const outputPath = outputPathArg ?? inputPath.replace(/\.[^./]+$/, ".html")

const css = readFileSync(join(__dirname, "..", "assets", "tableau.css"), "utf-8")
const markdown = readFileSync(inputPath, "utf-8")

const file = await unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkTableau)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)
  .process(markdown)

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
${css}
</style>
</head>
<body>
${String(file)}
</body>
</html>
`

writeFileSync(outputPath, html)
console.log(`wrote ${outputPath}`)

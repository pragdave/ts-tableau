import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkFrontmatter from "remark-frontmatter"
import remarkDirective from "remark-directive"
import remarkMath from "remark-math"
import remarkTableau from "remark-tableau"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeStringify from "rehype-stringify"
import { remarkTableauDirectives } from "./directives.mts"
import { rehypeCollectHeadings, renderToc, type Heading } from "./toc.mts"

export type RenderResult = { bodyHtml: string; toc: string; title: string }

function extractTitle(markdown: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : "Tableau"
}

export async function renderMarkdown(markdown: string): Promise<RenderResult> {
  const headings: Heading[] = []

  const file = await unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkDirective)
    .use(remarkTableauDirectives)
    .use(remarkMath)
    .use(remarkTableau)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeKatex)
    .use(rehypeSlug)
    .use(rehypeCollectHeadings, headings)
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeStringify)
    .process(markdown)

  return {
    bodyHtml: String(file),
    toc: renderToc(headings),
    title: extractTitle(markdown),
  }
}

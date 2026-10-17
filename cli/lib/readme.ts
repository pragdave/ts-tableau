import { createHash } from "node:crypto"

export const README_SOURCE = "README.src.md"
export const README_OUTPUT = "README.md"
export const IMAGE_DIR = "README_ASSETS/generated"
export const MANIFEST = `${IMAGE_DIR}/manifest.json`

// Bump when the way images are rendered changes, so every image is
// regenerated even though no table source or CSS changed.
const RENDER_VERSION = "1"

export type SourceDisplay = "none" | "collapsed" | "open"

export type TableBlock = {
  start: number
  end: number
  source: string
  showSource: SourceDisplay
}

// name -> displayed width in CSS pixels
export type Manifest = Record<string, number>

const FENCE = /^ {0,3}(`{3,}|~{3,})\s*([^\s`]*)([^`]*)$/

const SOURCE_OPTIONS: Record<string, SourceDisplay> = { "": "none", source: "collapsed", "source-open": "open" }

// Only top-level ```tableau fences are tables to render; a tableau fence
// nested inside another code block is an example of the syntax.
export function findTableBlocks(markdown: string): TableBlock[] {
  const lines = markdown.split("\n")
  const blocks: TableBlock[] = []
  let i = 0
  while (i < lines.length) {
    const open = lines[i].match(FENCE)
    if (!open) {
      i++
      continue
    }
    const [, fence, info, rest] = open
    const close = new RegExp(`^ {0,3}${fence[0] === "`" ? "`" : "~"}{${fence.length},}\\s*$`)
    let j = i + 1
    while (j < lines.length && !close.test(lines[j])) j++
    if (info === "tableau") {
      const option = rest.trim()
      const showSource = SOURCE_OPTIONS[option]
      if (showSource === undefined) {
        throw new Error(`line ${i + 1}: unknown tableau fence option '${option}' (expected 'source' or 'source-open')`)
      }
      blocks.push({ start: i, end: j, source: lines.slice(i + 1, j).join("\n"), showSource })
    }
    i = j + 1
  }
  return blocks
}

export function imageName(source: string, css: string): string {
  const hash = createHash("sha256").update(RENDER_VERSION).update(css).update(source).digest("hex")
  return `table-${hash.slice(0, 12)}`
}

export function altText(source: string): string {
  const layout = source.split(/^\s*===\s*$/m)[1] ?? ""
  const caption = layout.match(/^\s*(?:#+|:)\s*(.+)$/m)
  return caption ? caption[1].trim() : "Table"
}

function escapeAttribute(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
}

function picture(name: string, width: number, alt: string): string {
  return [
    "<picture>",
    `  <source media="(prefers-color-scheme: dark)" srcset="${IMAGE_DIR}/${name}-dark.png">`,
    `  <img alt="${escapeAttribute(alt)}" src="${IMAGE_DIR}/${name}-light.png" width="${width}">`,
    "</picture>",
  ].join("\n")
}

function sourceSection(source: string, display: SourceDisplay): string {
  if (display === "none") return ""
  const longestRun = Math.max(0, ...(source.match(/`+/g) ?? []).map((run) => run.length))
  const fence = "`".repeat(Math.max(3, longestRun + 1))
  return [
    "",
    "",
    display === "open" ? "<details open>" : "<details>",
    "<summary>Source</summary>",
    "",
    `${fence}tableau`,
    source,
    fence,
    "",
    "</details>",
  ].join("\n")
}

export const GENERATED_NOTICE =
  `<!-- Generated from ${README_SOURCE} by \`npm run readme\`. Edit that file, not this one. -->`

export function renderReadme(markdown: string, css: string, manifest: Manifest): string {
  const lines = markdown.split("\n")
  const blocks = findTableBlocks(markdown)
  for (const block of [...blocks].reverse()) {
    const name = imageName(block.source, css)
    const width = manifest[name]
    if (width === undefined) {
      throw new Error(`no rendered image for the table at line ${block.start + 1}; run npm run readme`)
    }
    lines.splice(block.start, block.end - block.start + 1,
      picture(name, width, altText(block.source)) + sourceSection(block.source, block.showSource))
  }
  return `${GENERATED_NOTICE}\n\n${lines.join("\n")}`
}

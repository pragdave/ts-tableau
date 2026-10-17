import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { chromium, type Browser } from "playwright"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { tableau } from "../src/tableau"
import { generate } from "../src/generators/html"
import {
  README_SOURCE, README_OUTPUT, IMAGE_DIR, MANIFEST,
  findTableBlocks, imageName, renderReadme, type Manifest,
} from "./lib/readme.ts"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const css = readFileSync(join(root, "assets/tableau.css"), "utf8")

const markdownToHtml = unified().use(remarkParse).use(remarkRehype).use(rehypeStringify)

function unescapeHtml(text: string): string {
  return text.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
}

function tableHtml(source: string): string {
  const html = generate(tableau(source.split("\n"))).join("\n")
  return html.replace(/<tableau-md>([\s\S]*?)<\/tableau-md>/g, (_, content) =>
    String(markdownToHtml.processSync(unescapeHtml(content))))
}

// GitHub's own page colours, so the transparent PNGs sit naturally on
// either theme.
function page(table: string): string {
  return `<!doctype html><meta charset="utf-8">
<style>
${css}
:root { color: light-dark(#1f2328, #e6edf3); }
body { margin: 0; background: transparent;
  font: 16px -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; }
#frame { display: inline-block; padding: 4px; }
</style>
<div id="frame">${table}</div>`
}

async function screenshot(browser: Browser, html: string, scheme: "light" | "dark", path: string): Promise<number> {
  const context = await browser.newContext({ colorScheme: scheme, deviceScaleFactor: 2 })
  const tab = await context.newPage()
  await tab.setContent(html)
  const frame = tab.locator("#frame")
  await frame.screenshot({ path, omitBackground: true })
  const box = await frame.boundingBox()
  await context.close()
  return Math.round(box!.width)
}

async function main() {
  const source = readFileSync(join(root, README_SOURCE), "utf8")
  const imageDir = join(root, IMAGE_DIR)
  mkdirSync(imageDir, { recursive: true })

  const previous: Manifest = existsSync(join(root, MANIFEST))
    ? JSON.parse(readFileSync(join(root, MANIFEST), "utf8"))
    : {}
  const manifest: Manifest = {}

  const browser = await chromium.launch()
  try {
    for (const block of findTableBlocks(source)) {
      const name = imageName(block.source, css)
      const light = join(imageDir, `${name}-light.png`)
      const dark = join(imageDir, `${name}-dark.png`)
      if (previous[name] !== undefined && existsSync(light) && existsSync(dark)) {
        manifest[name] = previous[name]
        continue
      }
      let html: string
      try {
        html = page(tableHtml(block.source))
      } catch (e) {
        throw new Error(`${README_SOURCE}, table at line ${block.start + 1}: ${e instanceof Error ? e.message : e}`)
      }
      manifest[name] = await screenshot(browser, html, "light", light)
      await screenshot(browser, html, "dark", dark)
      console.log(`rendered ${name} (line ${block.start + 1})`)
    }
  } finally {
    await browser.close()
  }

  for (const file of readdirSync(imageDir)) {
    const name = file.replace(/-(light|dark)\.png$/, "")
    if (file.endsWith(".png") && manifest[name] === undefined) {
      rmSync(join(imageDir, file))
      console.log(`removed ${file}`)
    }
  }

  writeFileSync(join(root, MANIFEST), JSON.stringify(manifest, null, 2) + "\n")
  writeFileSync(join(root, README_OUTPUT), renderReadme(source, css, manifest))
  console.log(`wrote ${README_OUTPUT}`)
}

await main()

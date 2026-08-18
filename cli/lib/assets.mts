import { cpSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const katexDist = join(__dirname, "..", "..", "node_modules", "katex", "dist")

// KaTeX's CSS references its webfonts via relative "fonts/..." URLs, so
// the css file and the fonts/ directory need to land side by side in the
// output -- copying just the .css (as we do for tableau.css/site.css)
// isn't enough, glyphs would silently fail to load.
export function copyKatexAssets(destDir: string) {
  mkdirSync(destDir, { recursive: true })
  cpSync(join(katexDist, "katex.min.css"), join(destDir, "katex.min.css"))
  cpSync(join(katexDist, "fonts"), join(destDir, "fonts"), { recursive: true })
}

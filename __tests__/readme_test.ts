import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import {
  README_SOURCE, README_OUTPUT, IMAGE_DIR, MANIFEST,
  altText, findTableBlocks, imageName, renderReadme,
} from "../cli/lib/readme"

const root = join(__dirname, "..")
const read = (path: string) => readFileSync(join(root, path), "utf8")

describe("findTableBlocks", () => {
  test("finds ``` and ~~~ tableau fences", () => {
    const blocks = findTableBlocks("text\n```tableau\na|b\n```\n\n~~~ tableau\nc|d\n===\nboxed\n~~~\n")
    expect(blocks.map((b) => b.source)).toEqual(["a|b", "c|d\n===\nboxed"])
    expect(blocks[0]).toMatchObject({ start: 1, end: 3 })
  })

  test("ignores fences with other info strings", () => {
    expect(findTableBlocks("```js\nx\n```\n```\ny\n```\n")).toEqual([])
  })

  test("leaves a tableau fence nested inside another code block alone", () => {
    const markdown = "~~~~markdown\n```tableau\na|b\n```\n~~~~\n```tableau\nc|d\n```\n"
    expect(findTableBlocks(markdown).map((b) => b.source)).toEqual(["c|d"])
  })
})

describe("altText", () => {
  test("uses the caption", () => {
    expect(altText("a|b\n===\n# Monthly sales\n[r1] header")).toBe("Monthly sales")
  })

  test("falls back to 'Table'", () => {
    expect(altText("a|b")).toBe("Table")
  })
})

describe("source sections", () => {
  const css = "css"
  const render = (fence: string, source = "a|b") =>
    renderReadme(`${fence}\n${source}\n\`\`\`\n`, css, { [imageName(source, css)]: 100 })

  test("a plain tableau fence shows only the picture", () => {
    expect(render("```tableau")).not.toContain("<details")
  })

  test("'source' adds a collapsed Source section after the picture", () => {
    const out = render("```tableau source")
    expect(out).toMatch(/<\/picture>\n\n<details>\n<summary>Source<\/summary>\n\n```tableau\na\|b\n```\n\n<\/details>/)
  })

  test("'source-open' starts it open", () => {
    expect(render("```tableau source-open")).toContain("<details open>")
  })

  test("the source fence is longer than any backtick run in the source", () => {
    expect(render("```tableau source", "a|`` x ``")).toContain("```tableau\na|`` x ``\n```")
    expect(render("```tableau source", "a|```")).toContain("````tableau\na|```\n````")
  })

  test("an unknown option is an error", () => {
    expect(() => findTableBlocks("```tableau sauce\na|b\n```\n")).toThrow("unknown tableau fence option 'sauce'")
  })
})

test("renderReadme refuses a table that has no rendered image", () => {
  expect(() => renderReadme("```tableau\na|b\n```\n", "css", {})).toThrow("run npm run readme")
})

describe(`${README_OUTPUT}`, () => {
  const css = read("assets/tableau.css")
  const manifest = JSON.parse(read(MANIFEST))

  test(`is up to date with ${README_SOURCE} (run npm run readme)`, () => {
    expect(read(README_OUTPUT)).toBe(renderReadme(read(README_SOURCE), css, manifest))
  })

  test("has both images for every table", () => {
    for (const block of findTableBlocks(read(README_SOURCE))) {
      const name = imageName(block.source, css)
      for (const scheme of ["light", "dark"]) {
        expect(existsSync(join(root, IMAGE_DIR, `${name}-${scheme}.png`))).toBe(true)
      }
    }
  })
})

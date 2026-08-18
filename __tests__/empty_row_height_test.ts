import { tableau, generate } from "../src/index"

// "=empty" is documented (see docs/guide) as producing a row whose cells
// are the same height as a normal data row, as opposed to a bare blank
// line, which produces a half-height row. The two inputs must therefore
// not render identically.
test("=empty row renders full-height (non-empty) cells, unlike a blank-line row", () => {
  const emptyRowHtml = generate(tableau(["a|b", "=empty", "c|d"])).join("\n")
  const blankLineHtml = generate(tableau(["a|b", " ", "c|d"])).join("\n")

  expect(emptyRowHtml).not.toBe(blankLineHtml)
  // the blank-line row is genuinely empty
  expect(blankLineHtml).toContain("<tableau-md></tableau-md>")
  // the =empty row is not
  expect(emptyRowHtml).not.toContain("<tableau-md></tableau-md>")
})

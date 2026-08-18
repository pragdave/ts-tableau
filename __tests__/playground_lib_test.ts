import { run } from "../playground/lib"

test("run() returns generated HTML and table data for valid input", () => {
  const result = run("a|b\nc|d")
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.html).toContain("<table")
    expect(result.html).toContain("<tableau-md>a</tableau-md>")
    expect(result.tableData.row_count()).toBe(2)
  }
})

test("run() normalizes a thrown string into an error message", () => {
  // src/tableau.ts throws a plain string when '===' appears twice
  const result = run("a|b\n===\nboxed\n===\nboxed")
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error).toBe(
      "Cannot have a format separator ('===') in the format section"
    )
  }
})

test("run() normalizes a thrown Error into its message", () => {
  // src/parser/parse_formats.ts throws `new Error(...)` for unrecognized format text
  const result = run("a|b\n===\ngarbledtext123")
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error).toMatch(/unrecognized format/)
  }
})

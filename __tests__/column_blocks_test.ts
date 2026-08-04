import { tableau } from "../src/tableau"

function rows_of(lines: string[]) {
  return tableau(lines).rows.map((row) => row.cells.map((cell) => cell.content))
}

test("a row followed by one column block replaces that column's content", () => {
  const lines = [
    "Cicero|||",
    "col 2 {{",
    "paragraph one",
    "",
    "paragraph two",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["Cicero", "paragraph one\n\nparagraph two", ""],
  ])
})

test("multiple consecutive blocks target different columns of the same row", () => {
  const lines = [
    "Cicero|||",
    "col 2 {{",
    "second column text",
    "}}",
    "col 3 {{",
    "third column text",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["Cicero", "second column text", "third column text"],
  ])
})

test("'column' keyword is recognized, not just 'col'", () => {
  const lines = [
    "a|b",
    "column2 {{",
    "text",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "text"],
  ])
})

test("letter-based column addressing resolves to the same columns as numbers", () => {
  const lines = [
    "a|b|c",
    "colb {{",
    "text for b",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "text for b", "c"],
  ])
})

test("dedenting strips common leading whitespace but preserves relative indentation", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "    outer line",
    "      nested line",
    "    outer line again",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "outer line\n  nested line\nouter line again"],
  ])
})

test("a blank line inside a block doesn't force the dedent amount to zero", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "    paragraph one",
    "",
    "    paragraph two",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "paragraph one\n\nparagraph two"],
  ])
})

test("a block targeting an out-of-range column is silently ignored", () => {
  const lines = [
    "a|b",
    "col5 {{",
    "text",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "b"],
  ])
})

test("a block missing its closing '}}' throws", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "text with no closer",
  ]
  expect(() => tableau(lines)).toThrow()
})

test("a 'col N {{' line with no preceding data row is just parsed as an ordinary row", () => {
  const lines = [
    "col2 {{",
  ]
  expect(rows_of(lines)).toEqual([
    ["col2 {{"],
  ])
})

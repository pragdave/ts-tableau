import { tableau } from "../src/tableau"

function span_groups(lines: string[]) {
  const table = tableau(lines)
  const result: { row: number, col: number, row_span: number, col_span: number, hidden: boolean }[] = []
  for (let row = 1; row <= table.row_count(); row++) {
    for (let col = 1; col <= table.col_count(); col++) {
      const cell = table.cell_at({ row, col })
      result.push({ row, col, row_span: cell.row_span, col_span: cell.col_span, hidden: cell.hidden })
    }
  }
  return result
}

test("single-cell span is a no-op", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("horizontal span merges two cells in a row", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 2, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("vertical span merges two cells in a column", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1-2:c1] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 2, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("rectangular span merges a 2x2 block", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1-2:c1-2] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 2, col_span: 2, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: true },
  ])
})

test("two independent span groups from separate format lines don't interfere", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span",
    "[r2:c1-2] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 2, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 1, row_span: 1, col_span: 2, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: true },
  ])
})

test("compound selector: each term gets its own span group, not one merged group", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1;r2:c2] span",
  ]
  // Two disjoint single cells, each its own no-op group — not merged together.
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("compound selector with ranges: each term merges independently", () => {
  const lines = [
    "a|b",
    "c|d",
    "e|f",
    "g|h",
    "===",
    "[r1-2:c1;r3-4:c1] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 2, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 3, col: 1, row_span: 2, col_span: 1, hidden: false },
    { row: 3, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 4, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 4, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

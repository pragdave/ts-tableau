import { parse_data_row } from "../src/parser/parse_data_row"
import { Row } from "../src/row"
import { TableData } from "../src/table_data"
import { tableau } from "../src/tableau"

type CellTestSimple = any[]

function trow(row: string) {
  return parse_data_row(row)
}


function table_from_rows(rows: Row[]) {
  const td = new TableData()
  for (const row of rows) {
    td.add_row(row)
  }
  return td
}

function simple_table(rows: string[], expected: CellTestSimple[]) {
  const tc1 = table_from_rows(rows.map(row => trow(row)))

  expect(tc1.row_count()).toBe(expected.length)
  expect(tc1.col_count()).toBe(expected[0].length);

  for (let row = 0; row < expected.length; row++) {
    for (let col = 0; col < expected[0].length; col++) {
      expect(tc1.cell_at({ row: row + 1, col: col + 1 }).content).toBe(expected[row][col])
    }
  }
}


test("simple_table", () => {
  let rows = [
    "a|b",
    "c|d|",
  ]

  let expected = [
    ["a", "b"],
    ["c", "d"],
  ]
  simple_table(rows, expected)
})

test("simple table with variable length columns", () => {
  let rows = [
    "a|b|c",
    "c|d|",
    "e",
  ]

  let expected = [
    ["a", "b", "c"],
    ["c", "d", ""],
    ["e", "", ""],
  ]
  simple_table(rows, expected)
})

test("table with empty row", () => {
  let rows = [
    "a|b",
    "",
    "c|d|",
  ]

  let expected = [
    ["a", "b"],
    ["", ""],
    ["c", "d"],
  ]
  simple_table(rows, expected)
})

test("trailing blank lines in the data section do not produce extra rows", () => {
  const table = tableau(["a|b", "c|d", ""])
  expect(table.row_count()).toBe(2)
})

test("multiple trailing blank lines in the data section do not produce extra rows", () => {
  const table = tableau(["a|b", "c|d", "", ""])
  expect(table.row_count()).toBe(2)
})

test("an interior blank line in the data section still produces a row for it", () => {
  const table = tableau(["a|b", "", "c|d"])
  expect(table.row_count()).toBe(3)
})

test("selector coords computed outside the table are skipped, not crashed on", () => {
  // 5 rows, 3 columns: c$tr walks the diagonal (r1c1, r2c2, r3c3, r4c4,
  // r5c5) but the table is only 3 columns wide, so rows 4 and 5 have no
  // matching column. Those coordinates should simply be left unformatted
  // rather than throwing.
  const lines = [
    "a|b|c",
    "d|e|f",
    "g|h|i",
    "j|k|l",
    "m|n|o",
    "===",
    "[c$tr] bg(red)",
  ]

  expect(() => tableau(lines)).not.toThrow()

  const table = tableau(lines)
  expect(table.cell_at({ row: 1, col: 1 }).bg).not.toBeNull()
  expect(table.cell_at({ row: 3, col: 3 }).bg).not.toBeNull()
  expect(table.cell_at({ row: 1, col: 2 }).bg).toBeNull()
})



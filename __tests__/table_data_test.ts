import { parse_data_row } from "../src/parser/parse_data_row"
import { Row } from "../src/row"
import { TableData } from "../src/table_data"

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



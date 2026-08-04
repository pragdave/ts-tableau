import { parse_selector } from "../src/parser/parse_selector"
import {
  CellCoords,
  Selector,
} from "../src/selectors"
import { StringScanner } from "strscan-ts"
import { TableData } from "../src/table_data"
import { Cell } from "../src/cell"
import { Row } from "../src/row"

const ROWS = 4
const COLS = 5
const TABLE = new TableData()

describe('selector_parse', () => {
  const TESTS: TestCases = ({
    "specific row/col": ["r2:c3", cell_list([one_cell(2, 3)])],
    "all cells in a row": ["r2", cell_list([[c(2, 1), c(2, COLS)]])],
    "all cells in a column": ["c3", cell_list([[c(1, 3), c(ROWS, 3)]])],
    "column range in a row": ["r1:c1-3", cell_list([[c(1, 1), c(1, 3)]])],
    "row range in a column": ["r1-3:c2", cell_list([[c(1, 2), c(3, 2)]])],
    "row and column ranges": ["r1-2:c2-4", cell_list([[c(1, 2), c(2, 4)]])],
    "explicit lists": ["r1,3,5:c4", cell_list([one_cell(1, 4), one_cell(3, 4), one_cell(5, 4)])],
    "lists and ranges": ["r2-3,5:c4", cell_list([one_cell(2, 4), one_cell(3, 4), one_cell(5, 4)])],

    "adjustment plus": ["r2+2:c3", cell_list([one_cell(4, 3)])],
    "adjustment minus": ["r3~2:c3", cell_list([one_cell(1, 3)])],

    "last row 1": ["r$lastrow:c3", cell_list([one_cell(ROWS, 3)])],
    "last row 2": ["r$r:c3", cell_list([one_cell(ROWS, 3)])],
    "last row 3": ["r$r~2:c3", cell_list([one_cell(ROWS - 2, 3)])],
    "last col 1": ["r$lastrow:c$lastcol", cell_list([one_cell(ROWS, COLS)])],
    "last col 2": ["r$lastrow:c$c", cell_list([one_cell(ROWS, COLS)])],
    "last col 3": ["r$lastrow+1:c$c~2", cell_list([one_cell(ROWS + 1, COLS - 2)])],

    "this row (long form)": ["c$thisrow", cell_list([one_cell(1, 1), one_cell(2, 2), one_cell(3, 3), one_cell(4, 4)])],
    "this row (short form)": ["c$tr", cell_list([one_cell(1, 1), one_cell(2, 2), one_cell(3, 3), one_cell(4, 4)])],
    "this row with offset": ["c$tr+1", cell_list([one_cell(1, 2), one_cell(2, 3), one_cell(3, 4), one_cell(4, 5)])],

    // skips
    "skip even absolute 1": ["r3-8%even:c1", cell_list([one_cell(4, 1), one_cell(6, 1), one_cell(8, 1)])],
    "skip even absolute 2": ["r4-8%even:c1", cell_list([one_cell(4, 1), one_cell(6, 1), one_cell(8, 1)])],
    "skip odd absolute 1": ["r3-8%odd:c1", cell_list([one_cell(3, 1), one_cell(5, 1), one_cell(7, 1)])],
    "skip odd absolute 2": ["r4-8%odd:c1", cell_list([one_cell(5, 1), one_cell(7, 1)])],
    "skip by 3 absolute 1": ["r3-8%3:c1", cell_list([one_cell(3, 1), one_cell(6, 1)])],
    "skip by 3 absolute 2": ["r4-8%3:c1", cell_list([one_cell(6, 1)])],
    "skip even relative": ["r3-8%%even:c1", cell_list([one_cell(3, 1), one_cell(5, 1), one_cell(7, 1)])],
    "skip odd relative": ["r3-8%%odd:c1", cell_list([one_cell(4, 1), one_cell(6, 1), one_cell(8, 1)])],
    "skip by 3 relative": ["r3-8%%3:c1", cell_list([one_cell(3, 1), one_cell(6, 1)])],
    // ----------
  })

  let name: keyof typeof TESTS & string
  for (name in TESTS) {
    let [input, expected] = TESTS[name]
    test(`${name}  ("${input}")`, () => {
      test_one_row(input, expected)
    })
  }
})

describe("$tr / $thisrow degenerate cases", () => {
  test("$tr in a row spec throws", () => {
    const src = new StringScanner("r$tr]")
    const result = parse_selector(src)
    expect(() => Array.from(result.cells(TABLE))).toThrow(/has no meaning in a row spec or inside a span selector/)
  })

  test("$tr combined with span throws", () => {
    const src = new StringScanner("c$tr]")
    const result = parse_selector(src)
    expect(() => Array.from(result.rectangles(TABLE))).toThrow(/has no meaning in a row spec or inside a span selector/)
  })
})






for (let r = 0; r < ROWS; r++) {
  const row_data = []
  for (let c = 0; c < COLS; c++) {
    row_data.push(new Cell(`[${r},${c}]`))
  }
  TABLE.add_row(new Row(row_data))
}

type C = [row: number, col: number]
type CellRange = [from: C, to: C]


function one_cell(r: number, c: number): CellRange {
  return [[r, c], [r, c]]
}
function c(row: number, col: number): C {
  return [row, col]
}

function gen_range(range: CellRange): CellCoords[] {
  const result: CellCoords[] = []
  const [fr, fc] = range[0]
  const [tr, tc] = range[1]
  for (let r = fr; r <= tr; r++) {
    for (let c = fc; c <= tc; c++) {
      result.push({ row: r, col: c })
    }
  }
  return result
}


function cell_list(ranges: CellRange[]): CellCoords[] {
  const result = new Set<CellCoords>()

  for (let range of ranges) {
    for (let ca of gen_range(range)) {
      result.add(ca)
    }
  }
  return Array.from(result.keys())
}

type TestSpec = [string, CellCoords[]]
interface TestCases {
  [id: string]: TestSpec
}


function test_one_row(input_string: string, expected: CellCoords[]) {
  const src = new StringScanner(input_string + "]")
  const result = parse_selector(src)
  expect(result).toBeInstanceOf(Selector)

  const cells = Array.from(result.cells(TABLE))
  // console.log("got", cells)
  // console.log("expected", expected)
  expect(cells).toEqual(expected)
}



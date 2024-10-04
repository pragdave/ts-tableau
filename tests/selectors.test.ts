import {describe, test, expect} from "bun:test"
import {Cell}  from "../src/cell"
import {TableData}  from "../src/table_data"
import {parse}  from "../src/parser.mjs"

const ROWS = 3
const COLS = 5

const TABLE = new TableData()

for (let r = 0; r < ROWS; r++) {
  let row: Cell[] = []
  for (let c = 0; c < COLS; c++) {
    row.push(new Cell(`r${r+1}:c${c+1}`))
  }
  TABLE.add_row(row)
}

//////////////////////
// support
function ps(input_string: string): CellsSelector {
  return parse(input_string, { startRule: "cells_selector" })
}

function* range(from: int, to: int) {
  for (let i = from; i <= to; i++) {
    yield i
  }
}

function cs(rows, cols) {
  let result: int[][] = []

  for (const r of rows) {
    for (const c of cols) {
      result.append([r,c])
    }
  }
  return result
}


//////////////////
//// tests
//
describe('cell selectors', () => {

  //   test("all rows", () => {
  //     const result = ps("r*")
  //     expect(result).toEqual(99)
  //   //   sel = result[1].row[1]
  //   })

  test("single cell", () => {
    const result = ps("r4:c3")
    console.log(result)
    console.log(result.cells)
    console.log(result.cells())

    expect(result.cells(TABLE)).toEqual(cs(range(4), range(1, COLS)))
  //   sel = result[1].row[1]
  })
  //   test.equal(1, sel.n1())
  //   test.equal(ROWS, sel.n2())
  //
  // test.simple["r4"] = () ->
  //   result = ps(ast, "r4")
  //   sel = result[1].row[1]
  //   test.equal(4, sel.n1())
  //   test.equal(4, sel.n2())
  //
  // test.simple["r4-8"] = () ->
  //   result = ps(ast, "r4-8")
  //   sel = result[1].row[1]
  //   test.equal(4, sel.n1())
  //   test.equal(8, sel.n2())
  //
  // test.simple["all cols"] = () ->
  //   result = ps(ast, "c")
  //   sel = result[1].col[1]
  //   test.equal(1, sel.n1())
  //   test.equal(COLS, sel.n2())
  //
  // test.simple["c4"] = () ->
  //   result = ps(ast, "c4")
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1())
  //   test.equal(4, sel.n2())
  //
  // test.simple["c4-8"] = () ->
  //   result = ps(ast, "c4-8")
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1())
  //   test.equal(8, sel.n2())
  //
  // test.simple["c4,6,8"] = () ->
  //   result = ps(ast, "c4,6,8")
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1())
  //   test.equal(4, sel.n2())
  //   sel = result[1].col[2]
  //   test.equal(6, sel.n1())
  //   test.equal(6, sel.n2())
  //   sel = result[1].col[3]
  //   test.equal(8, sel.n1())
  //   test.equal(8, sel.n2())
  //
  // test.simple["c4,6-8,10"] = () ->
  //   result = ps(ast, "c4,6-8,10")
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1())
  //   test.equal(4, sel.n2())
  //   sel = result[1].col[2]
  //   test.equal(6, sel.n1())
  //   test.equal(8, sel.n2())
  //   sel = result[1].col[3]
  //   test.equal(10, sel.n1())
  //   test.equal(10, sel.n2())
  //
  // test.product["r3:c4"] = () ->
  //   result = ps(ast, "r3:c4")
  //   sel = result[1].row[1]
  //   test.equal(3, sel.n1())
  //   test.equal(3, sel.n2())
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1())
  //   test.equal(4, sel.n2())
  //
  // test.product["r3-5:c4-8"] = () ->
  //   result = ps(ast, "r3-5:c4-8")
  //   sel = result[1].row[1]
  //   test.equal(3, sel.n1())
  //   test.equal(5, sel.n2())
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1())
  //   test.equal(8, sel.n2())
  //
  // ----------
  //
  // --  /n   absolute
  // --  \n   relative
  // --
  // --  r3-8/even  -> 2, 4, 6, 8  ( absolute = n)
  // --  r3-8\even  -> 3, 5, 7     (relative =  n-start)
  //         -- dump({ absolute: current, relative: current - n1})
  //
  // pos = (current, start) ->
  //   { absolute: current, relative: current - start }
  //
  // test.skips["r3-8/even"] = () ->
  //   result = ps(ast, "r3-8/even")
  //   sel = result[1].row[1]
  //   test.equal(3, sel.n1())
  //   test.equal(8, sel.n2())
  //   skip = sel.skip
  //   for r = 3, 8
  //     test.equal skip(pos(r, 3)), (r % 2) == 0
  //
  // test.skips["r3-8/odd"] = () ->
  //   result = ps(ast, "r3-8/odd")
  //   sel = result[1].row[1]
  //   test.equal(3, sel.n1())
  //   test.equal(8, sel.n2())
  //   skip = sel.skip
  //   for r = 3, 8
  //     test.equal skip(pos(r,3)), (r % 2) == 1
  //
  // test.skips["r3-8/3"] = () ->
  //   result = ps(ast, "r3-8/3")
  //   sel = result[1].row[1]
  //   test.equal(3, sel.n1())
  //   test.equal(8, sel.n2())
  //   skip = sel.skip
  //   for r = 3, 8
  //     position = pos(r, 3)
  //     test.equal skip(position), (position.relative % 3) == 0
  //
  // test.skips["r3-8\\3"] = () ->
  //   result = ps(ast, "r3-8\\3")
  //   sel = result[1].row[1]
  //   test.equal(3, sel.n1())
  //   test.equal(8, sel.n2())
  //   skip = sel.skip
  //   for r = 3, 8
  //     absolute = r
  //     relative = r - 2
  //     position = pos(r, 3)
  //     test.equal skip(position), (position.absolute % 3) == 0
  //
  //
  // test.last["r$r"] = () ->
  //   result = ps(ast, "r$r")
  //   sel = result[1].row[1]
  //   test.equal(ROWS, sel.n1())
  //   test.equal(ROWS, sel.n2())
  //
  // test.last["r$c"] = () ->
  //   result = ps(ast, "r$c")
  //   sel = result[1].row[1]
  //   test.equal(COLS, sel.n1())
  //   test.equal(COLS, sel.n2())
  //
  // test.last["r$r~1"] = () ->
  //   result = ps(ast, "r$r~1")
  //   sel = result[1].row[1]
  //   test.equal(ROWS-1, sel.n1())
  //   test.equal(ROWS-1, sel.n2())
  //
  // test.last["r$c+2"] = () ->
  //   result = ps(ast, "r$c+2")
  //   sel = result[1].row[1]
  //   test.equal(COLS+2, sel.n1())
  //   test.equal(COLS+2, sel.n2())
  //
  // test.current["c@r"] = () ->
  //   here = { row: 4, col: 7 }
  //   result = ps(ast, "c@r")
  //   sel = result[1].col[1]
  //   test.equal(4, sel.n1(here))
  //   test.equal(4, sel.n2(here))
  //
  // test.current["c@r~2"] = () ->
  //   here = { row: 4, col: 7 }
  //   result = ps(ast, "c@r~2")
  //   sel = result[1].col[1]
  //   test.equal(2, sel.n1(here))
  //   test.equal(2, sel.n2(here))


})



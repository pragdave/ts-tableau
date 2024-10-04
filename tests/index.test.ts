import {parse}  from "../src/parser.mjs"
import {Row}    from "../src/Row"
import {SRow}   from "../src/selectors/s_row"
import {Format, FComment } from "../src/format"

import {describe, test, expect} from "bun:test"

  // function testCell(cell, content) {
  //   expect(cell.content).toBe(content)
  // }
  //


// mocks

  describe('format row parser', () => {
    const FORMAT_TESTS = {
      "ignore comment row": [ "#comment", new FComment("comment") ],
      "ignore empty row":   [ "",         new FComment("") ],
    }
  //
    for (let name in FORMAT_TESTS) {
      let [ input, expected ] = FORMAT_TESTS[name]
      test(name, () => {
        testFormatRow(input, expected)
      })
    }
  })
  //
  function testFormatRow(input_string: string, expected: Format) {
    const result = parse(input_string, { startRule: "format_row" })
    expect(result).toEqual(expected)
  }


describe('data row parser', () => {
  const ROW_TESTS =   {
    "should handle =empty row":         [ "=empty",   []],
    "should handle two simple columns": [ "|a|b|",    [ "a", "b" ]],
    "should allow missing leading |":   [ "a|b|",     [ "a", "b" ]],
    "should allow missing trailing |":  [ "|a|b",     [ "a", "b" ]],
    "should allow no outside |":        [ "a|b",      [ "a", "b" ]],
    "should handle an empty column 1":  [ "|a||b|",   [ "a", "", "b" ]],
    "should handle an empty column 2":  [ "|a| |b|",  [ "a", "", "b" ]],
    "should handle an empty column 3":  [ "a| |b|",   [ "a", "", "b" ]],
    "should ignore | in math":          [ "|a$b|c$d|c|", [ "a$b|c$d", "c"]],
    "should ignore | in inline code":   [ "|a`b|c`d|c|", [ "a`b|c`d", "c"]],
    "backslash escapes |":              [ "|ab\\|cd|c|", [ "ab|cd", "c"]],
    "backslash ignoed before regular":  [ "|a\\b\\|cd|c|", [ "ab|cd", "c"]],
  }
  for (let name in ROW_TESTS) {
    let [ input, expected ] = ROW_TESTS[name]
    test(name, () => {
      testDataRow(input, expected)
    })
  }
})

function testDataRow(input_string: string, cell_content: string[]) {
  const result = parse(input_string, { startRule: "data_row" })
  expect(result).toBeInstanceOf(Row);
  expect(result.content.length).toBe(cell_content.length);
  cell_content.forEach((content, i) => {
    expect(result.content[i].content).toBe(content)
  })
}



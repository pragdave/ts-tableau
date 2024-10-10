import { parse_data_row } from "../src/parser/parse_data_row"
import { Row } from "../src/row"

test("empty row", () => {
  ['=empty', '  =empty', '=empty  ', '  =empty  '].forEach((line) => test_one_row(line, [], true))
})


type TestSpec = [string, string[]]
interface TestCases {
  [id: string]: TestSpec
}

describe('data_row_parse', () => {
  const TESTS: TestCases = ({
    "one empty column": ["||", [""]],
    "one empty column with space": ["| |", [""]],
    "one column with content": ["|a|", ["a"]],
    "one column with content and spaces": ["| a |", ["a "]],
    "one column no terminator": ["|a", ["a"]],
    "one column,spaces, no terminator": ["| a ", ["a "]],
    "one column,spaces, no terminators": [" a ", ["a "]],
    "two simple columns": ["|a|b|", ["a", "b"]],
    "two simple columns, no terminators": ["a|b", ["a", "b"]],
    "empty column, no spaces": ["|a||b|", ["a", "", "b"]],
    "empty column, spaces": ["|a|  |b|", ["a", "", "b"]],
    "empty column, spaces, no terminator": ["a|  |b", ["a", "", "b"]],
    "ignores | in math": ["|a$b|c$d|c|", ["a$b|c$d", "c"]],
    "ignores | in inline code": ["|a`b|c`d|c|", ["a`b|c`d", "c"]],
    "backslash escapes |": ["|ab\\|cd|c|", ["ab|cd", "c"]],
    "backslash ignored before regular": ["|a\\b\\|cd|c|", ["ab|cd", "c"]],
  })

  let name: keyof typeof TESTS & string
  for (name in TESTS) {
    let [input, expected] = TESTS[name]
    test(`${name}  ("${input}")`, () => {
      test_one_row(input, expected)
    })
  }
})

function test_one_row(input_string: string, cell_content: string[], is_empty = false) {
  const result = parse_data_row(input_string)
  expect(result).toBeInstanceOf(Row);
  expect(result.content.length).toBe(cell_content.length);
  cell_content.forEach((content, i) => {
    expect(result.content[i].content).toBe(content)
  })
  expect(result.is_empty).toBe(is_empty)
}



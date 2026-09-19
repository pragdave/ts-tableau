import { StringScanner } from "strscan-ts"
import { parse_global_formats, parse_selector_formats } from "../src/parser/parse_formats"
import { FormatClass } from "../src/formats"

function global_fmt(spec: string) { return parse_global_formats(new StringScanner(spec)) }
function cell_fmt(spec: string) { return parse_selector_formats(new StringScanner(spec)) }

describe("colors are rejected when they are not colors", () => {
  test("an unknown color name is rejected", () => {
    expect(() => cell_fmt("bg(warning)")).toThrow(/expecting a color/)
  })

  test("a shade above shade9 is not a shade", () => {
    expect(() => cell_fmt("bg(shade10)")).toThrow()
  })

  test("shade0 is not a shade", () => {
    expect(() => cell_fmt("bg(shade0)")).toThrow()
  })

  test("a missing closing parenthesis is reported", () => {
    expect(() => cell_fmt("bg(crimson")).toThrow(/expecting '\)'/)
  })

  test("a bare color with no bg() is not a format", () => {
    expect(() => cell_fmt("shade2")).toThrow(/unrecognized format/)
  })

  test("a bare hex value with no bg() is not a format", () => {
    expect(() => cell_fmt("#f00")).toThrow(/unrecognized format/)
  })
})

describe("width rejects values it cannot classify", () => {
  test("zero is rejected", () => {
    expect(() => cell_fmt("width(0)")).toThrow(/expects a float/)
  })

  test("a ratio above 1.0 is rejected", () => {
    expect(() => cell_fmt("width(1.5)")).toThrow(/expects a float/)
  })

  test("a non-numeric width is rejected", () => {
    expect(() => cell_fmt("width(wide)")).toThrow(/expects a float/)
  })
})

describe("class() is a synonym for style()", () => {
  test("class(name) parses", () => {
    const result = cell_fmt("class(warning)")[0]
    expect(result).toBeInstanceOf(FormatClass)
    expect((result as FormatClass).name).toBe("warning")
  })

  test("class(.name) tolerates the leading dot", () => {
    expect((cell_fmt("class(.warning)")[0] as FormatClass).name).toBe("warning")
  })
})

// The table at the top of parse_formats.ts is the only statement of which
// formats belong where; nothing enforced it.
describe("formats are rejected in the wrong context", () => {
  for (const spec of ["header", "head", "footer", "foot", "span", "lines(t)"]) {
    test(`${spec} is not a table-level format`, () => {
      expect(() => global_fmt(spec)).toThrow(/unrecognized format/)
    })
  }

  for (const spec of ["boxed", "box", "hlines", "hline", "vlines", "vline"]) {
    test(`${spec} is not a cell-level format`, () => {
      expect(() => cell_fmt(spec)).toThrow(/unrecognized format/)
    })
  }
})

import { StringScanner } from "strscan-ts"
import { split_number } from "../src/decimal"
import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"
import { parse_global_formats, parse_selector_formats } from "../src/parser/parse_formats"
import { FormatDecimal } from "../src/formats"

function html_for(lines: string[]) {
  return generate(tableau(lines))
}

describe("split_number", () => {
  test.each([
    ["1234.5", "1234", ".5"],
    ["42", "42", ""],
    [".5", "", ".5"],
    ["1.", "1", "."],
    ["-3.25", "-3", ".25"],
    ["−3.25", "−3", ".25"],
    ["(12.50)", "(12", ".50)"],
    ["7.25%", "7", ".25%"],
    ["3.14†", "3", ".14†"],
    ["$1,234.56", "$1,234", ".56"],
    ["1 234.5", "1 234", ".5"],
    [" 2.5 ", "2", ".5"],
  ])("%j splits at the point", (content, whole, fraction) => {
    expect(split_number(content, ".")).toEqual({ whole, fraction })
  })

  test.each(["", "n/a", "-", "**12.5**", "12 apples", "1.2.3", "_7_"])(
    "%j is not a plain number", (content) => {
      expect(split_number(content, ".")).toBeNull()
    })

  test("with a comma mark, points group the thousands", () => {
    expect(split_number("1.234,5", ",")).toEqual({ whole: "1.234", fraction: ",5" })
    expect(split_number("1,234.5", ",")).toBeNull()
  })
})

describe("decimal()", () => {
  test("sets the mark for the table", () => {
    expect(parse_global_formats(new StringScanner("decimal(,)"))).toEqual([new FormatDecimal(",")])
    expect(parse_global_formats(new StringScanner("decimal( . )"))).toEqual([new FormatDecimal(".")])
  })

  test("rejects other marks", () => {
    expect(() => parse_global_formats(new StringScanner("decimal(;)"))).toThrow(/expects '.' or ','/)
  })

  test("is not a cell format", () => {
    expect(() => parse_selector_formats(new StringScanner("decimal(,)"))).toThrow(/unrecognized format/)
  })
})

describe("align(d)", () => {
  test("splits numbers and sizes the fraction box to the column's widest", () => {
    expect(html_for([
      "2.5 | x",
      "12.75 | y",
      "42 | z",
      "===",
      "[c1] d",
    ])).toEqual([
      `<table class="tableau halign-c valign-m">`,
      `<tr><td class="halign-d valign-m tb-num" style="--tb-frac: 3">2<span class="tb-frac">.5</span></td><td><tableau-md>x</tableau-md></td></tr>`,
      `<tr><td class="halign-d valign-m tb-num" style="--tb-frac: 3">12<span class="tb-frac">.75</span></td><td><tableau-md>y</tableau-md></td></tr>`,
      `<tr><td class="halign-d valign-m tb-num" style="--tb-frac: 3">42<span class="tb-frac"></span></td><td><tableau-md>z</tableau-md></td></tr>`,
      "</table>",
    ])
  })

  test("keeps the Markdown of a cell that isn't a plain number", () => {
    expect(html_for([
      "2.5",
      "**n/a**",
      "===",
      "[c1] d",
    ])).toEqual([
      `<table class="tableau halign-c valign-m">`,
      `<tr><td class="halign-d valign-m tb-num" style="--tb-frac: 2">2<span class="tb-frac">.5</span></td></tr>`,
      `<tr><td class="halign-d valign-m tb-nonnum" style="--tb-frac: 2"><tableau-md>**n/a**</tableau-md></td></tr>`,
      "</table>",
    ])
  })

  test("each column gets its own width", () => {
    const html = html_for([
      "1.5 | 1.125",
      "===",
      "[c1-2] d",
    ])
    expect(html[1]).toContain(`style="--tb-frac: 2">1<span`)
    expect(html[1]).toContain(`style="--tb-frac: 4">1<span`)
  })

  test("table-wide d applies to body cells but not headers", () => {
    expect(html_for([
      "Price",
      "2.5",
      "===",
      "d",
      "[r1] header",
    ])).toEqual([
      `<table class="tableau halign-d valign-m">`,
      `<tr><th class="tb-header"><tableau-md>Price</tableau-md></th></tr>`,
      `<tr><td class="tb-num" style="--tb-frac: 2">2<span class="tb-frac">.5</span></td></tr>`,
      "</table>",
    ])
  })

  test("a cell's own alignment overrides table-wide d", () => {
    expect(html_for([
      "2.5",
      "===",
      "d",
      "[r1] r",
    ])[1]).toBe(`<tr><td class="halign-r valign-m"><tableau-md>2.5</tableau-md></td></tr>`)
  })

  test("uses the table's decimal mark", () => {
    expect(html_for([
      "1.234,5",
      "===",
      "decimal(,)",
      "[r1] d",
    ])[1]).toBe(`<tr><td class="halign-d valign-m tb-num" style="--tb-frac: 2">1.234<span class="tb-frac">,5</span></td></tr>`)
  })

  test("a cell spanning columns is not split", () => {
    expect(html_for([
      "1.5||",
      "2.25|3|",
      "===",
      "[r1:c1-2] span",
      "[c1] d",
    ])).toEqual([
      `<table class="tableau halign-c valign-m">`,
      `<tr><td colspan="2" class="halign-d valign-m"><tableau-md>1.5</tableau-md></td></tr>`,
      `<tr><td class="halign-d valign-m tb-num" style="--tb-frac: 3">2<span class="tb-frac">.25</span></td><td><tableau-md>3</tableau-md></td></tr>`,
      "</table>",
    ])
  })
})

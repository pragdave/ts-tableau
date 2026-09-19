import { StringScanner } from "strscan-ts"
import {
  Formats,
  FormatAlign,
  FormatBg,
  FormatBoxed,
  FormatClass,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatLines,
  FormatSpan,
  FormatVlines,
  FormatWidth,
  CssColor,
  RGBColor,
  ShadeColor,
  ColorRepresentations,
} from "../src/formats"

import { parse_global_formats, parse_selector_formats } from "../src/parser/parse_formats"

type ParseFunction = ((src: StringScanner) => Formats[])

//////////////////////////////////////////////////////////////// lines 

function align_test(parser: ParseFunction, format: string, halign: string, valign: string) {
  test("align: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatAlign)
    expect((result as FormatAlign).halign).toBe(halign)
    expect((result as FormatAlign).valign).toBe(valign)
  })
}

function wrap_align_test(parser: ParseFunction, format: string, halign: string, valign: string) {
  align_test(parser, format, halign, valign)
  align_test(parser, `align(${format})`, halign, valign)
}
function test_align(parser: ParseFunction) {
  [
    ["c", "c", "m"],
    ["l", "l", "m"],
    ["r", "r", "m"],
    ["j", "j", "m"],
    ["t", "c", "t"],
    ["m", "c", "m"],
    ["b", "c", "b"],
    ["lt", "l", "t"],
    ["jb", "j", "b"],
  ].forEach(([spec, h, v]) => {
    wrap_align_test(parser, spec, h, v)
  })
}

//////////////////////////////////////////////////////////////// lines 

function line_test(parser: ParseFunction, format: string, expected: number) {
  test("line: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatLines)
    expect((result as FormatLines).flags).toBe(expected)
  })
}

function wrap_line_test(parser: ParseFunction, format: string, expected: number) {
  // line_test(parser, format, expected)
  line_test(parser, `line(${format})`, expected)
}

function test_format_lines(parser: ParseFunction) {
  const F = FormatLines
  wrap_line_test(parser, "t", F.T)
  wrap_line_test(parser, "b", F.B)
  wrap_line_test(parser, "l", F.L)
  wrap_line_test(parser, "r", F.R)
  wrap_line_test(parser, "x", F.X)
  wrap_line_test(parser, "tb", F.T | F.B)
  wrap_line_test(parser, "bt", F.T | F.B)
  wrap_line_test(parser, "tbl", F.T | F.B | F.L)
  wrap_line_test(parser, "tblr", F.T | F.B | F.L | F.R)
  wrap_line_test(parser, "br", F.B | F.R)
}

//////////////////////////////////////////////////////////////// lines 

function bg_test(parser: ParseFunction, format: string, expected: FormatBg) {
  test("line: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatBg)
    expect(result).toEqual(expected)
  })
}

function wrap_bg_test(parser: ParseFunction, format: string, expected: ColorRepresentations) {
  // line_test(parser, format, expected)
  bg_test(parser, format, new FormatBg(expected))
}

function test_bg(parser: ParseFunction) {
  wrap_bg_test(parser, "bg(#123)", new RGBColor(1 * 17, 2 * 17, 3 * 17))
  wrap_bg_test(parser, "bg(#12a9ec)", new RGBColor(0x12, 0xa9, 0xec))
  for (let n = 1; n <= 9; n++) {
    let shade = `shade${n}`
    wrap_bg_test(parser, `bg(${shade})`, new ShadeColor(shade))
  }
  [
    "aliceblue", "blueviolet", "crimson", "darkolivegreen", "DarkTurquoise", "forestgreen",
    "hotpink", "lightcoral", "lightskyblue", "mediumaquamarine", "MEDIUMTURQUOISE", "oldlace",
    "palevioletred", "royalblue", "slateblue", "violet",
  ].forEach((css: string) => wrap_bg_test(parser, `bg(${css})`, new CssColor(css)))
}

//
//////////////////////////////////////////////////////////////// lines 

function other_test(parser: ParseFunction, format: string, expectedClass: any) {
  test(format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(expectedClass)

  })
}

function test_boxed(parser: ParseFunction) {
  other_test(parser, "boxed", FormatBoxed)
  other_test(parser, "box", FormatBoxed)
}

function test_footer(parser: ParseFunction) {
  other_test(parser, "footer", FormatFooter)
  other_test(parser, "foot", FormatFooter)
}

function test_header(parser: ParseFunction) {
  other_test(parser, "header", FormatHeader)
  other_test(parser, "head", FormatHeader)
}

function test_hlines(parser: ParseFunction) {
  other_test(parser, "hlines", FormatHlines)
  other_test(parser, "hline", FormatHlines)
}

function test_span(parser: ParseFunction) {
  other_test(parser, "span", FormatSpan)
}

function test_vlines(parser: ParseFunction) {
  other_test(parser, "vlines", FormatVlines)
  other_test(parser, "vline", FormatVlines)
}
//////////////////////////////////////////////////////////////// lines 

function fg_test(parser: ParseFunction, format: string, expected: FormatFg) {
  test("line: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatFg)
    expect(result).toEqual(expected)
  })
}

function wrap_fg_test(parser: ParseFunction, format: string, expected: ColorRepresentations) {
  fg_test(parser, format, new FormatFg(expected))
}

function test_fg(parser: ParseFunction) {
  wrap_fg_test(parser, "fg(#123)", new RGBColor(1 * 17, 2 * 17, 3 * 17))
  wrap_fg_test(parser, "fg(#12a9ec)", new RGBColor(0x12, 0xa9, 0xec))
  for (let n = 1; n <= 9; n++) {
    let shade = `shade${n}`
    wrap_fg_test(parser, `fg(${shade})`, new ShadeColor(shade))
  }
  [
    "aliceblue", "blueviolet", "crimson", "darkolivegreen", "DarkTurquoise", "forestgreen",
    "hotpink", "lightcoral", "lightskyblue", "mediumaquamarine", "MEDIUMTURQUOISE", "oldlace",
    "palevioletred", "royalblue", "slateblue", "violet",
  ].forEach((css: string) => wrap_fg_test(parser, `fg(${css})`, new CssColor(css)))
}
//////////////////////////////////////////////////////////////// lines 

function fontsize_test(parser: ParseFunction, format: string, expected: number) {
  test("fontsize: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatFontsize)
    expect((result as FormatFontsize).scale).toEqual(expected)
  })
}

function test_fontsize(parser: ParseFunction) {
  ([
    ["xxsmall", -3],
    ["xsmall", -2],
    ["small", -1],
    ["xxlarge", 3],
    ["xlarge", 2],
    ["large", 1],
    ["normal", 0],
  ] as Array<[string, number]>).forEach(([name, expected]) => {
    fontsize_test(parser, name, expected)
  })

}

//////////////////////////////////////////////////////////////// style

function style_test(parser: ParseFunction, format: string, expected: string) {
  test("style: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatClass)
    expect((result as FormatClass).name).toEqual(expected)
  })
}

function test_style(parser: ParseFunction) {
  ([
    ["style(wombat)", "wombat"],
    ["style(.wombat)", "wombat"],
    [".w0m-b_a_t", "w0m-b_a_t"],
  ] as Array<[string, string]>).forEach(([name, expected]) => {
    style_test(parser, name, expected)
  })

}
//
//////////////////////////////////////////////////////////////// style

function width_test(parser: ParseFunction, format: string, eValue: number, eType: string) {
  test("width: " + format, () => {
    const src = new StringScanner(format)
    const result = parser(src)[0]
    expect(result).not.toBeNull()
    expect(result).toBeInstanceOf(FormatWidth)
    expect((result as FormatWidth).width).toEqual(eValue)
    expect((result as FormatWidth).type).toEqual(eType)
  })
}

function wrap_width_test(parser: ParseFunction, format: string, eValue: number, eType: string) {
  width_test(parser, `w(${format})`, eValue, eType)
  width_test(parser, `width(${format})`, eValue, eType)
}

function test_width(parser: ParseFunction) {
  ([
    ["1.0", 1.0, "ratio"],
    ["1", 1, "chars"],
    ["12", 12, "chars"],
    ["0.1234", 0.1234, "ratio"],
    [".1234", 0.1234, "ratio"],

  ] as Array<[string, number, string]>).forEach(([format, eValue, eType]) => {
    wrap_width_test(parser, format, eValue, eType)
  })

}
//////////////////////////////////////////////////////////////// lines 

describe("formats after selector", () => {
  test_format_lines(parse_selector_formats),
    test_align(parse_selector_formats)
  test_bg(parse_selector_formats)
  test_fg(parse_selector_formats)
  test_fontsize(parse_global_formats)
  test_footer(parse_selector_formats)
  test_header(parse_selector_formats)
  test_span(parse_selector_formats)
  test_style(parse_selector_formats)
  test_width(parse_selector_formats)

})

describe("global formats", () => {
  test_align(parse_global_formats)
  test_bg(parse_global_formats)
  test_boxed(parse_global_formats)
  test_fg(parse_global_formats)
  test_fontsize(parse_global_formats)
  test_hlines(parse_global_formats)
  test_vlines(parse_global_formats)
  test_style(parse_global_formats)
  test_width(parse_global_formats)

})


//////////////////////////////////////////////////////////////// regression tests

describe("width() classifies its argument correctly", () => {
  function parsed_width(spec: string) {
    return parse_global_formats(new StringScanner(spec))[0] as FormatWidth
  }

  test("a three-digit integer is a character width, not a ratio", () => {
    const result = parsed_width("width(100)")
    expect(result.type).toBe("chars")
    expect(result.width).toBe(100)
  })

  test("an integer ending in 1-digit-0 is a character width", () => {
    const result = parsed_width("width(150)")
    expect(result.type).toBe("chars")
    expect(result.width).toBe(150)
  })

  test("a non-numeric argument is rejected", () => {
    expect(() => parsed_width("width(1x0)")).toThrow(/expects a float/)
  })
})

describe("unrecognized formats are reported cleanly", () => {
  test("a bare 'x' reports an unrecognized format", () => {
    expect(() => parse_selector_formats(new StringScanner("x")))
      .toThrow(/unrecognized format/)
  })

  test("an 'x' following a valid format reports an unrecognized format", () => {
    expect(() => parse_selector_formats(new StringScanner("footer x")))
      .toThrow(/unrecognized format/)
  })
})

describe("there is no implicit lines shorthand", () => {
  test("a bare line spec containing x is rejected, not read as lines", () => {
    expect(() => parse_selector_formats(new StringScanner("tbx")))
      .toThrow(/unrecognized format/)
  })
})

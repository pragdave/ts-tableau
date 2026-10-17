import { StringScanner } from "strscan-ts"
import {
  FormatAlign,
  FormatBg,
  FormatBoxed,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatLines,
  FormatSpan,
  FormatClass,
  FormatWidth,
  FormatVlines,


  ColorRepresentations,
  GenColorCss,
  GenColorHex,
  GenColorShade,

  HALIGN,
  VALIGN,

  SHADE_NAMES,
  CSS_NAMES,

  LINE_WEIGHTS,
  LINE_STYLES,
  ShadeColor,
} from "../formats"

import type { Formats, LineStyle, LineWeight, LineStyleName } from "../formats"

// --                              Global     Selector
// --     fg(color)                   Y          Y
// --     bg(color)                   Y          Y
// --     align([lcrj][tmb])          Y          Y
// --     width(n)                    Y          Y 
// --     lines(sides, line style)    N          Y
// --     style(a)                    Y          Y
// --     header                      N          Y
// --     footer                      N          Y
// --     small                       Y          Y
// --
// --     hlines(line style)          Y          N
// --     vlines(line style)          Y          N
// --     boxed(line style)           Y          N
// --
// --     a line style is any of a weight, a style, and a shade, e.g.
// --     line(b, shade4, dotted, thick)

export function parse_global_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null
  while (fmt = parse_global_format(src))
    result.push(fmt)
  if (!src.hasTerminated()) {
    throw new Error(`unrecognized format: ${src.peek(30)}`)
  }
  return result
}


function parse_global_format(src: StringScanner): Formats | null {
  src.skip(/\s+/)
  if (src.hasTerminated())
    return null

  return (
    align(src) ||
    bg(src) ||
    boxed(src) ||
    fclass(src) ||
    fg(src) ||
    font_size(src) ||
    hlines(src) ||
    vlines(src) ||
    width(src) ||
    null)
}

export function parse_selector_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null

  while (fmt = parse_selector_format(src)) {
    result.push(fmt)
  }
  if (!src.hasTerminated()) {
    throw new Error(`unrecognized format: ${src.peek(30)}`)
  }
  return result
}

// --------------------------------------------------------------------------------
function parse_selector_format(src: StringScanner): Formats | null {
  src.skip(/\s+/)
  if (src.hasTerminated())
    return null

  return (
    align(src) ||
    bg(src) ||
    fg(src) ||
    fclass(src) ||
    font_size(src) ||
    footer(src) ||
    header(src) ||
    span(src) ||
    width(src) ||
    lines(src)
  )
}

// --------------------------------------------------------------------------------
// color helper
const SHADE_RE = new RegExp(Array.from(SHADE_NAMES.keys()).join("|"))

function color(src: StringScanner): ColorRepresentations | null {
  if (src.scan(/#([0-9a-f]{3}([0-9a-f]{3})?)/)) {
    return GenColorHex(src.getCapture(0))
  }
  if (src.scan(SHADE_RE)) {
    return GenColorShade(src.getMatch())
  }
  if (src.scan(/[a-z]+/i) && CSS_NAMES.has(src.getMatch().toLowerCase())) {
    return GenColorCss(src.getMatch())
  }

  return null
}

// --------------------------------------------------------------------------------
// --     align([lcrj][tmb])   l c r j t m b
function align(src: StringScanner): FormatAlign | null {
  function align_helper(spec: string) {
    let sub = new StringScanner(spec)
    if (sub.scan(/([lcrj])?,?([tmb])?/)) {
      const h = (sub.getCapture(0) || "c") as HALIGN
      const v = (sub.getCapture(1) || "m") as VALIGN
      return new FormatAlign(h, v)
    }
    else {
      throw `Expecting alignment specifier ([lcrj][tmb]), got ${sub.peek(10)}`
    }

  }
  if (src.scan(/align\((.*?)\)/)) {
    return align_helper(src.getCapture(0))
  }
  else if (src.scan(/[lcrjtmb]+\b/)) {
    return align_helper(src.getMatch())
  }
  else {
    return null
  }
}

// --------------------------------------------------------------------------------
// --     bg/fg(color)
function bg_or_fg(src: StringScanner, match: RegExp): null | ColorRepresentations {
  if (!src.scan(match)) {
    return null
  }
  const result = color(src)
  if (!result)
    throw "expecting a color as an argument to bg()"

  if (!src.skip(/\s*\)/))
    throw `expecting ')' at end of bg color: got '${src.peek(10)}`

  return result
}

function bg(src: StringScanner): FormatBg | null {
  const color = bg_or_fg(src, /bg\(/)
  if (!color) {
    return null
  }
  return new FormatBg(color)
}

function fg(src: StringScanner): FormatBg | null {
  const color = bg_or_fg(src, /fg\(/)
  if (!color)
    return null
  return new FormatFg(color)
}

// --------------------------------------------------------------------------------
// --     boxed
function boxed(src: StringScanner): FormatBoxed | null {
  if (src.scan(/box(ed)?\b(?:\(([^)]*)\))?/))
    return new FormatBoxed(table_line_style(src.getCapture(1), "boxed()"));
  return null
}

// --------------------------------------------------------------------------------
// --     font_size: x{0,2}small | normal | x{0,2}large

function font_size(src: StringScanner): FormatFontsize | null {
  if (src.scan(/normal\b/))
    return new FormatFontsize(0)

  // Matched as a single unit: scanning the "x" prefix separately meant a
  // non-match on the size word had to be undone with unscan(), which throws
  // when the preceding scan already failed (e.g. a bare "x").
  if (!src.scan(/(xx?)?(small|large|sm|lg)\b/))
    return null

  const scale = (src.getCapture(0) || "").length + 1
  const sign = src.getCapture(1)[0] == "s" ? -1 : 1

  return new FormatFontsize(sign * scale)
}


// --------------------------------------------------------------------------------
// --     footer & header
function footer(src: StringScanner): FormatFooter | null {
  if (src.scan(/foot(er)?\b/))
    return new FormatFooter();
  return null
}

function header(src: StringScanner): FormatHeader | null {
  if (src.scan(/head(er)?\b/))
    return new FormatHeader();
  return null
}

// --------------------------------------------------------------------------------
// --     hlines
// hlines = (text) ->
function hlines(src: StringScanner): FormatHlines | null {
  if (src.scan(/hlines?\b(?:\(([^)]*)\))?/))
    return new FormatHlines(table_line_style(src.getCapture(0), "hlines()"));
  return null
}

// --------------------------------------------------------------------------------
// --     lines(arg, ...): each arg is sides ([tblrx]+), a weight, a style, or a shade
function lines(src: StringScanner): FormatLines | null {
  if (!src.scan(/lines?\(([^)]*)\)/))
    return null
  const { sides, style } = line_args(src.getCapture(0), "line()")
  if (sides === "" && Object.keys(style).length === 0)
    throw new Error("line() needs at least one side or line style")
  return new FormatLines(sides, style)
}

function table_line_style(args: string | undefined, name: string): LineStyle {
  const { sides, style } = line_args(args ?? "", name)
  if (sides !== "")
    throw new Error(`${name} does not take sides: got '${sides}'`)
  return style
}

function line_args(args: string, name: string): { sides: string, style: LineStyle } {
  let sides = ""
  const style: LineStyle = {}

  function set_once<K extends keyof LineStyle>(key: K, value: LineStyle[K], arg: string) {
    if (style[key] !== undefined)
      throw new Error(`${name} has more than one ${key}: '${arg}'`)
    style[key] = value
  }

  for (const arg of args.split(/[\s,]+/).filter((a) => a !== "")) {
    if (/^[tblrx]+$/.test(arg))
      sides += arg
    else if ((LINE_WEIGHTS as readonly string[]).includes(arg))
      set_once("weight", arg as LineWeight, arg)
    else if ((LINE_STYLES as readonly string[]).includes(arg))
      set_once("style", arg as LineStyleName, arg)
    else if (SHADE_NAMES.has(arg))
      set_once("color", new ShadeColor(arg), arg)
    else
      throw new Error(`unrecognized ${name} argument: '${arg}'`)
  }
  return { sides, style }
}

// --------------------------------------------------------------------------------
// --     span
function span(src: StringScanner): FormatSpan | null {
  if (src.scan(/span/))
    return new FormatSpan();
  return null
}

// --------------------------------------------------------------------------------
// --     class = .name | class(name)

function fclass(src: StringScanner): FormatClass | null {
  if (src.scan(/(?:style|class)\(\s*\.?([-a-zA-Z0-9_]+)\s*\)/)) {
    return new FormatClass(src.getCapture(0))
  }

  if (src.scan(/\.([-a-zA-Z0-9_]+)\b/)) {
    return new FormatClass(src.getCapture(0))
  }

  return null
}

// --------------------------------------------------------------------------------
// --     vlines
function vlines(src: StringScanner): FormatVlines | null {
  if (src.scan(/vlines?\b(?:\(([^)]*)\))?/))
    return new FormatVlines(table_line_style(src.getCapture(0), "vlines()"));
  return null
}

// --------------------------------------------------------------------------------
// --     width(n)
function width(src: StringScanner): FormatWidth | null {
  if (!src.scan(/w(idth)?\((.*?)\)/))
    return null
  let w = src.getCapture(1)
  switch (true) {
    case /^(0?\.[0-9]+|1\.0)$/.test(w):
      return new FormatWidth(parseFloat(w), "ratio")
    case /^[1-9][0-9]*$/.test(w):
      return new FormatWidth(parseInt(w), "chars")
    default:
      throw `width() expects a float <= 1 or a positive int. Got ${w}`
  }
}

// width = (text) ->
//   spec = nil
//   if text\scan("width%(")
//     spec = expect(width, text, "expecting an integer width")
//     text\expect("%)", "expected closing parenthesis after width")
//   else
//     if text\scan("0?%.[1-9][0-9]*") or text\scan("[1-9][0-9]*") 
//
//       wid = text.last_match |> tonumber 
//       if text\scan("%%")
//         wid = wid / 100.0
//       spec = { type: "width", spec: wid }
//   spec
//
//
//

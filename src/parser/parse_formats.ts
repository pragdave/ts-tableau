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
} from "../formats"

import type { Formats } from "../formats"

// --                              Global     Selector
// --     fg(color)                   Y          Y
// --     bg(color)                   Y          Y
// --     align([lcrj][tmb])          Y          Y
// --     width(n)                    Y          Y 
// --     lines([ []_~ ]+)            N          Y 
// --     style(a,b,c)                Y          Y
// --     header                      N          Y
// --     footer                      N          Y
// --     small                       Y          Y
// --
// --     hlines                      Y          N
// --     vlines                      Y          N
// --     boxed                       Y          N

function log(src: StringScanner) {
  console.log("No match", src.peek(10))
  return false
}
export function parse_global_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null
  while (fmt = parse_global_format(src))
    result.push(fmt)
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
    log(src) ||
    null)
}

export function parse_selector_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null

  while (fmt = parse_selector_format(src)) {
    console.error("fmt", fmt)
    result.push(fmt)
  }
  if (!src.hasTerminated) {
    throw `unrecognized format: ${src.peek(30)}`
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
    lines(src)      // lines must go at the end, because it swallows single characters
  )
}

// --------------------------------------------------------------------------------
// color helper
const SHADE_RE = new RegExp(Array.from(SHADE_NAMES.keys()).join("|"))

function color(src: StringScanner): ColorRepresentations | null {
  console.error("color ", src.peek(20))
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
  if (src.scan(/box(ed)?\b/))
    return new FormatBoxed();
  return null
}

// --------------------------------------------------------------------------------
// --     font_size: x{0,2}small | normal | x{0,2}large

function font_size(src: StringScanner): FormatFontsize | null {
  let scale = 1
  if (src.scan(/normal\b/))
    return new FormatFontsize(0)

  if (src.scan(/xx?/))
    scale = src.getMatch().length + 1

  if (!src.scan(/(small|large|sm|lg)\b/)) {
    if (scale != 1)
      src.unscan()
    return null
  }

  let sign = 1;
  if (src.getMatch()[0] == "s")
    sign = -1;

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
  if (src.scan(/hlines?\b/))
    return new FormatHlines();
  return null
}

// --------------------------------------------------------------------------------
// --     lines([tblrx]+) 
function lines(src: StringScanner): FormatLines | null {
  if (src.scan(/lines?\(([tbrlx]+)\)/)) {
    return new FormatLines(src.getCapture(0))
  }
  else if (src.scan(/([tbrlx]+)/)) {
    return new FormatLines(src.getCapture(0))
  }
  else {
    return null
  }
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
  if (src.scan(/vlines?\b/))
    return new FormatVlines();
  return null
}

// --------------------------------------------------------------------------------
// --     width(n)
function width(src: StringScanner): FormatWidth | null {
  if (!src.scan(/w(idth)?\((.*?)\)/))
    return null
  let w = src.getCapture(1)
  switch (true) {
    case /^(0?\.[0-9]+)|(1.0)$/.test(w):
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

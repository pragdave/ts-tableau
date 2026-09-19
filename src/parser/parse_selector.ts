import { StringScanner } from "strscan-ts"
import {
  Selector,
  SelAdjustedNumber,
  SelCol,
  SelNumber,
  SelNumberInt,
  SelNumberLastRow,
  SelNumberLastCol,
  SelNumberThisRow,
  SelNumberGenerator,
  SelRow,
  SelRowCol,
  SelNoSkip,
  SelSkip,
  SelTerm,

  RelOrAbs,
} from "../selectors"

// selector = term (';' term)*
// the opening '[' has already been consumed
export function parse_selector(src: StringScanner) {
  const terms: SelTerm[] = []

  do {
    terms.push(parse_term(src))
  } while (src.scan(/\s*;\s*/))

  if (!src.scan(/]\s*/)) {
    throw `Missing ']' at end of selector (I see '${src.peek(20)}'`
  }
  return new Selector(terms)
}

// -- term = row_selector : col_selector | row_selector | col_selector

function parse_term(src: StringScanner): SelTerm {
  let col: SelRow | null = null
  let row = parse_row_spec(src)
  if (row) {
    if (src.scan(/:/)) {
      col = parse_col_spec(src)
      if (!col) {
        throw "expected column select after ':'"
      }
    }
  }
  else
    col = parse_col_spec(src)

  if (!row && !col)
    throw "expected row spec, col spec, or row spec:col spec"
  return new SelTerm(row, col)
}

function parse_col_spec(src: StringScanner): SelCol | null {
  return parse_row_and_col_spec(src, /c/, SelCol)

}
function parse_row_spec(src: StringScanner): SelRow | null {
  return parse_row_and_col_spec(src, /r/, SelRow)
}

function parse_row_and_col_spec(src: StringScanner, prefix: RegExp, creator: typeof SelRowCol): SelRowCol | null {
  if (src.scan(prefix)) {
    return new creator(number_lists(src))
  }
  return null
}

// number_lists
//   = number_lists ("," number_list)*

export function number_lists(src: StringScanner) {
  const list: SelNumberGenerator[] = []

  do {
    list.push(number_list(src))
  } while (src.skip(/\s*,\s*/))
  return list
}

// number_list
//   = adjusted_number ("-" n2:adjusted_number) skip? 
export function number_list(src: StringScanner): SelNumberGenerator {
  let n1: SelAdjustedNumber
  let n2: SelAdjustedNumber | null = null

  let skip = SelNoSkip

  n1 = adjusted_number(src)
  if (src.scan(/-/)) {
    n2 = adjusted_number(src)
    skip = maybe_skip(src)
  }
  else if (src.check(/\s*%/)) {
    throw `a skip ('%' or '%%') can only be applied to a range (I see '${src.peek(20)}')`
  }
  return new SelNumberGenerator(n1, n2 || n1, skip)
}


// adjusted_number
//   = number "~" int
//   / number "+" int
//   / number

function adjusted_number(src: StringScanner): SelAdjustedNumber {

  let n = number(src)
  let op = src.scan(/\s*([+~]\s*)/)
  if (op) {
    const sign = (op == "+") ? 1 : -1
    let offset = int(src)
    return new SelAdjustedNumber(n, offset * sign)
  }
  else {
    return new SelAdjustedNumber(n, 0)
  }
}

// skip
//   = rel_or_abs modulo
//   | rel_or_abs "even"
//   | rel_or_abs "odd"
//
// rel_or_abs
//   = "%%" -- rel
//   | "%"  -- abs

function maybe_skip(src: StringScanner) {
  if (!src.scan(/\s*(%%?)\s*/)) {
    // "odd"/"even" used to be accepted without the prefix, which the grammar
    // never allowed; say so rather than leaving it to surface as a missing ']'.
    if (src.check(/\s*(odd|even)\b/)) {
      throw `a skip needs a '%' or '%%' prefix (I see '${src.peek(20)}')`
    }
    return SelNoSkip
  }

  const rel_or_abs: RelOrAbs = src.getCapture(0).length == 2 ? "rel" : "abs"

  const n = maybe_int(src)
  if (n) {
    return new SelSkip(rel_or_abs, 0, n)
  }

  if (src.scan(/odd\b/)) {
    return new SelSkip(rel_or_abs, 1, 2)
  }

  if (src.scan(/even\b/)) {
    return new SelSkip(rel_or_abs, 0, 2)
  }

  throw `a skip needs a number, 'odd', or 'even' after the '%' (I see '${src.peek(20)}')`
}


// number
//   = value:int   { return new SelNumberInt(value) }
//   / "lastrow"   { return new SelNumberLastRow() }
//   / "lastcol"   { return new SelNumberLastCol() }
//   / "thisrow"   { return new SelNumberThisRow() } //TODO

function number(src: StringScanner): SelNumber {
  if (src.scan(/\$(lastrow|lastcol|thisrow|tr|c|r)/))
    switch (src.getMatch()) {
      case "$c":
      case "$lastcol": return new SelNumberLastCol()

      case "$r":
      case "$lastrow": return new SelNumberLastRow()

      case "$tr":
      case "$thisrow": return new SelNumberThisRow()

      default: throw "Unknown number type"
    }
  else
    return new SelNumberInt(int(src))
}


function maybe_int(src: StringScanner) {
  if (src.check(/[0-9]/))
    return int(src)
  else
    return null
}
function int(src: StringScanner) {
  let digits = src.scan(/0|[1-9][0-9]*/)
  return parseInt(digits)
}


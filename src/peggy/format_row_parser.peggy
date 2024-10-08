{{
  import { FComment } from '../src/format.js'
  import {
  Selector,
  SelRowAndOrCol,
  SelCol,
  SelNumberInt,
  SelNumberLastRow,
  SelNumberLastCol,
  SelNumberThisRow,
  SelNumberRange,
  SelRow,
  SelSkip
  } from '../src/selectors.js'
}}

format_row
  = empty_row
  / _ "[" _ cells_selector _ "]" _ cell_formats
  / _ table_formats

empty_row
  = "#" comment:.* !.  { return new FComment(comment.join("")) }
  / _ !.               { return new FComment("") }

cells_selector "selector"
  = selector:row_and_or_col|1.., ( _ ";" _ )| { return new Selector(selector) }

row_and_or_col
  = row:row ":" col:col  { return new SelRowAndOrCol(row,  col) }
  / row:row              { return new SelRowAndOrCol(row,  null) }
  / col:col              { return new SelRowAndOrCol(null, col) }

row
  = "r"i numbers:numbers { return new SelRow(numbers) }
  / "r\*"                { return null   }

col
  = "c"i numbers:numbers { return new SelCol(numbers) }
  / "c\*"                { return null }



numbers
  = number_range|1.., ","|

number_range
  = n1:adjusted_number "-" n2:adjusted_number skip:skip? {
    return new SelSkip(new SelNumberRange(n1, n2))
    }
  / n1:adjusted_number "-" n2:adjusted_number {
      return new SelNumberRange(n1, n2)
    }
  / n1:adjusted_number {
      return new SelNumberRange(n1, n1)
    }

adjusted_number
  = number:number "~" offset:int   {
      return new SelAdjustedNumber(number, -offset)
    }
  / number:number "+" offset:int   {
      return new SelAdjustedNumber(number, offset)
    }
  / number:number {
      return number;
    }

number
  = value:int   { return new SelNumberInt(value) }
  / "lastrow"   { return new SelNumberLastRow() }
  / "lastcol"   { return new SelNumberLastCol() }
  / "thisrow"   { return new SelNumberThisRow() }

skip
  = rel:rel_or_abs mod:int {
      return new SelSkip(rel_or_abs, 0, int)
    }
  / rel:rel_or_abs "even" {
      return new SelSkip(rel_or_abs, 0, 2)
    }
  / rel:rel_or_abs "odd" {
      return new SelSkip(rel_or_abs, 1, 2)
    }
  / "even" {
      return new SelSkip("abs", 0, 2)
    }
  / "odd" {
      return new SelSkip("abs", 1, 2)
    }

rel_or_abs
  = "%%" { return "rel" }
  / "%"  { return "abs" }

//////////// end of selectors


cell_formats
  = cell_format|1.., whitespace|

cell_format
  = align
  / bg
  // cols
  / fg
  / footer
  / header
  / lines
  / size
  / span
  / style
  / width


table_formats
  = table_format|1.., whitespace|

table_format
  = align
  / bg
  / boxed
  // cols
  / fg
  / hlines
  / size
  / style
  / vlines
  / width


align
  = "align(" _ implicit_align  _ ")"
  / implicit_align

implicit_align
  = lr_align tb_align?
  / tb_align lr_align?

lr_align
  = [ljr]i

tb_align
  = [tmb]i

bg
  = "bg(" _ color _ ")"
  / "bg(" _ stylename _ ")"
  / color

boxed
  = "boxed"

  // cols

fg
  = "bg(" _ color _ ")"
  / "bg(" _ stylename _ ")"
  / color

footer
  = "footer"
  / "foot"

header
  = "header"
  / "head"

hlines
  = "hlines"

lines
  = "line" "s"? "(" _ line_spec _ ")"

line_spec
  = "x"
  / [tblr]+

size
  = "xxlarge"
  / "xlarge"
  / "large"
  / "normal"
  / "small"
  / "xsmall"
  / "xxsmall"

span
  = "span"

style
  = "." stylename

vlines
  = "vlines"

width
  = "width(" _ float _ ")"
  / "width(" _ int _ ")"

// utility

color
  = "#" hex_digit|6|
  / "#" hex_digit|3|
  / "shade" [1-9]

hex_digit
  = [a-f0-9]i

float
  = "0"? "." "0"* [1-9] [1-9]*

int
  = [1-9] [0-9]* { return parseInt(text()) }

stylename
  = [a-zA-Z] [-a-zA-Z0-0_]*


whitespace
    = [ \t]+

import { StringScanner } from "strscan-ts"
import { FormatRow } from "../format_row"

import { parse_global_formats, parse_selector_formats } from "./parse_formats"
import { parse_selector } from "./parse_selector"

export function parse_format_row(line: string) {
  const src = new StringScanner(line)
  const selectors = src.scan(/^\s*\[/) ? parse_selector(src) : null
  let result: FormatRow

  if (selectors === null) {
    result = new FormatRow(null, parse_global_formats(src))
  }
  else {
    const f = parse_selector_formats(src)
    result = new FormatRow(selectors, f)
  }

  if (!src.hasTerminated()) {
    console.error("unexpected stuff at end of line: " + src.peek(50))
  }

  return result
}


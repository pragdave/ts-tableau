import { StringScanner } from "strscan-ts"
import { FormatRow } from "../format_row"
import { FormatCaption } from "../formats"

import { parse_global_formats, parse_selector_formats } from "./parse_formats"
import { parse_selector } from "./parse_selector"

const BLANK_OR_COMMENT_RE = /^\s*(--|$)/
const CAPTION_RE = /^\s*(?:#+|:)[^\S\r\n]+(.*?)\s*$/

export function parse_format_row(line: string) {
  if (BLANK_OR_COMMENT_RE.test(line)) {
    return new FormatRow(null, [])
  }

  const caption_match = line.match(CAPTION_RE)
  if (caption_match) {
    return new FormatRow(null, [new FormatCaption(caption_match[1])])
  }

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

  return result
}


import { Row } from "../row"

const BLOCK_HEADER_RE = /^(column|col)\s*([1-9][0-9]?|[a-z])\s*\{\{\s*$/i
const BLOCK_CLOSE_RE = /^\s*\}\}\s*$/

// Consumes zero or more "col N {{ ... }}" blocks from `lines`, starting at
// `index`, attaching each block's (normalized) content to the given row.
// Returns the index of the first line that isn't a block header.
export function merge_column_blocks(lines: string[], index: number, row: Row): number {
  while (index < lines.length) {
    const header = lines[index].match(BLOCK_HEADER_RE)
    if (!header) break

    const col_no = decode_column_number(header[2])
    index++

    const content: string[] = []
    while (index < lines.length && !BLOCK_CLOSE_RE.test(lines[index])) {
      content.push(lines[index])
      index++
    }
    if (index >= lines.length) {
      throw `Missing closing '}}' for '${header[0].trim()}'`
    }
    index++ // skip the closing "}}"

    if (col_no >= 1 && col_no <= row.cells.length) {
      row.cells[col_no - 1].content = normalize(content).join("\n")
    }
  }
  return index
}

function decode_column_number(spec: string): number {
  if (/^[0-9]+$/.test(spec)) {
    return parseInt(spec, 10)
  }
  return spec.toLowerCase().charCodeAt(0) - "a".charCodeAt(0) + 1
}

// Expands tabs, then strips the block's own minimum common leading
// whitespace -- computed over non-blank lines only, so a blank
// paragraph-separator line inside the block doesn't force the minimum
// to zero and defeat dedenting entirely.
function normalize(content: string[]): string[] {
  const expanded = content.map((line) => expand_tabs(line))
  const indents = expanded
    .filter((line) => line.trim().length > 0)
    .map(leading_whitespace)
  const min_indent = indents.length > 0 ? Math.min(...indents) : 0
  return expanded.map((line) => line.slice(min_indent))
}

function leading_whitespace(line: string): number {
  const match = line.match(/^\s*/)
  return match ? match[0].length : 0
}

function expand_tabs(line: string, tab_size = 8): string {
  let result = ""
  for (const ch of line) {
    if (ch === "\t") {
      const pad = tab_size - (result.length % tab_size)
      result += " ".repeat(pad)
    } else {
      result += ch
    }
  }
  return result
}

import { Cell } from "./cell"
import { TableData } from "./table_data"
import { parse_data_row } from "./parser/parse_data_row"
import { parse_format_row } from "./parser/parse_format_row"
import { merge_column_blocks } from "./parser/parse_column_blocks"

export function tableau(lines: string[]): TableData {

  const [data, format] = split(lines)
  const table_data = new TableData()

  let index = 0
  while (index < data.length) {
    const row = parse_data_row(data[index])
    index++
    const index_before_blocks = index
    index = merge_column_blocks(data, index, row)
    table_data.add_row(row)

    // Blank lines are normally meaningful (a half-height row), but once a
    // row has column blocks attached, any blank lines right after them
    // are just visual spacing before the next row -- not their own row.
    if (index > index_before_blocks) {
      while (index < data.length && data[index].trim() === "") {
        index++
      }
    }
  }

  for (const line of format) {
    const format = parse_format_row(line)
    table_data.add_format(format)
  }

  table_data.resolve_spans()

  return table_data
}

function split(lines: string[]): [string[], string[]] {
  const data: string[] = []
  const format: string[] = []
  const merged_lines = new LineMerger(lines)
  let current = data
  let line: string | null

  while ((line = merged_lines.next()) !== null) {
    if (/^\s*===\s*$/.test(line)) {
      if (current == format) {
        throw "Cannot have a format separator ('===') in the format section"
      }
      current = format
    }
    else {
      current.push(line)
    }
  }

  return [trim_trailing_blanks(data), trim_trailing_blanks(format)]
}

// Drops blank lines from the end of `lines`, leaving interior blank lines
// untouched -- those are meaningful "half-height row" markers. This
// mirrors the reference implementation, which trims each section before
// splitting it into rows, so a trailing newline in the source file (the
// normal case) doesn't produce a spurious empty row at the end of the
// table.
function trim_trailing_blanks(lines: string[]): string[] {
  let end = lines.length
  while (end > 0 && lines[end - 1].trim() === "") {
    end--
  }
  return lines.slice(0, end)
}


// Successive lines ending with a backslash are merged into a single line
// unless the backslash is escaped by another backslash.
export class LineMerger { // export for testing
  index = 0
  length: number
  constructor(private lines: string[]) {
    this.length = lines.length
  }

  next(): string | null {
    let result: string

    if (this.index < this.length) {
      result = this.lines[this.index++]
      let len = result.length
      while (len > 0 && result[len - 1] == "\\") {
        result = result.substring(0, len - 1)
        len = result.length

        if (len > 0 && result[len - 1] == "\\") {
          break
        }

        if (this.index >= this.length) {
          throw "Cannot have a line continuation ('\\') on last line"
        }
        result = result + this.lines[this.index++]
        len = result.length
      }
      return result
    }
    else {
      return null
    }
  }
}

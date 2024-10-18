import { Cell } from "./cell"
import { TableData } from "./table_data"
import { parse_data_row } from "./parser/parse_data_row"
import { parse_format_row } from "./parser/parse_format_row"

export function tableau(lines: string[]): TableData {

  const [data, format] = split(lines)
  const table_data = new TableData()

  for (const line of data) {
    const row = parse_data_row(line)
    table_data.add_row(row)
  }

  for (const line of format) {
    const format = parse_format_row(line)
    table_data.add_format(format)
  }

  return table_data
}

function split(lines: string[]): [string[], string[]] {
  const data: string[] = []
  const format: string[] = []
  const merged_lines = new LineMerger(lines)
  let current = data
  let line: string | null

  while (line = merged_lines.next()) {
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

  return [data, format]
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

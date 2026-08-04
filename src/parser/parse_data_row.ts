import { StringScanner } from "strscan-ts"
import { Cell } from "../cell"
import { Row, EmptyRow } from "../row"

export function parse_data_row(line: string) {
  const src: StringScanner = new StringScanner(line)
  const cells: Cell[] = []
  src.scan(/\s*/)
  if (src.hasTerminated()) return new Row([])
  if (src.scan(/=empty\s*$/)) return EmptyRow()

  src.scan(/\|\s*/)  // first pipe is optional

  while (!src.hasTerminated()) {
    let cell = parse_cell(src)
    cells.push(cell)
    // skip next | and/or trailing sppaces. This takes us to the end 
    // if we just parsed the last column
    src.skip(/\s*(\|\s*)/)
  }
  return new Row(cells)
}

function parse_cell(src: StringScanner): Cell {
  const content: string[] = []

  while (!src.hasTerminated()) {
    let fragment = cell_fragment(src)
    if (!fragment) {
      break
    }
    content.push(fragment)
  }
  return new Cell(content.join(""))
}

function cell_fragment(src: StringScanner): string | false {
  if (src.hasTerminated())
    return false

  if (src.scan(/\\(.)/)) {
    debugger
    return src.getCapture(0)
  }

  return (
    src.scan(/`[^`]+`/) ||  // inline code
    src.scan(/\$[^$]+\$/) ||  // inline math
    src.scan(/[^`$|\\]+/)     // anything else non special
  )
}

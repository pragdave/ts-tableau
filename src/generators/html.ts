import { Cell } from "../cell"
import { Row } from "../row"
import { TableData } from "../table_data"
import {
  FormatAlign,
  FormatLines,
  FormatWidth,

  CssColor,
  RGBColor,
  ShadeColor,
  ColorRepresentations,
} from "../formats"

export function generate(table: TableData): string[] {
  return do_table(table)
}

function do_table(table: TableData): string[] {
  let result = [table_opener(table)]
  table.rows.forEach((row) => {
    result = result.concat(do_row(row))
  })

  result.push("</table>")
  //console.log(result)
  return result
}

function do_row(row: Row): string {
  const result = ["<tr>"]
  row.cells.forEach((cell) => {
    if (!cell.hidden) {
      result.push(do_cell(cell))
    }
  })
  result.push("</tr>")
  //console.log(result)
  return result.join("")
}

function table_opener(table: TableData): string {
  const attrs: string[] = []
  const styles = add_styles(table)
  const classes = add_classes(table)
  if (table.global_attr.style.length > 0) {
    attrs.push(`style="${attr_escape(table.global_attr.style)})"`)
  }
  if (styles.length > 0) {
    attrs.push(`style="${styles.join("; ")}"`)
  }
  attrs.unshift(`class="${classes}"`)
  return `<table ${attrs.join(" ")}>`
}



function add_styles(table: TableData): string[] {
  const styles = []
  if (table.global_attr.width.width != 1.0) {
    const w = table.global_attr.width
    styles.push(`width: ${format_width_to_css(w)}`)
  }
  return styles
}

function add_classes(table: TableData): string {
  const classes: string[] = ["tableau"]
  if (table.global_attr.boxed) {
    classes.push("boxed")
  }
  if (table.global_attr.hlines) {
    classes.push("hlines")
  }
  if (table.global_attr.vlines) {
    classes.push("vlines")
  }

  classes.push("halign-" + table.global_attr.halign)
  classes.push("valign-" + table.global_attr.valign)

  return classes.join(" ")
}

// CELL level formatting
//
function do_cell(cell: Cell): string {
  const tag = (cell.header || cell.footer) ? "th" : "td"
  return `<${tag}${cell_opener(cell)}><tableau-md>${escape_markdown(cell.content)}</tableau-md></${tag}>`
}

// cell.content is deferred Markdown source, not HTML -- ts-tableau
// intentionally does not render it. Wrapping it in <tableau-md> (a valid,
// inert custom-element name) marks it for a downstream consumer to find,
// unescape, and render with its own Markdown pipeline.
function escape_markdown(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function cell_opener(cell: Cell): string {
  const classes = do_cell_classes(cell)
  const styles = do_cell_styles(cell)
  const cls = classes.length == 0 ? "" : ` class="${classes.join(" ")}"`
  const sty = styles.length == 0 ? "" : ` style="${styles.join("; ")}"`
  const rowspan = cell.row_span > 1 ? ` rowspan="${cell.row_span}"` : ""
  const colspan = cell.col_span > 1 ? ` colspan="${cell.col_span}"` : ""
  return `${rowspan}${colspan}${cls}${sty}`

}

function do_cell_classes(cell: Cell): string[] {
  const result: string[] = []

  if (cell.align) {
    result.push(align_cell_class(cell.align))
  }
  if (cell.footer) {
    result.push("tb-footer")
  }
  if (cell.header) {
    result.push("tb-header")
  }

  if (cell.lines) {
    result.push(add_lines(cell.lines))
  }
  return result
}

function do_cell_styles(cell: Cell): string[] {
  const result: string[] = []

  if (cell.bg) {
    result.push(`background: ${do_color(cell.bg)}`)
  }
  if (cell.fg) {
    result.push(`color: ${do_color(cell.fg)}`)
  }
  if (cell.font_size) {
    switch (cell.font_size.scale) {
      case -3: result.push("font-size: 0.6em"); break
      case -2: result.push("font-size: 0.75em"); break
      case -1: result.push("font-size: 0.9em"); break
      case 0: result.push("font-size: 1em"); break
      case 1: result.push("font-size: 1.1em"); break
      case 2: result.push("font-size: 1.25em"); break
      case 3: result.push("font-size: 1.6em"); break
      default:
        throw `Invalid font scale: ${cell.font_size.scale}`
    }
  }
  if (cell.width) {
    result.push(`width: ${format_width_to_css(cell.width)}`)
  }

  return result
}

function align_cell_class(align: FormatAlign): string {
  return `halign-${align.halign} valign-${align.valign}`
}

function do_color(color: ColorRepresentations) {
  if (color instanceof RGBColor) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  }
  else if (color instanceof ShadeColor) {
    return color.shade
  }
  else if (color instanceof CssColor) {
    return color.name
  }
  else {
    throw new Error("Unknown color type")
  }
}

function add_lines(lines: FormatLines): string {
  return `tb_l_${lines.as_string()}`
}

function attr_escape(str: string) {
  return str
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/\\/g, "")
}

function format_width_to_css(w: FormatWidth): string {
  if (w.type == "ratio") {
    return `${w.width * 100}%`
  }
  else {
    return `${w.width}ch`
  }
}

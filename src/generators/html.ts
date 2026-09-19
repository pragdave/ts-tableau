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
  if (table.global_attr.caption !== null) {
    result.push(`<caption><tableau-md>${escape_markdown(table.global_attr.caption)}</tableau-md></caption>`)
  }
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
      result.push(do_cell(cell, row.is_empty))
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
  if (table.global_attr.classes.length > 0) {
    classes.push(...table.global_attr.classes)
  }
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
// An "=empty" row is documented as producing cells the same height as a
// normal data row (unlike a bare blank line, which collapses to a
// half-height row). A real line of content is what gives a cell its
// height, so an empty cell in such a row gets a non-breaking space --
// invisible, but occupying a full line box like any other cell's text.
const FULL_HEIGHT_PLACEHOLDER = " "

function do_cell(cell: Cell, force_full_height = false): string {
  const tag = (cell.header || cell.footer) ? "th" : "td"
  const content =
    force_full_height && cell.content === "" ? FULL_HEIGHT_PLACEHOLDER : escape_markdown(cell.content)
  return `<${tag}${cell_opener(cell)}><tableau-md>${content}</tableau-md></${tag}>`
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
  result.push(...cell.classes)
  return result
}

function do_cell_styles(cell: Cell): string[] {
  const result: string[] = []

  if (cell.bg) {
    result.push(`background: ${do_color(cell.bg, "bg")}`)
  }
  if (cell.fg) {
    result.push(`color: ${do_color(cell.fg, "fg")}`)
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

function do_color(color: ColorRepresentations, kind: "bg" | "fg") {
  if (color instanceof RGBColor) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  }
  else if (color instanceof ShadeColor) {
    return `var(--tb-${color.shade}-${kind})`
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

function format_width_to_css(w: FormatWidth): string {
  if (w.type == "ratio") {
    return `${w.width * 100}%`
  }
  else {
    return `${w.width}ch`
  }
}

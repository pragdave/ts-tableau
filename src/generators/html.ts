import { Cell } from "../cell"
import { Row } from "../row"
import { TableData } from "../table_data"
import { split_number, fraction_width } from "../decimal"
import {
  FormatAlign,
  FormatLines,
  FormatWidth,

  CssColor,
  DynamicShadeColor,
  RGBColor,
  ShadeColor,
  ColorRepresentations,
  LineStyle,
  Side,
} from "../formats"
import type { DecimalMark, HALIGN } from "../formats"

export function generate(table: TableData): string[] {
  return do_table(table)
}

function do_table(table: TableData): string[] {
  let result = [table_opener(table)]
  if (table.global_attr.caption !== null) {
    result.push(`<caption><tableau-md>${escape_markdown(table.global_attr.caption)}</tableau-md></caption>`)
  }
  const fraction_widths = decimal_fraction_widths(table)
  table.rows.forEach((row) => {
    result = result.concat(do_row(row, table, fraction_widths))
  })

  result.push("</table>")
  //console.log(result)
  return result
}

function do_row(row: Row, table: TableData, fraction_widths: Map<number, number>): string {
  const result = ["<tr>"]
  row.cells.forEach((cell, col) => {
    if (!cell.hidden) {
      const decimal = is_decimal_aligned(cell, table)
        ? { mark: table.global_attr.decimal_mark, width: fraction_widths.get(col)! }
        : null
      result.push(do_cell(cell, row.is_empty, decimal))
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
  styles.push(...table_line_vars("boxed", table.global_attr.boxed_style))
  styles.push(...table_line_vars("hlines", table.global_attr.hlines_style))
  styles.push(...table_line_vars("vlines", table.global_attr.vlines_style))
  return styles
}

function table_line_vars(rule: string, style: LineStyle): string[] {
  return line_style_css(style).map(([property, value]) => `--tb-${rule}-${property}: ${value}`)
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

type DecimalCell = { mark: DecimalMark, width: number }

function do_cell(cell: Cell, force_full_height = false, decimal: DecimalCell | null = null): string {
  const tag = cell_tag(cell)
  const number = decimal && split_number(cell.content, decimal.mark)
  const opener = decimal
    ? cell_opener(cell, [number ? "tb-num" : "tb-nonnum"], [`--tb-frac: ${decimal.width}`])
    : cell_opener(cell)

  // No <tableau-md>: a plain number has no Markdown, and a renderer's
  // block-level output would separate the number from its fraction box.
  if (number) {
    return `<${tag}${opener}>${number.whole}<span class="tb-frac">${number.fraction}</span></${tag}>`
  }
  const content =
    force_full_height && cell.content === "" ? FULL_HEIGHT_PLACEHOLDER : escape_markdown(cell.content)
  return `<${tag}${opener}><tableau-md>${content}</tableau-md></${tag}>`
}

function cell_tag(cell: Cell): "th" | "td" {
  return (cell.header || cell.footer) ? "th" : "td"
}

// A cell spanning columns belongs to no single column, so it isn't aligned.
function is_decimal_aligned(cell: Cell, table: TableData): boolean {
  return !cell.hidden && cell.col_span === 1 && effective_halign(cell, table) === "d"
}

// tableau.css applies the table-level alignment to td only.
function effective_halign(cell: Cell, table: TableData): HALIGN | null {
  if (cell.align) return cell.align.halign
  return cell_tag(cell) === "td" ? table.global_attr.halign : null
}

function decimal_fraction_widths(table: TableData): Map<number, number> {
  const widths = new Map<number, number>()
  for (const row of table.rows) {
    row.cells.forEach((cell, col) => {
      if (!is_decimal_aligned(cell, table)) return
      const number = split_number(cell.content, table.global_attr.decimal_mark)
      const width = number ? fraction_width(number) : 0
      widths.set(col, Math.max(widths.get(col) ?? 0, width))
    })
  }
  return widths
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

function cell_opener(cell: Cell, extra_classes: string[] = [], extra_styles: string[] = []): string {
  const classes = [...do_cell_classes(cell), ...extra_classes]
  const styles = [...do_cell_styles(cell), ...extra_styles]
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
  if (cell.bg instanceof ShadeColor) {
    result.push("tb-shaded")
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
  if (cell.lines) {
    for (const side of cell.lines.sides()) {
      for (const [property, value] of line_style_css(cell.line_styles.for_side(side))) {
        result.push(`border-${SIDE_NAMES[side]}-${property}: ${value}`)
      }
    }
  }

  return result
}

const SIDE_NAMES: Record<Side, string> = { t: "top", r: "right", b: "bottom", l: "left" }

function line_style_css(style: LineStyle): [string, string][] {
  const result: [string, string][] = []
  if (style.weight) {
    result.push(["width", `var(--tb-line-width-${style.weight})`])
  }
  if (style.style) {
    result.push(["style", style.style])
  }
  if (style.color) {
    result.push(["color", do_color(style.color, "bg")])
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
  else if (color instanceof DynamicShadeColor) {
    throw new Error("internal error: shade$tr/shade$tc reached the generator unresolved")
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

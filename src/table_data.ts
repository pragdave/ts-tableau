import { Cell } from "./cell";
import { Row } from "./row";
import { FormatRow } from "./format_row";
import { Selector, CellCoords } from "./selectors"

import {
  Formats,
  FormatAlign,
  FormatBg,
  FormatBoxed,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatLines,
  FormatSpan,
  FormatClass,
  FormatVlines,
  FormatWidth,

  HALIGN,
  VALIGN,
} from "./formats";

import type { ColorRepresentations } from "./formats/format_colors"

type GlobalAttributes = {
  boxed: boolean,
  halign: HALIGN,
  hlines: boolean,
  style: string,
  valign: VALIGN,
  vlines: boolean,
  width: FormatWidth,
}

export class TableData {
  readonly rows: Row[] = [];
  readonly formats: FormatRow[] = []
  private longest_row: number = 0
  private next_span_group = 1

  readonly global_attr: GlobalAttributes = {
    boxed: false,
    halign: "c",
    hlines: false,
    style: "",
    valign: "m",
    vlines: false,
    width: new FormatWidth(1.0, "ratio"),
  }


  //apply_formats_to_cells() {
  //  console.log(this)
  //  for (let format of this.formats) {
  //    this.apply_format(format);
  //  }
  //}
  //
  apply_format(format: FormatRow) {
    if (format.selectors === null) {
      this.apply_global_formats(format.formats)
    }
    else {
      let cells = format.selectors.cells(this)
      this.apply_selector_format(cells, format.formats)
      if (format.formats.some((f) => f instanceof FormatSpan)) {
        this.tag_span_groups(format.selectors)
      }
    }
  }

  apply_global_formats(formats: Formats[]) {
    for (let format of formats) {
      this.apply_global_format(format)
    }
  }

  apply_global_format(format: Formats) {
    switch (format.constructor) {
      case FormatBg:
      case FormatFg:
      case FormatFontsize:
        this.apply_selector_format(this.all_cells(), [format])
        break

      case FormatAlign:
        this.global_attr.halign = (format as FormatAlign).halign
        this.global_attr.valign = (format as FormatAlign).valign
        break

      case FormatBoxed:
        this.global_attr.boxed = true
        break

      case FormatHlines:
        this.global_attr.hlines = true
        break

      case FormatClass:
        this.global_attr.style = (format as FormatClass).name
        break

      case FormatVlines:
        this.global_attr.vlines = true
        break

      case FormatWidth:
        this.global_attr.width = format as FormatWidth
        break
    }
  }

  apply_selector_format(cells: Generator<CellCoords>, formats: Formats[]) {
    for (let cell_coord of cells) {
      let cell = this.cell_at(cell_coord)
      cell.add_format(formats)
    }
  }

  // Each term of a compound selector (the parts joined by ';') gets its
  // own span group, guaranteeing every group is exactly rectangular
  // (a SelTerm is always a single row-range x col-range cross product).
  private tag_span_groups(selector: Selector) {
    for (const term of selector.cell_ranges) {
      const group = this.next_span_group++
      for (const coord of term.cell_coords(this)) {
        this.cell_at(coord).span_group = group
      }
    }
  }

  // Called once, after all rows and formats have been processed. Groups
  // every span-tagged cell by span_group, and for each group sets
  // row_span/col_span on its top-left cell (the bounding box exactly
  // equals the group's membership, since every group is rectangular by
  // construction) and marks the rest of the group hidden.
  resolve_spans() {
    const groups = new Map<number, CellCoords[]>()

    for (const coord of this.all_cells()) {
      const group = this.cell_at(coord).span_group
      if (group === null) continue
      const coords = groups.get(group) ?? []
      coords.push(coord)
      groups.set(group, coords)
    }

    for (const coords of groups.values()) {
      const rows = coords.map((c) => c.row)
      const cols = coords.map((c) => c.col)
      const min_row = Math.min(...rows)
      const max_row = Math.max(...rows)
      const min_col = Math.min(...cols)
      const max_col = Math.max(...cols)

      const anchor = this.cell_at({ row: min_row, col: min_col })
      anchor.row_span = max_row - min_row + 1
      anchor.col_span = max_col - min_col + 1

      for (const coord of coords) {
        if (coord.row === min_row && coord.col === min_col) continue
        this.cell_at(coord).hidden = true
      }
    }
  }

  cell_at(coord: CellCoords): Cell {
    return this.rows[coord.row - 1].cells[coord.col - 1]
  }



  add_row(row: Row) {
    this.rows.push(row);
    this.longest_row = Math.max(this.longest_row, row.length())
    for (let row of this.rows) {
      row.pad_to(this.longest_row)
    }
  }

  add_format(format: FormatRow) {
    //this.formats.push(format)
    this.apply_format(format)
  }

  row_count() {
    return this.rows.length;
  }

  col_count() {
    let cols = 0;
    for (let row of this.rows) {
      cols = Math.max(cols, row.length());
    }
    return cols;
  }

  *all_cells(): Generator<CellCoords> {
    for (let row = 1; row <= this.row_count(); row++) {
      for (let col = 1; col <= this.col_count(); col++) {
        yield { row: row, col: col }
      }
    }
  }

  *all_row_numbers(): Generator<number> {
    for (let i = 1; i <= this.row_count(); i++) yield i;
  }

  *all_col_numbers(): Generator<number> {
    for (let i = 1; i <= this.col_count(); i++) yield i;
  }
}

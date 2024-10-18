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

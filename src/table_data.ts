import { Cell } from "./Cell"

export class TableData {
  readonly rows: Cell[][] = []

  add_row(row: Cell[]) {
    this.rows.push(row);
  }

  row_count() {
    this.rows.length
  }

  col_count() {
    let cols = 0;
    for (row of rows) {
      cols = Math.max(cols, row.length)
    }
    return cols
  }

}

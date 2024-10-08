import { Cell } from "./cell";

export class TableData {
  readonly rows: Cell[][] = [];

  add_row(row: Cell[]) {
    this.rows.push(row);
  }

  row_count() {
    return this.rows.length;
  }

  col_count() {
    let cols = 0;
    for (let row of this.rows) {
      cols = Math.max(cols, row.length);
    }
    return cols;
  }

  *all_row_numbers(): Generator<number> {
    for (let i = 1; i <= this.row_count(); i++) yield i;
  }

  *all_col_numbers(): Generator<number> {
    for (let i = 1; i <= this.col_count(); i++) yield i;
  }
}

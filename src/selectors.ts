import {TableData} from "../table_data"

// ####################################################
export class Selector {
  constructor(public cell_ranges: SelCellRange[]) {
  }
}

// ####################################################
export class SelAdjustedNumber {
   constructor(public number: SelNumber, public op: String, public offset: int) {
   }
}

// ####################################################
export class SelCellRange {

  constructor(private row?: Row, private col?: Col) {
    this.row = row
    this.col = col
  }

  cells(table: TableData) {
    const result:int[][] = []

    if (!this.row)
      this.row = Row.all_rows(table)

    if (!this.col)
      this.col = Col.all_cols(table)

    this.row.each_row(table, (row) => {
      this.col.each_col(table, row, (col) => {
        result.append([row, col])
      })
    })
    return result
  }

}

// ####################################################
export class SelCol {
  constructor(public numbers: Numbers) {
  }

  each_col(row: int, cb: (int) => none) {
    cb(123)
  }

  static all_cols(table: TableData) {
   return new SelCol([new SelNumbers(1, table.col_count)])
  }
}

// ####################################################
export class SelNumberRange {
  constructor(public from:int, public to:int) {
  }
}




// ####################################################
export class SelNumberInt {
  constructor(public value: int) {
  }
}

export class SelNumberLastRow {
  constructor() {
  }
}

export class SelNumberLastCol {
  constructor() {
  }
}

export class SelNumberThisRow {
  constructor() {
  }
}


// ####################################################
export class SelNumbers {
  constructor(public numbers: SelNumberRange[]) {
  }
}

// ###################################################
export class SelRow {
  constructor(public numbers: SelNumbers) {
  }

  each_row(table: TableData, cb: (int) => none) {
    cb(123)
  }

  static all_rows() {
   return "all rows"
  }
}

// ###################################################
export class SelSkip {
  constructor(
    public rel_or_abs: "rel" | "abs",
    public offset: int,
    public skip: int
  ) {
  }
}



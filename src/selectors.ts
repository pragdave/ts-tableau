import { TableData } from "./table_data";

export interface CellCoords {
  row: number,
  col: number,
}

// ####################################################
//
export class Selector {
  constructor(public cell_ranges: SelTerm[]) {
  }

  *cells(table: TableData): Generator<CellCoords> {
    const entries = new Map<CellCoords, boolean>();
    for (let entry of this.cell_coords(table)) {
      entries.set(entry, true);
    }
    for (const coord of entries.keys()) {
      yield coord
    }
  }

  *cell_coords(table: TableData): Generator<CellCoords> {
    for (let cell_range of this.cell_ranges) {
      for (let cell of cell_range.cell_coords(table)) {
        yield cell;
      }
    }
  }

  to_s() {
    return this.cell_ranges.map((cr) => cr.to_s()).join(";");
  }
}

// ####################################################
//
export class SelAdjustedNumber {
  constructor(
    public number: SelNumber,
    public offset: number,
  ) {
  }

  getValue(table: TableData): number {
    return this.number.getValue(table) + this.offset;
  }

  sameAs(other: SelAdjustedNumber): boolean {
    if (this.offset != other.offset) return false;

    return this.number.sameAs(other.number);
  }

  to_s() {
    let result = this.number.to_s();
    if (this.offset > 0) {
      result = `${result}+${this.offset}`;
    } else if (this.offset < 0) {
      result = `${result}~${-this.offset}`;
    }
    return result;
  }
}

// ####################################################
//  term
//    = row:row ":" col:col  { return new SelTerm(row,  col) }
//    / row:row              { return new SelTerm(row,  null) }
//    / col:col              { return new SelTerm(null, col) }
//
export class SelTerm {
  constructor(
    private row: SelRow | null,
    private col: SelCol | null,
  ) {
  }

  *cell_coords(table: TableData): Generator<CellCoords> {
    const row_iterator = this.row
      ? this.row.cell_coords(table)
      : table.all_row_numbers();
    const col_iterator = this.col
      ? this.col.cell_coords(table)
      : table.all_col_numbers();

    const persistent_cols = Array.from(col_iterator)

    for (let row of row_iterator) {
      for (let col of persistent_cols) {
        yield { row: row, col: col };
      }
    }
  }

  to_s() {
    const col_str = this.col ? this.col.to_s() : "*";
    const row_str = this.row ? this.row.to_s() : "*";

    if (col_str == "*" && row_str == "*") return "r*";

    if (row_str == "*") return col_str;

    return `${row_str}:${col_str}`;
  }
}

// ####################################################
//  row
//    = "r"i numbers:numbers
//    / "r\*"
//
// col
//    = "c"i numbers:numbers
//    / "c\*"
//

export class SelRowCol {
  constructor(public numbers: SelNumberGenerator[]) { }

  *cell_coords(table: TableData): Generator<number> {
    for (let snr of this.numbers) {
      for (let index of snr.cell_coords(table)) {
        yield index;
      }
    }
  }

  to_s() {
    return this.numbers.map((n) => n.to_s()).join(",");
  }
}

export class SelCol extends SelRowCol {
  to_s() {
    return "c" + super.to_s();
  }
}

export class SelRow extends SelRowCol {
  to_s() {
    return "r" + super.to_s();
  }
}

export class SelNumberGenerator {
  constructor(
    public from: SelAdjustedNumber,
    public to: SelAdjustedNumber,
    public skip = SelNoSkip
  ) {
  }

  *cell_coords(table: TableData): Generator<number> {
    const from = this.from.getValue(table);
    const to = this.to.getValue(table);
    for (let i = from; i <= to; i++) {
      let n = i
      if (this.skip.is_relative())
        n -= from
      n += this.skip.offset
      if ((n % this.skip.skip) == 0)
        yield i
    }
  }

  to_s() {
    if (this.from.sameAs(this.to)) return this.from.to_s();

    return `${this.from.to_s()}-${this.to.to_s()}`;
  }
}

// // ####################################################
// export class SelNumberRange {
//   constructor(
//     public from: SelAdjustedNumber,
//     public to: SelAdjustedNumber,
//   ) {
//   }
//
//   *cell_coords(table: TableData): Generator<number> {
//     const from = this.from.getValue(table);
//     const to = this.to.getValue(table);
//     for (let i = from; i <= to; i++) {
//       yield i;
//     }
//   }
//
//   to_s() {
//     if (this.from.sameAs(this.to)) return this.from.to_s();
//
//     return `${this.from.to_s()}-${this.to.to_s()}`;
//   }
// }
//
// ####################################################
export abstract class SelNumber {
  abstract getValue(table: TableData): number;
  abstract syntax_value(): string;

  // sameAs(other: SelNumber): boolean {
  sameAs(other: SelNumber) {
    return this.syntax_value() == other.syntax_value();
  }

  to_s() {
    return this.syntax_value();
  }
}

export class SelNumberInt extends SelNumber {
  constructor(public value: number) {
    super();
  }

  getValue(_: TableData) {
    return this.value;
  }

  syntax_value() {
    return `${this.value}`;
  }
}

export class SelNumberLastRow extends SelNumber {
  constructor() {
    super();
  }
  getValue(table: TableData) {
    return table.row_count();
  }
  syntax_value() {
    return "lastrow";
  }
}

export class SelNumberLastCol extends SelNumber {
  constructor() {
    super();
  }
  getValue(table: TableData) {
    return table.col_count();
  }
  syntax_value() {
    return "lastcol";
  }
}

export class SelNumberThisRow extends SelNumber {
  constructor() {
    super();
  }
  getValue(_table: TableData) {
    return 7;
  }
  syntax_value() {
    return "thisrow";
  }
}

// ###################################################
export type RelOrAbs = "rel" | "abs"

export class SelSkip {
  constructor(
    public rel_or_abs: RelOrAbs,
    public offset: number,
    public skip: number,
  ) { }

  is_relative() {
    return this.rel_or_abs == "rel"
  }
}

export const SelNoSkip = new SelSkip("abs", 0, 1)

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

  // Overlapping terms ("[r1:c1-3;r1:c2-4]") name the same cell more than once.
  // Keyed by value, not by object identity: every cell_coords() call allocates
  // a fresh CellCoords, so an identity-keyed map never actually collided.
  *cells(table: TableData): Generator<CellCoords> {
    const seen = new Set<string>();
    for (const coord of this.cell_coords(table)) {
      const key = `${coord.row},${coord.col}`;
      if (seen.has(key)) continue;
      seen.add(key);
      yield coord;
    }
  }

  *cell_coords(table: TableData): Generator<CellCoords> {
    for (let cell_range of this.cell_ranges) {
      for (let cell of cell_range.cell_coords(table)) {
        yield cell;
      }
    }
  }

  *rectangles(table: TableData): Generator<CellCoords[]> {
    for (const term of this.cell_ranges) {
      yield* term.rectangles(table);
    }
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

  getValue(table: TableData, current_row?: number): number {
    return this.number.getValue(table, current_row) + this.offset;
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
    public row: SelRow | null,
    public col: SelCol | null,
  ) {
  }

  *cell_coords(table: TableData): Generator<CellCoords> {
    const row_iterator = this.row
      ? this.row.cell_coords(table)
      : table.all_row_numbers();

    for (let row of row_iterator) {
      const col_iterator = this.col
        ? this.col.cell_coords(table, row)
        : table.all_col_numbers();
      for (let col of col_iterator) {
        yield { row: row, col: col };
      }
    }
  }

  // Yields one contiguous rectangle of coordinates per (row generator x
  // col generator) pair -- e.g. "r1,3:c1" is two comma-separated row
  // generators (1) and (3), each forming its own independent rectangle
  // with column 1. Throws if a single generator's own values aren't
  // contiguous (e.g. a "%even" skip) -- there's no sensible rectangle to
  // draw from a non-contiguous set.
  *rectangles(table: TableData): Generator<CellCoords[]> {
    const row_groups: (SelNumberGenerator | null)[] = this.row ? this.row.numbers : [null]
    const col_groups: (SelNumberGenerator | null)[] = this.col ? this.col.numbers : [null]

    for (const row_gen of row_groups) {
      const rows = row_gen ? contiguous_values(row_gen, table, "row") : Array.from(table.all_row_numbers())
      for (const col_gen of col_groups) {
        const cols = col_gen ? contiguous_values(col_gen, table, "column") : Array.from(table.all_col_numbers())
        const rectangle: CellCoords[] = []
        for (const row of rows) {
          for (const col of cols) {
            rectangle.push({ row, col })
          }
        }
        yield rectangle
      }
    }
  }
}

function contiguous_values(gen: SelNumberGenerator, table: TableData, axis: "row" | "column"): number[] {
  const values = Array.from(gen.cell_coords(table))
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (values.length !== max - min + 1) {
    throw `span requires a contiguous ${axis} range; "${gen.to_s()}" is not contiguous`
  }
  return values
}

// ####################################################
//  row = "r" numbers
//  col = "c" numbers

export class SelRowCol {
  constructor(public numbers: SelNumberGenerator[]) { }

  *cell_coords(table: TableData, current_row?: number): Generator<number> {
    for (let snr of this.numbers) {
      for (let index of snr.cell_coords(table, current_row)) {
        yield index;
      }
    }
  }
}

export class SelCol extends SelRowCol { }
export class SelRow extends SelRowCol { }

export class SelNumberGenerator {
  constructor(
    public from: SelAdjustedNumber,
    public to: SelAdjustedNumber,
    public skip = SelNoSkip
  ) {
  }

  *cell_coords(table: TableData, current_row?: number): Generator<number> {
    const from = this.from.getValue(table, current_row);
    const to = this.to.getValue(table, current_row);
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

// ####################################################
export abstract class SelNumber {
  abstract getValue(table: TableData, current_row?: number): number;
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

  getValue(_table: TableData, _current_row?: number) {
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
  getValue(table: TableData, _current_row?: number) {
    return table.row_count();
  }
  syntax_value() {
    return "$lastrow";
  }
}

export class SelNumberLastCol extends SelNumber {
  constructor() {
    super();
  }
  getValue(table: TableData, _current_row?: number) {
    return table.col_count();
  }
  syntax_value() {
    return "$lastcol";
  }
}

export class SelNumberThisRow extends SelNumber {
  constructor() {
    super();
  }
  getValue(_table: TableData, current_row?: number) {
    if (current_row === undefined) {
      throw "$thisrow (or $tr) can only be used inside a column spec, resolved per row -- it has no meaning in a row spec or inside a span selector"
    }
    return current_row;
  }
  syntax_value() {
    return "$thisrow";
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

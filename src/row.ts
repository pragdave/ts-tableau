import { Cell } from "./cell"

export class Row {

  constructor(
    public readonly cells: Cell[],
    public readonly is_empty = false) {
  }

  length(): number {
    return this.cells.length
  }

  pad_to(length: number) {
    while (this.cells.length < length) {
      this.cells.push(new Cell(""))  // can't be static because it may have different attrs
    }
  }
}

// Returns a fresh Row each call -- must not be a shared singleton, since
// Row instances (and their cells) are mutated in place by pad_to and by
// column-block content merging. A shared instance would leak state
// between unrelated =empty rows, including across separate tableau()
// calls.
export function EmptyRow(): Row {
  return new Row([], true)
}

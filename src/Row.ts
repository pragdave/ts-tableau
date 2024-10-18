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

export const EmptyRow = new Row([], true)

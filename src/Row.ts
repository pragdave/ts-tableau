import { Cell } from "./cell"

export class Row {

  constructor(
    public readonly content: Cell[],
    public readonly is_empty = false) {
    this.content = content
    this.is_empty = is_empty
  }
}

export const EmptyRow = new Row([], true)

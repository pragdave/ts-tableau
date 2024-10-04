import { Cell } from "./cell"
export type RowType = ( Empty | Data )

export class Row {

  constructor(
    readonly public content: Cell[],
    readonly public is_empty = false)
  {
  }
}

export const EmptyRow = new Row([], true)

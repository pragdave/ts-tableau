type WidthType = "ratio" | "chars"

export class FormatWidth {

  constructor(public width: number, public type: WidthType) {
  }
}

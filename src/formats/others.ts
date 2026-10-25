import type { LineStyle } from "./format_lines"

export class FormatBoxed {
  constructor(public style: LineStyle = {}) { }
}
export class FormatCaption {
  constructor(public text: string) { }
}
export type DecimalMark = "." | ","
export class FormatDecimal {
  constructor(public mark: DecimalMark) { }
}
export class FormatFooter { }
export class FormatHeader { }
export class FormatHlines {
  constructor(public style: LineStyle = {}) { }
}
export class FormatSpan { }
export class FormatVlines {
  constructor(public style: LineStyle = {}) { }
}

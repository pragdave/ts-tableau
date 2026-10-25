import { FormatAlign } from "./formats/format_align"
import { FormatBg, FormatFg } from "./formats/format_colors"
import { FormatFontsize } from "./formats/format_fontsize"
import { FormatLines } from "./formats/format_lines"
import { FormatClass } from "./formats/format_class"
import { FormatWidth } from "./formats/format_width"

import {
  FormatBoxed,
  FormatCaption,
  FormatDecimal,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatSpan,
  FormatVlines,
} from "./formats/others"

export {
  FormatAlign,
  FormatBg,
  FormatBoxed,
  FormatCaption,
  FormatClass,
  FormatDecimal,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatLines,
  FormatSpan,
  FormatVlines,
  FormatWidth,
}

export type Formats
  = FormatAlign
  | FormatBg
  | FormatBoxed
  | FormatCaption
  | FormatClass
  | FormatDecimal
  | FormatFg
  | FormatFontsize
  | FormatFooter
  | FormatHeader
  | FormatHlines
  | FormatLines
  | FormatSpan
  | FormatVlines
  | FormatWidth

// utilities
export { ColorRepresentations, GenColorCss, GenColorHex, GenColorShade, CssColor, DynamicShadeColor, RGBColor, ShadeColor } from "./formats/format_colors"
export { SHADE_NAMES, CSS_NAMES } from "./formats/format_colors"
export { HALIGN, VALIGN } from "./formats/format_align"
export type { DecimalMark } from "./formats/others"
export { LINE_WEIGHTS, LINE_STYLES, SIDES, CellLineStyles } from "./formats/format_lines"
export type { LineStyle, LineWeight, LineStyleName, Side } from "./formats/format_lines"

// export class FComment extends Format {
//   constructor(comment) {
//     super()
//     this.comment = comment
//   }
// }


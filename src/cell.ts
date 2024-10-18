import { Formats } from './formats'

import {
  FormatAlign,
  FormatBg,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatLines,
  FormatSpan,
  FormatClass,
  FormatWidth,


  ColorRepresentations,
  //GenColorCss,
  //GenColorHex,
  //GenColorShade,
  //
  //HALIGN,
  //VALIGN,
  //
  //SHADE_NAMES,
  //CSS_NAMES,
} from "./formats"

export class Cell {
  align: FormatAlign | null = null
  bg: ColorRepresentations | null = null
  fg: ColorRepresentations | null = null
  font_size: FormatFontsize | null = null
  footer = false
  header = false
  lines: FormatLines | null = null
  span: FormatSpan | null = null
  style: FormatClass | null = null
  width: FormatWidth | null = null


  constructor(public content: string) {
  }

  add_format(formats: Formats[]) {
    for (let f of formats) {
      this.add_one_format(f)
    }
  }

  add_one_format(format: Formats) {
    switch (format.constructor) {
      case FormatAlign:
        this.align = format as FormatAlign
        break
      case FormatBg:
        this.bg = (format as FormatBg).color
        break
      case FormatFg:
        this.fg = (format as FormatFg).color
        break
      case FormatFontsize:
        this.font_size = format as FormatFontsize
        break
      case FormatFooter:
        this.footer = true
        break
      case FormatHeader:
        this.header = true
        break
      case FormatLines:
        this.lines = format as FormatLines
        break
      case FormatSpan:
        this.span = format as FormatSpan
        break
      case FormatClass:
        this.style = format as FormatClass
        break
      case FormatWidth:
        this.width = format as FormatWidth
        break
    }
  }
}

// The lines around a cell or group of cells

import { ShadeColor } from "./format_colors"

export const LINE_WEIGHTS = ["thin", "default", "thick", "xthick"] as const
export const LINE_STYLES = ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"] as const

export type LineWeight = typeof LINE_WEIGHTS[number]
export type LineStyleName = typeof LINE_STYLES[number]

export interface LineStyle {
  weight?: LineWeight
  style?: LineStyleName
  color?: ShadeColor
}

export type Side = "t" | "r" | "b" | "l"
export const SIDES: Side[] = ["t", "r", "b", "l"]

export class FormatLines {
  static T = 0x01 & 0xff
  static R = 0x02 & 0xff
  static B = 0x04 & 0xff
  static L = 0x08 & 0xff
  static X = 0x10 & 0xff

  static side_mask = FormatLines.T | FormatLines.B | FormatLines.L | FormatLines.R

  flags = 0x00 & 0x00

  constructor(spec: string, public style: LineStyle = {}) {
    this.flags = this.decode(spec)
  }

  has_sides() { return this.flags !== 0 }

  sides(): Side[] {
    if (this.box()) return SIDES
    return SIDES.filter((side) => this.flags & this.decode(side))
  }

  // Combines this and another FormatLines' sides (bitwise OR), so that
  // applying line(t) and then line(b) to the same cell via two different
  // selectors leaves it with both sides rather than the second call
  // discarding the first.
  merge(other: FormatLines): FormatLines {
    const combined = new FormatLines("")
    combined.flags = this.flags | other.flags
    return combined
  }

  top() { return !!(this.flags & FormatLines.T) }
  bottom() { return !!(this.flags & FormatLines.B) }
  left() { return !!(this.flags & FormatLines.L) }
  right() { return !!(this.flags & FormatLines.R) }
  box() { return !!(this.flags & FormatLines.X) }

  as_string() {
    if (this.box()) {
      return "box"
    }
    return [FormatLines.T, FormatLines.R, FormatLines.B, FormatLines.L]
      .map((flag) => {
        return this.flags & flag ? "1" : "0"
      })
      .join("")

  }

  private decode(spec: string) {
    let value = 0x00 & 0x00
    for (let c of spec) {
      switch (c) {
        case "t": value |= FormatLines.T; break
        case "b": value |= FormatLines.B; break
        case "l": value |= FormatLines.L; break
        case "r": value |= FormatLines.R; break
        case "x": value |= FormatLines.X; break
      }
    }
    return value
  }
}


// A line() with sides styles just those sides; a line() without sides
// styles every line the cell has, wherever it came from. Side-specific
// styles win over cell-wide ones regardless of the order they were given.
export class CellLineStyles {
  private all: LineStyle = {}
  private per_side: Record<Side, LineStyle> = { t: {}, r: {}, b: {}, l: {} }

  add(format: FormatLines) {
    if (!format.has_sides()) {
      this.all = { ...this.all, ...format.style }
      return
    }
    for (const side of format.sides()) {
      this.per_side[side] = { ...this.per_side[side], ...format.style }
    }
  }

  for_side(side: Side): LineStyle {
    return { ...this.all, ...this.per_side[side] }
  }
}

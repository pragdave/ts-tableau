// The lines around a cell or group of cells

export class FormatLines {
  static T = 0x01 & 0xff
  static R = 0x02 & 0xff
  static B = 0x04 & 0xff
  static L = 0x08 & 0xff
  static X = 0x10 & 0xff

  static side_mask = FormatLines.T | FormatLines.B | FormatLines.L | FormatLines.R

  flags = 0x00 & 0x00

  constructor(spec: string) {
    this.flags = this.decode(spec)
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


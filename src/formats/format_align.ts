// The alignment within cells

export type HALIGN = ("l" | "c" | "r" | "j")
export type VALIGN = ("t" | "m" | "b")

export class FormatAlign {
  halign: HALIGN = "c"
  valign: VALIGN = "m"

  constructor(halign: HALIGN, valign: VALIGN) {
    this.halign = halign
    this.valign = valign
  }
}


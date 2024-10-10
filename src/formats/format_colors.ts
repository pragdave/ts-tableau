export const CSS_NAMES = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige", "bisque", "black", "blanchedalmond", "blue",
  "blueviolet", "brown", "burlywood", "cadetblue", "chartreuse", "chocolate", "coral", "cornflowerblue", "cornsilk",
  "crimson", "cyan", "darkblue", "darkcyan", "darkgoldenrod", "darkgray", "darkgreen", "darkkhaki", "darkmagenta",
  "darkolivegreen", "darkorange", "darkorchid", "darkred", "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
  "darkturquoise", "darkviolet", "deeppink", "deepskyblue", "dimgray", "dodgerblue", "firebrick", "floralwhite",
  "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod", "gray", "green", "greenyellow", "honeydew",
  "hotpink", "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush", "lawngreen", "lemonchiffon", "lightblue",
  "lightcoral", "lightcyan", "lightgoldenrodyellow", "lightgray", "lightgreen", "lightpink", "lightsalmon", "lightseagreen",
  "lightskyblue", "lightslategray", "lightsteelblue", "lightyellow", "lime", "limegreen", "linen", "magenta", "maroon",
  "mediumaquamarine", "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen", "mediumslateblue", "mediumspringgreen",
  "mediumturquoise", "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin", "navajowhite", "navy",
  "oldlace", "olive", "olivedrab", "orange", "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
  "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum", "powderblue", "purple", "red", "rosybrown",
  "royalblue", "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna", "silver", "skyblue",
  "slateblue", "slategray", "snow", "springgreen", "steelblue", "tan", "teal", "thistle", "tomato", "turquoise",
  "violet", "wheat", "white", "whitesmoke", "yellow", "yellowgreen"])

export const SHADE_NAMES = new Set([
  "shade1", "shade2", "shade3", "shade4", "shade5", "shade6", "shade7", "shade8", "shade9", "shade",
])



// These classes represent the different types of color spec
//
export type ColorRepresentations = RGBColor | ShadeColor | CssColor

export class RGBColor {
  constructor(public r: number, public g: number, public b: number) {
  }
}

export class ShadeColor {
  constructor(public shade: string) {
  }
}

export class CssColor {
  constructor(public name: string) {
  }
}


// These are the actual formats
export class FormatBg {
  constructor(public color: ColorRepresentations) { }
}

// These are the actual formats
export class FormatFg {
  constructor(public color: ColorRepresentations) { }
}

// and these are helpers used by the parser to generate a format class
export function GenColorHex(color: string) {
  console.log("GCH", color)
  let r = 0, g = 0, b = 0
  switch (color.length) {
    case 3:
      [r, g, b] = chunk3(color).map(n => parseInt(n, 16) * 0x11)
      break
    case 6:
      [r, g, b] = chunk6(color).map((n: string) => parseInt(n, 16))
      break
  }

  return new RGBColor(r, g, b)
}

export function GenColorShade(shade: string) {
  return new ShadeColor(shade)
}

export function GenColorCss(name: string) {
  return new CssColor(name)
}

function chunk3(str: string): string[] {
  return str.split("")
}

function chunk6(str: string): string[] {
  const chunks = str.match(/../g)
  if (!chunks)
    throw `Internal error parsing ${str} as 6 hex digits`
  return Array.from(chunks)
}


import { FormatLines } from "../src/formats/format_lines"
import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"

describe("FormatLines getters", () => {
  test("top() is true only when the T flag is set", () => {
    expect(new FormatLines("t").top()).toBe(true)
    expect(new FormatLines("b").top()).toBe(false)
  })

  test("right() is true only when the R flag is set", () => {
    expect(new FormatLines("r").right()).toBe(true)
    expect(new FormatLines("b").right()).toBe(false)
  })

  test("bottom() is true only when the B flag is set", () => {
    expect(new FormatLines("b").bottom()).toBe(true)
    expect(new FormatLines("r").bottom()).toBe(false)
  })

  test("left() is true only when the L flag is set", () => {
    expect(new FormatLines("l").left()).toBe(true)
    expect(new FormatLines("r").left()).toBe(false)
  })
})

describe("FormatLines#as_string", () => {
  test("encodes a single side in top-right-bottom-left order", () => {
    expect(new FormatLines("t").as_string()).toBe("1000")
    expect(new FormatLines("r").as_string()).toBe("0100")
    expect(new FormatLines("b").as_string()).toBe("0010")
    expect(new FormatLines("l").as_string()).toBe("0001")
  })

  test("encodes multiple sides", () => {
    expect(new FormatLines("tblr").as_string()).toBe("1111")
    expect(new FormatLines("br").as_string()).toBe("0110")
  })

  test("box overrides the side digits", () => {
    expect(new FormatLines("x").as_string()).toBe("box")
  })
})

test("[r1:c1] lines(r) renders a right-only border class on the cell", () => {
  const html = generate(tableau(["a|b", "===", "[r1:c1] lines(r)"]))
  expect(html[1]).toContain(`class="tb_l_0100"`)
})

test("two selectors that both apply line() to the same cell combine sides instead of the second overwriting the first", () => {
  const html = generate(tableau(["a|b", "===", "[r1] line(t)", "[c1] line(b)"]))
  expect(html[1]).toContain(`class="tb_l_1010"`)
})

// The generator names a cell's line class from as_string(), and the
// stylesheet has to have a rule for every name it can produce, or the
// lines are silently not drawn. lines(x) shipped that way: it emitted
// tb_l_box while the stylesheet only knew tb-boxed.
describe("tableau.css", () => {
  const css = require("fs").readFileSync(
    require("path").join(__dirname, "../assets/tableau.css"),
    "utf8",
  )

  const specs = ["x"]
  for (let mask = 1; mask < 16; mask++) {
    specs.push(["t", "r", "b", "l"].filter((_, i) => mask & (1 << i)).join(""))
  }

  test.each(specs)("has a rule for the class lines(%s) produces", (spec) => {
    const name = `tb_l_${new FormatLines(spec).as_string()}`
    expect(css).toMatch(new RegExp(`&\\.${name}\\s*\\{`))
  })
})

describe("line styles", () => {
  function cell_html(...layout: string[]): string {
    return generate(tableau(["a|b", "===", ...layout]))[1]
  }

  test("line(b, shade4, dotted, thick) styles the bottom border", () => {
    const html = cell_html("[r1:c1] line(b, shade4, dotted, thick)")
    expect(html).toContain(`class="tb_l_0010"`)
    expect(html).toContain(
      `style="border-bottom-width: var(--tb-line-width-thick); border-bottom-style: dotted; border-bottom-color: var(--tb-shade4-bg)"`
    )
  })

  test("arguments may come in any order, separated by commas or spaces", () => {
    expect(cell_html("[r1:c1] line(dashed b)")).toContain("border-bottom-style: dashed")
    expect(cell_html("[r1:c1] line(xthick,t)")).toContain("border-top-width: var(--tb-line-width-xthick)")
  })

  test("a plain line() emits no inline style", () => {
    expect(cell_html("[r1:c1] line(b)")).not.toContain("style=")
  })

  test("line(x, double) styles all four sides of the box", () => {
    const html = cell_html("[r1:c1] line(x, double)")
    expect(html).toContain(`class="tb_l_box"`)
    for (const side of ["top", "right", "bottom", "left"]) {
      expect(html).toContain(`border-${side}-style: double`)
    }
  })

  test("a line() without sides restyles sides drawn by another selector, in either order", () => {
    for (const layout of [["[r1] line(t)", "[r1] line(dotted)"], ["[r1] line(dotted)", "[r1] line(t)"]]) {
      const html = cell_html(...layout)
      expect(html).toContain(`class="tb_l_1000"`)
      expect(html).toContain("border-top-style: dotted")
    }
  })

  test("a line() without sides draws nothing on its own", () => {
    const html = cell_html("[r1] line(dotted, thick)")
    expect(html).not.toContain("tb_l_")
    expect(html).not.toContain("border-")
  })

  test("styles merge per side", () => {
    const html = cell_html("[r1:c1] line(t, thick)", "[r1:c1] line(b, dotted)")
    expect(html).toContain("border-top-width: var(--tb-line-width-thick)")
    expect(html).not.toContain("border-top-style")
    expect(html).toContain("border-bottom-style: dotted")
    expect(html).not.toContain("border-bottom-width")
  })

  test("a later style for the same side wins, attribute by attribute", () => {
    const html = cell_html("[r1:c1] line(t, thick, dotted)", "[r1:c1] line(t, dashed)")
    expect(html).toContain("border-top-width: var(--tb-line-width-thick)")
    expect(html).toContain("border-top-style: dashed")
  })

  test("a side-specific style beats a cell-wide one whatever the order", () => {
    for (const layout of [["[r1] line(t, dashed)", "[r1] line(dotted)"], ["[r1] line(dotted)", "[r1] line(t, dashed)"]]) {
      expect(cell_html(...layout)).toContain("border-top-style: dashed")
    }
  })

  test("default is a weight that can override a cell-wide one", () => {
    const html = cell_html("[r1] line(thick)", "[r1] line(t, default)", "[r1] line(b)")
    expect(html).toContain("border-top-width: var(--tb-line-width-default)")
    expect(html).toContain("border-bottom-width: var(--tb-line-width-thick)")
  })

  test.each([
    ["line(b, wavy)", "unrecognized line() argument: 'wavy'"],
    ["line(b, red)", "unrecognized line() argument: 'red'"],
    ["line(b, thick, thin)", "line() has more than one weight: 'thin'"],
    ["line(dotted, dashed)", "line() has more than one style: 'dashed'"],
    ["line(shade1, shade2)", "line() has more than one color: 'shade2'"],
    ["line()", "line() needs at least one side or line style"],
  ])("[r1] %s is an error", (format, message) => {
    expect(() => tableau(["a|b", "===", `[r1] ${format}`])).toThrow(message)
  })
})

describe("table line styles", () => {
  function table_tag(...layout: string[]): string {
    return generate(tableau(["a|b", "c|d", "===", ...layout]))[0]
  }

  test("plain hlines, vlines and boxed set no inline style", () => {
    expect(table_tag("hlines vlines boxed")).toBe(`<table class="tableau boxed hlines vlines halign-c valign-m">`)
  })

  test("hlines(dotted, shade6) sets the hlines variables on the table", () => {
    const tag = table_tag("hlines(dotted, shade6)")
    expect(tag).toContain("hlines")
    expect(tag).toContain(`style="--tb-hlines-style: dotted; --tb-hlines-color: var(--tb-shade6-bg)"`)
  })

  test("vlines and boxed take the same arguments", () => {
    const tag = table_tag("vlines(thick) boxed(double xthick)")
    expect(tag).toContain("--tb-vlines-width: var(--tb-line-width-thick)")
    expect(tag).toContain("--tb-boxed-width: var(--tb-line-width-xthick)")
    expect(tag).toContain("--tb-boxed-style: double")
  })

  test("repeated table rules merge their styles", () => {
    const tag = table_tag("hlines(dotted)", "hlines(thick)")
    expect(tag).toContain("--tb-hlines-style: dotted")
    expect(tag).toContain("--tb-hlines-width: var(--tb-line-width-thick)")
  })

  test.each(["hlines(t)", "vlines(x)", "boxed(b, thick)"])("%s is an error: table rules take no sides", (format) => {
    expect(() => tableau(["a|b", "===", format])).toThrow("does not take sides")
  })
})

describe("tableau.css line variables", () => {
  const css = require("fs").readFileSync(
    require("path").join(__dirname, "../assets/tableau.css"),
    "utf8",
  )

  test.each(["thin", "default", "thick", "xthick"])("defines --tb-line-width-%s", (weight) => {
    expect(css).toMatch(new RegExp(`--tb-line-width-${weight}:`))
  })

  test.each(["boxed", "hlines", "vlines"])("draws %s from its variables, with defaults", (rule) => {
    expect(css).toContain(`var(--tb-${rule}-width) var(--tb-${rule}-style) var(--tb-${rule}-color)`)
    for (const property of ["width", "style", "color"]) {
      expect(css).toMatch(new RegExp(`--tb-${rule}-${property}:`))
    }
  })
})

test("the guide lists tableau.css's :root variables exactly as shipped", () => {
  const read = (path: string) => require("fs").readFileSync(require("path").join(__dirname, path), "utf8")
  const root = read("../assets/tableau.css").match(/^:root \{\n[\s\S]*?^\}\n/m)[0]
  expect(read("../docs/guide/tableau-guide.md")).toContain(root)
})

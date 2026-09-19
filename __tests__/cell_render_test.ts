import { tableau, generate } from "../src/index"

// The cell-level attributes below all reached the Cell object in existing
// tests, but nothing checked what the HTML generator did with them.

function cell_html(...format_lines: string[]) {
  return generate(tableau(["a|b", "c|d", "===", ...format_lines]))[1]
}

describe("font sizes render as em values", () => {
  const sizes: Array<[string, string]> = [
    ["xxsmall", "0.6em"],
    ["xsmall", "0.75em"],
    ["small", "0.9em"],
    ["normal", "1em"],
    ["large", "1.1em"],
    ["xlarge", "1.25em"],
    ["xxlarge", "1.6em"],
  ]
  for (const [spec, em] of sizes) {
    test(`${spec} renders as font-size: ${em}`, () => {
      expect(cell_html(`[r1:c1] ${spec}`)).toContain(`style="font-size: ${em}"`)
    })
  }

  test("the short spellings render the same as the long ones", () => {
    expect(cell_html("[r1:c1] sm")).toContain("font-size: 0.9em")
    expect(cell_html("[r1:c1] lg")).toContain("font-size: 1.1em")
    expect(cell_html("[r1:c1] xxlg")).toContain("font-size: 1.6em")
  })
})

describe("header and footer cells", () => {
  test("header adds the tb-header class", () => {
    expect(cell_html("[r1:c1] header")).toContain(`class="tb-header"`)
  })

  test("footer adds the tb-footer class", () => {
    expect(cell_html("[r1:c1] footer")).toContain(`class="tb-footer"`)
  })

  test("a cell can be both, in a fixed order", () => {
    expect(cell_html("[r1:c1] footer header")).toContain(`class="tb-footer tb-header"`)
  })
})

describe("cell alignment", () => {
  test("a cell alignment renders as halign/valign classes", () => {
    expect(cell_html("[r1:c1] align(lt)")).toContain(`class="halign-l valign-t"`)
  })

  test("the implicit spelling renders the same", () => {
    expect(cell_html("[r1:c1] rb")).toContain(`class="halign-r valign-b"`)
  })
})

describe("cell width", () => {
  test("a character width renders in ch units", () => {
    expect(cell_html("[r1:c1] width(12)")).toContain(`style="width: 12ch"`)
  })

  test("a ratio width renders as a percentage", () => {
    expect(cell_html("[r1:c1] width(0.25)")).toContain(`style="width: 25%"`)
  })
})

describe("colors render by kind", () => {
  test("a hex background renders as rgb()", () => {
    expect(cell_html("[r1:c1] bg(#12a9ec)")).toContain("background: rgb(18, 169, 236)")
  })

  test("a shade background renders as a CSS variable", () => {
    expect(cell_html("[r1:c1] bg(shade3)")).toContain("background: var(--tb-shade3-bg)")
  })

  test("a shade foreground uses the fg variable", () => {
    expect(cell_html("[r1:c1] fg(shade3)")).toContain("color: var(--tb-shade3-fg)")
  })

  test("a CSS named color renders by name", () => {
    expect(cell_html("[r1:c1] bg(crimson)")).toContain("background: crimson")
  })

  test("a CSS named color keeps the spelling it was given", () => {
    expect(cell_html("[r1:c1] fg(HotPink)")).toContain("color: HotPink")
  })
})

describe("lines render as a tb_l_ class", () => {
  test("individual sides become a bitmask class", () => {
    expect(cell_html("[r1:c1] lines(t)")).toContain("tb_l_1000")
    expect(cell_html("[r1:c1] lines(tr)")).toContain("tb_l_1100")
    expect(cell_html("[r1:c1] lines(tblr)")).toContain("tb_l_1111")
  })

  test("a box renders as tb_l_box", () => {
    expect(cell_html("[r1:c1] lines(x)")).toContain("tb_l_box")
  })

  test("lines from separate format lines merge", () => {
    expect(cell_html("[r1:c1] lines(t)", "[r1:c1] lines(b)")).toContain("tb_l_1010")
  })
})

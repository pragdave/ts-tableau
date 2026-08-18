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

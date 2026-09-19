import { tableau, generate } from "../src/index"

test("a table-level .name style adds a CSS class to the table, not a style attribute", () => {
  const html = generate(tableau(["a|b", "===", ".gradient"])).join("\n")
  expect(html).toContain(`class="tableau gradient halign-c valign-m"`)
  expect(html).not.toContain("style=")
})

test("a cell-level .name style adds a CSS class to that cell", () => {
  const html = generate(tableau(["a|b", "===", "[r1:c1] .glow"])).join("\n")
  expect(html).toContain(`class="glow"`)
})

describe("classes accumulate rather than overwrite", () => {
  test("two classes on one cell line are both applied, in order", () => {
    const html = generate(tableau(["a|b", "===", "[r1:c1] .one .two"])).join("\n")
    expect(html).toContain(`class="one two"`)
  })

  test("classes from separate format lines are both applied", () => {
    const html = generate(tableau(["a|b", "===", "[r1:c1] .one", "[r1:c1] .two"])).join("\n")
    expect(html).toContain(`class="one two"`)
  })

  test("a repeated class name is only emitted once", () => {
    const html = generate(tableau(["a|b", "===", "[r1:c1] .one .one"])).join("\n")
    expect(html).toContain(`class="one"`)
  })

  test("a cell class combines with the classes tableau generates itself", () => {
    const html = generate(tableau(["a|b", "===", "[r1] header", "[r1:c1] .one"])).join("\n")
    expect(html).toContain("tb-header")
    expect(html).toContain("one")
  })

  test("table-level classes accumulate across lines", () => {
    const html = generate(tableau(["a|b", "===", ".one", ".two"])).join("\n")
    expect(html).toContain(`class="tableau one two halign-c valign-m"`)
  })

  test("a repeated table-level class is only emitted once", () => {
    const html = generate(tableau(["a|b", "===", ".one", ".one"])).join("\n")
    expect(html).toContain(`class="tableau one halign-c valign-m"`)
  })
})

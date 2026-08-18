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

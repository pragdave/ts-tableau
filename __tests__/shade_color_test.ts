import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"

function html_for(lines: string[]) {
  return generate(tableau(lines))
}

test("shade background color renders as a CSS variable reference", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(shade3)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td class="tb-shaded" style="background: var(--tb-shade3-bg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("shade foreground color renders as a CSS variable reference", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] fg(shade7)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="color: var(--tb-shade7-fg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("bare 'shade' alias renders as a CSS variable reference", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(shade)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td class="tb-shaded" style="background: var(--tb-shade-bg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("shade bg and fg combined on one cell render both correctly", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(shade3) fg(shade7)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td class="tb-shaded" style="background: var(--tb-shade3-bg); color: var(--tb-shade7-fg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("RGB color rendering is unchanged by the do_color signature change", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(#2a6)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: rgb(34, 170, 102)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("named CSS color rendering is unchanged by the do_color signature change", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(red)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: red"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("only a shade background marks the cell as shaded, so its text can follow light/dark mode", () => {
  const html = (fmt: string) => html_for(["a|b", "===", fmt])[1]
  expect(html("[r1:c1] bg(shade3)")).toContain(`class="tb-shaded"`)
  expect(html("[r1:c1] bg(#cdf)")).not.toContain("tb-shaded")
  expect(html("[r1:c1] bg(crimson)")).not.toContain("tb-shaded")
})

test("tableau.css gives shaded cells black text in light mode and white in dark, except headers and footers", () => {
  const css = require("fs").readFileSync(require("path").join(__dirname, "../assets/tableau.css"), "utf8")
  expect(css).toMatch(/&\.tb-shaded:not\(\.tb-header, \.tb-footer\) \{\s*color: light-dark\(#000, #fff\);/)
})

describe("shade$tr and shade$tc", () => {
  const rows = (n: number) => Array.from({ length: n }, (_, i) => `r${i + 1}|x|y`)
  const cell_styles = (lines: string[]) =>
    html_for(lines).filter((l) => l.startsWith("<tr>")).map((row) => [...row.matchAll(/<td[^>]*>/g)].map((m) => m[0]))

  test("bg(shade$tr) shades each row by its number, cycling after shade9", () => {
    const html = cell_styles([...rows(11), "===", "[c1] bg(shade$tr)"])
    const shades = html.map((cells) => cells[0].match(/--tb-(shade\d)-bg/)![1])
    expect(shades).toEqual(["shade1", "shade2", "shade3", "shade4", "shade5", "shade6", "shade7", "shade8", "shade9", "shade1", "shade2"])
  })

  test("bg(shade$tc) shades each column by its number", () => {
    const [cells] = cell_styles(["a|b|c", "===", "[r1] bg(shade$tc)"])
    expect(cells.map((c) => c.match(/--tb-(shade\d)-bg/)![1])).toEqual(["shade1", "shade2", "shade3"])
  })

  test("a resolved shade marks the cell as shaded", () => {
    expect(cell_styles(["a|b", "===", "[r1:c2] bg(shade$tc)"])[0][1]).toContain(`class="tb-shaded"`)
  })

  test("fg() and a table-level bg() resolve per cell too", () => {
    const html = cell_styles(["a|b", "c|d", "===", "bg(shade$tr)", "[c2] fg(shade$tc)"])
    expect(html[1][0]).toContain("background: var(--tb-shade2-bg)")
    expect(html[1][1]).toContain("color: var(--tb-shade2-fg)")
    expect(html[0][1]).toContain("color: var(--tb-shade2-fg)")
  })

  test("line() takes a dynamic shade", () => {
    const html = cell_styles(["a|b", "c|d", "===", "[c1] line(b, shade$tr)"])
    expect(html[0][0]).toContain("border-bottom-color: var(--tb-shade1-bg)")
    expect(html[1][0]).toContain("border-bottom-color: var(--tb-shade2-bg)")
  })

  test.each(["hlines(shade$tr)", "vlines(shade$tc)", "boxed(shade$tr)"])("%s is an error: table rules have no cell", (format) => {
    expect(() => tableau(["a|b", "===", format])).toThrow("has no cell to take")
  })

  test.each(["bg(shade$c)", "line(b, shade$r)"])("[r1] %s is an error", (format) => {
    expect(() => tableau(["a|b", "===", `[r1] ${format}`])).toThrow("a shade can be numbered by $tr or $tc only")
  })
})

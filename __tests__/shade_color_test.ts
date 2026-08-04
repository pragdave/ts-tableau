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
    `<tr><td style="background: var(--tb-shade3-bg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
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
    `<tr><td style="background: var(--tb-shade-bg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
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
    `<tr><td style="background: var(--tb-shade3-bg); color: var(--tb-shade7-fg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
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

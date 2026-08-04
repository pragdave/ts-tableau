import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"

function html_for(lines: string[]) {
  return generate(tableau(lines))
}

test("cell content is wrapped in a tableau-md marker", () => {
  const lines = ["x|y"]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    "<tr><td><tableau-md>x</tableau-md></td><td><tableau-md>y</tableau-md></td></tr>",
    "</table>",
  ])
})

test("&, <, and > in cell content are HTML-entity-escaped inside the marker", () => {
  const lines = ["a & b < c > d"]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    "<tr><td><tableau-md>a &amp; b &lt; c &gt; d</tableau-md></td></tr>",
    "</table>",
  ])
})

test("multi-line block content is wrapped with embedded newlines preserved", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "line one",
    "",
    "line two",
    "}}",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    "<tr><td><tableau-md>a</tableau-md></td><td><tableau-md>line one\n\nline two</tableau-md></td></tr>",
    "</table>",
  ])
})

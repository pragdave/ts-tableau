import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"

function html_for(lines: string[]) {
  return generate(tableau(lines))
}

test("single-cell span emits no rowspan/colspan", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    "<tr><td>a</td><td>b</td></tr>",
    "<tr><td>c</td><td>d</td></tr>",
    "</table>",
  ])
})

test("horizontal span merges two cells into one colspan", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td colspan="2">a</td></tr>`,
    "<tr><td>c</td><td>d</td></tr>",
    "</table>",
  ])
})

test("vertical span merges two cells into one rowspan", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1-2:c1] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td rowspan="2">a</td><td>b</td></tr>`,
    "<tr><td>d</td></tr>",
    "</table>",
  ])
})

test("rectangular span merges a 2x2 block into one cell", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1-2:c1-2] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td rowspan="2" colspan="2">a</td></tr>`,
    "<tr></tr>",
    "</table>",
  ])
})

test("two independent span groups from separate format lines", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span",
    "[r2:c1-2] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td colspan="2">a</td></tr>`,
    `<tr><td colspan="2">c</td></tr>`,
    "</table>",
  ])
})

test("compound selector: each term spans independently, not merged together", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1;r2:c2] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    "<tr><td>a</td><td>b</td></tr>",
    "<tr><td>c</td><td>d</td></tr>",
    "</table>",
  ])
})

test("compound selector with ranges: each term merges independently", () => {
  const lines = [
    "a|b",
    "c|d",
    "e|f",
    "g|h",
    "===",
    "[r1-2:c1;r3-4:c1] span",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td rowspan="2">a</td><td>b</td></tr>`,
    "<tr><td>d</td></tr>",
    `<tr><td rowspan="2">e</td><td>f</td></tr>`,
    "<tr><td>h</td></tr>",
    "</table>",
  ])
})

test("span combines correctly with other cell formats", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span bg(red)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td colspan="2" style="background: red">a</td></tr>`,
    "<tr><td>c</td><td>d</td></tr>",
    "</table>",
  ])
})

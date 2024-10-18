import { parse_data_row } from "../src/parser/parse_data_row"
import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"

function table_from_rows(rows: string[]) {
  const td = tableau(rows)
  return td
}

//test("basic table", () => {
//  let rows = [
//    "a|b",
//    "c|d|",
//  ]
//
//  let expected = [
//    `<table class="tableau halign-c valign-m">`,
//    "<tr><td>a</td><td>b</td></tr>",
//    "<tr><td>c</td><td>d</td></tr>",
//    "</table>",
//  ]
//  expect(generate(table_from_rows(rows))).toEqual(expected)
//})
//
function test_global_attrs(format_rows: string[], expected_attrs: string) {
  let rows = [
    "a|b",
    "===",
  ].concat(format_rows)

  let expected = [
    `<table class="tableau ${expected_attrs}">`,
    "<tr><td>a</td><td>b</td></tr>",
    "</table>",
  ]
  test(`global table attrs: ${format_rows.join(", ")}`, () => {
    expect(generate(table_from_rows(rows))).toEqual(expected)
  })
}

const ga_tests = {
  "boxed": "boxed halign-c valign-m",
  "boxed,hlines": "boxed hlines halign-c valign-m",
  "boxed,vlines": "boxed vlines halign-c valign-m",
  "boxed,hlines,vlines": "boxed hlines vlines halign-c valign-m",
  "align(l)": "halign-l valign-m",
  "align(c)": "halign-c valign-m",
  "align(r)": "halign-r valign-m",
  "align(j)": "halign-j valign-m",

  "align(t)": "halign-c valign-t",
  "align(m)": "halign-c valign-m",
  "align(b)": "halign-c valign-b",

  "align(lt)": "halign-l valign-t",
  "align(rb)": "halign-r valign-b",

  "boxed,align(rb)": "boxed halign-r valign-b",

  "width(1.0)": "halign-c valign-m",
  "width(0.6)": `halign-c valign-m" style="width: 60%`,
}

for (let [attr, expected_attrs] of Object.entries(ga_tests)) {
  console.log(attr, expected_attrs)
  test_global_attrs(attr.split(","), expected_attrs)
}


import { tableau } from "../src/tableau"
import { generate } from "../src/generators/html"

test("blank lines in the format section are ignored", () => {
  const table = tableau(["a|b", "===", "", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("whitespace-only lines in the format section are ignored", () => {
  const table = tableau(["a|b", "===", "   ", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("-- comment lines in the format section are ignored", () => {
  const table = tableau(["a|b", "===", "-- this is a comment", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("-- comment lines with leading whitespace are ignored", () => {
  const table = tableau(["a|b", "===", "  -- this is a comment", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("unrecognized text in a global-format line throws", () => {
  expect(() => tableau(["a|b", "===", "garbledtext123"])).toThrow()
})

test("unrecognized trailing text in a selector-format line throws", () => {
  expect(() => tableau(["a|b", "===", "[r1] garbledtext123"])).toThrow()
})

test("':' prefix sets the caption", () => {
  const table = tableau(["a|b", "===", ": a caption"])
  expect(table.global_attr.caption).toBe("a caption")
})

test("'#' prefix sets the caption", () => {
  const table = tableau(["a|b", "===", "# a caption"])
  expect(table.global_attr.caption).toBe("a caption")
})

test("'###' prefix sets the caption the same as a single '#'", () => {
  const table = tableau(["a|b", "===", "### a caption"])
  expect(table.global_attr.caption).toBe("a caption")
})

test("caption renders as the table's first child, wrapped in tableau-md", () => {
  const html = generate(tableau(["a|b", "===", "# My Caption"]))
  expect(html[0]).toEqual(`<table class="tableau halign-c valign-m">`)
  expect(html[1]).toEqual("<caption><tableau-md>My Caption</tableau-md></caption>")
  expect(html[2]).toEqual("<tr><td><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>")
})

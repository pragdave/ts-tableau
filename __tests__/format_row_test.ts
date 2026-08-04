import { tableau } from "../src/tableau"

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

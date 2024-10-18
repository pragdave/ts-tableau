import { LineMerger } from "../src/tableau"

test("line merger no continuations", () => {
  const lines = [
    "line1",
    "line2",
    "line3",
  ]
  const merger = new LineMerger(lines)
  expect(merger.next()).toBe("line1")
  expect(merger.next()).toBe("line2")
  expect(merger.next()).toBe("line3")
  expect(merger.next()).toBe(null)
})

test("line merger one continuations", () => {
  const lines = [
    "line1",
    "line2\\",
    "line3",
  ]
  const merger = new LineMerger(lines)
  expect(merger.next()).toBe("line1")
  expect(merger.next()).toBe("line2line3")
  expect(merger.next()).toBe(null)
})

test("line merger two continuations", () => {
  const lines = [
    "line1\\",
    "line2\\",
    "line3",
  ]
  const merger = new LineMerger(lines)
  expect(merger.next()).toBe("line1line2line3")
  expect(merger.next()).toBe(null)
})

test("line merger escaped continuation", () => {
  const lines = [
    "line1\\\\",
    "line2\\",
    "line3",
  ]
  const merger = new LineMerger(lines)
  expect(merger.next()).toBe("line1\\")
  expect(merger.next()).toBe("line2line3")
  expect(merger.next()).toBe(null)
})



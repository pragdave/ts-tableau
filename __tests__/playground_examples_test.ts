import { run } from "../playground/lib"
import { examples, DEFAULT_EXAMPLE, findExample } from "../playground/examples"

test.each(examples.map((example) => [example.key, example.source]))(
  "example %s renders without error",
  (_key, source) => {
    const result = run(source)
    expect(result).toMatchObject({ ok: true })
  }
)

test("example keys are unique", () => {
  const keys = examples.map((example) => example.key)
  expect(new Set(keys).size).toBe(keys.length)
})

test("the default example exists", () => {
  expect(findExample(DEFAULT_EXAMPLE)).toBeDefined()
})

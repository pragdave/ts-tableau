import { tableau } from "../src/tableau"
import { generate } from "../src/generators/html"
import { TableData } from "../src/table_data"

export type PlaygroundResult =
  | { ok: true; html: string; tableData: TableData }
  | { ok: false; error: string }

export function run(source: string): PlaygroundResult {
  try {
    const lines = source.split("\n")
    const tableData = tableau(lines)
    const html = generate(tableData).join("\n")
    return { ok: true, html, tableData }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

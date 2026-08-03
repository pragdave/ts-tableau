# Cell Spans Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `span` (rowspan/colspan merging) in ts-tableau, currently parsed but never rendered.

**Architecture:** `Cell` gains span-tracking fields. `TableData` tags cells with a span group per selector term when a clause's formats include `span`, then resolves all groups into row/col spans in one pass after all rows and formats are processed. `generators/html.ts` renders the result: hidden cells are omitted, spanning cells get `rowspan`/`colspan` attributes.

**Tech Stack:** TypeScript, Jest (`ts-jest`), existing parser/selector infrastructure (no parser changes needed).

## Global Constraints

- `span` only applies within selector-scoped format clauses (`[...]  span`) — it was never a recognized global-format keyword and this doesn't change.
- Every span group comes from exactly one `SelTerm` (one `;`-separated part of a compound selector) — never a whole compound selector as one group. This guarantees every group is exactly rectangular.
- A single-cell selector with `span` (e.g. `[r1:c1] span`) is a true no-op: `row_span`/`col_span` stay at 1, nothing is hidden.
- `resolve_spans()` runs exactly once, after all data rows and all format rows have been processed — not incrementally per format line.
- Rendering: cells with `hidden = true` are omitted entirely from their row's output. `rowspan`/`colspan` attributes are only emitted when the value is greater than 1.

---

### Task 1: Cell span fields + TableData tagging and resolution

**Files:**
- Modify: `src/cell.ts`
- Modify: `src/table_data.ts`
- Modify: `src/tableau.ts`
- Test: `__tests__/table_data_span_test.ts` (new)

**Interfaces:**
- Produces: `Cell.span_group: number | null` (default `null`), `Cell.row_span: number` (default `1`), `Cell.col_span: number` (default `1`), `Cell.hidden: boolean` (default `false`) — Task 2's `generators/html.ts` reads these four fields directly.
- Produces: `TableData.resolve_spans(): void` — called once by `tableau()` after all rows/formats are processed; no other task calls it directly, but Task 2's tests rely on it having run (via the public `tableau()` entry point).

- [ ] **Step 1: Write the failing test**

Create `__tests__/table_data_span_test.ts`:

```ts
import { tableau } from "../src/tableau"

function span_groups(lines: string[]) {
  const table = tableau(lines)
  const result: { row: number, col: number, row_span: number, col_span: number, hidden: boolean }[] = []
  for (let row = 1; row <= table.row_count(); row++) {
    for (let col = 1; col <= table.col_count(); col++) {
      const cell = table.cell_at({ row, col })
      result.push({ row, col, row_span: cell.row_span, col_span: cell.col_span, hidden: cell.hidden })
    }
  }
  return result
}

test("single-cell span is a no-op", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("horizontal span merges two cells in a row", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 2, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("vertical span merges two cells in a column", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1-2:c1] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 2, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})

test("rectangular span merges a 2x2 block", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1-2:c1-2] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 2, col_span: 2, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: true },
  ])
})

test("two independent span groups from separate format lines don't interfere", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1-2] span",
    "[r2:c1-2] span",
  ]
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 2, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 1, row_span: 1, col_span: 2, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: true },
  ])
})

test("compound selector: each term gets its own span group, not one merged group", () => {
  const lines = [
    "a|b",
    "c|d",
    "===",
    "[r1:c1;r2:c2] span",
  ]
  // Two disjoint single cells, each its own no-op group — not merged together.
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
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
  expect(span_groups(lines)).toEqual([
    { row: 1, col: 1, row_span: 2, col_span: 1, hidden: false },
    { row: 1, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 2, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 2, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 3, col: 1, row_span: 2, col_span: 1, hidden: false },
    { row: 3, col: 2, row_span: 1, col_span: 1, hidden: false },
    { row: 4, col: 1, row_span: 1, col_span: 1, hidden: true },
    { row: 4, col: 2, row_span: 1, col_span: 1, hidden: false },
  ])
})
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx jest __tests__/table_data_span_test.ts`
Expected: FAIL — a TypeScript compile error, since `Cell` has no `row_span`/`col_span`/`hidden` properties yet (`ts-jest` type-checks on transform, so this surfaces as a compile error, not just a runtime assertion failure).

- [ ] **Step 3: Add the span fields to `Cell`**

In `src/cell.ts`, add four fields to the `Cell` class, alongside the existing ones (exact insertion point: right after `span: FormatSpan | null = null` and before `style: FormatClass | null = null`):

```ts
  span: FormatSpan | null = null
  span_group: number | null = null
  row_span = 1
  col_span = 1
  hidden = false
  style: FormatClass | null = null
```

The rest of `src/cell.ts` is unchanged.

- [ ] **Step 4: Add span tagging and resolution to `TableData`**

In `src/table_data.ts`:

Add a new private field, alongside the existing `private longest_row: number = 0`:

```ts
  private longest_row: number = 0
  private next_span_group = 1
```

Change `apply_format` from:

```ts
  apply_format(format: FormatRow) {
    if (format.selectors === null) {
      this.apply_global_formats(format.formats)
    }
    else {
      let cells = format.selectors.cells(this)
      this.apply_selector_format(cells, format.formats)
    }
  }
```

to:

```ts
  apply_format(format: FormatRow) {
    if (format.selectors === null) {
      this.apply_global_formats(format.formats)
    }
    else {
      let cells = format.selectors.cells(this)
      this.apply_selector_format(cells, format.formats)
      if (format.formats.some((f) => f instanceof FormatSpan)) {
        this.tag_span_groups(format.selectors)
      }
    }
  }
```

Add two new methods anywhere in the class (e.g. directly after `apply_selector_format`):

```ts
  // Each term of a compound selector (the parts joined by ';') gets its
  // own span group, guaranteeing every group is exactly rectangular
  // (a SelTerm is always a single row-range x col-range cross product).
  private tag_span_groups(selector: Selector) {
    for (const term of selector.cell_ranges) {
      const group = this.next_span_group++
      for (const coord of term.cell_coords(this)) {
        this.cell_at(coord).span_group = group
      }
    }
  }

  // Called once, after all rows and formats have been processed. Groups
  // every span-tagged cell by span_group, and for each group sets
  // row_span/col_span on its top-left cell (the bounding box exactly
  // equals the group's membership, since every group is rectangular by
  // construction) and marks the rest of the group hidden.
  resolve_spans() {
    const groups = new Map<number, CellCoords[]>()

    for (const coord of this.all_cells()) {
      const group = this.cell_at(coord).span_group
      if (group === null) continue
      const coords = groups.get(group) ?? []
      coords.push(coord)
      groups.set(group, coords)
    }

    for (const coords of groups.values()) {
      const rows = coords.map((c) => c.row)
      const cols = coords.map((c) => c.col)
      const min_row = Math.min(...rows)
      const max_row = Math.max(...rows)
      const min_col = Math.min(...cols)
      const max_col = Math.max(...cols)

      const anchor = this.cell_at({ row: min_row, col: min_col })
      anchor.row_span = max_row - min_row + 1
      anchor.col_span = max_col - min_col + 1

      for (const coord of coords) {
        if (coord.row === min_row && coord.col === min_col) continue
        this.cell_at(coord).hidden = true
      }
    }
  }
```

The rest of `src/table_data.ts` (constructor, `apply_global_formats`, `apply_global_format`, `cell_at`, `add_row`, `add_format`, `row_count`, `col_count`, `all_cells`, `all_row_numbers`, `all_col_numbers`) is unchanged.

- [ ] **Step 5: Call `resolve_spans()` from `tableau()`**

In `src/tableau.ts`, change:

```ts
  for (const line of format) {
    const format = parse_format_row(line)
    table_data.add_format(format)
  }

  return table_data
```

to:

```ts
  for (const line of format) {
    const format = parse_format_row(line)
    table_data.add_format(format)
  }

  table_data.resolve_spans()

  return table_data
```

The rest of `src/tableau.ts` is unchanged.

- [ ] **Step 6: Run the test and verify it passes**

Run: `npx jest __tests__/table_data_span_test.ts`
Expected: `Tests: 7 passed, 7 total`

- [ ] **Step 7: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (270 pre-existing tests + this task's 7 new ones = 277 total).

- [ ] **Step 8: Commit**

```bash
git add src/cell.ts src/table_data.ts src/tableau.ts __tests__/table_data_span_test.ts
git commit -m "$(cat <<'EOF'
Implement span group tagging and resolution

Cell gains span_group/row_span/col_span/hidden fields. TableData tags
each SelTerm of a span-requesting selector clause with its own group
(guaranteeing every group is exactly rectangular), then resolve_spans()
— called once by tableau() after all rows/formats are processed —
turns each group into a row_span/col_span on its top-left cell and
hides the rest. Rendering isn't wired up yet (next task).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 2: Render spans in HTML output

**Files:**
- Modify: `src/generators/html.ts`
- Test: `__tests__/span_html_test.ts` (new)

**Interfaces:**
- Consumes: `Cell.row_span`, `Cell.col_span`, `Cell.hidden` (from Task 1) and the public `tableau()`/`generate()` pipeline.

- [ ] **Step 1: Write the failing test**

Create `__tests__/span_html_test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx jest __tests__/span_html_test.ts`
Expected: FAIL — every test's actual output will include the hidden cells and lack `rowspan`/`colspan` attributes (e.g. the "horizontal span" test would currently produce `<tr><td>a</td><td>b</td></tr>` instead of `<tr><td colspan="2">a</td></tr>`).

- [ ] **Step 3: Update `do_row` to skip hidden cells**

In `src/generators/html.ts`, change:

```ts
function do_row(row: Row): string {
  const result = ["<tr>"]
  row.cells.forEach((cell) => {
    result.push(do_cell(cell))
  })
  result.push("</tr>")
  //console.log(result)
  return result.join("")
}
```

to:

```ts
function do_row(row: Row): string {
  const result = ["<tr>"]
  row.cells.forEach((cell) => {
    if (!cell.hidden) {
      result.push(do_cell(cell))
    }
  })
  result.push("</tr>")
  //console.log(result)
  return result.join("")
}
```

- [ ] **Step 4: Emit `rowspan`/`colspan` attributes**

In `src/generators/html.ts`, change `cell_opener` from:

```ts
function cell_opener(cell: Cell): string {
  const classes = do_cell_classes(cell)
  const styles = do_cell_styles(cell)
  const cls = classes.length == 0 ? "" : ` class="${classes.join(" ")}"`
  const sty = styles.length == 0 ? "" : ` style="${styles.join("; ")}"`
  return `${cls}${sty}`

}
```

to:

```ts
function cell_opener(cell: Cell): string {
  const classes = do_cell_classes(cell)
  const styles = do_cell_styles(cell)
  const cls = classes.length == 0 ? "" : ` class="${classes.join(" ")}"`
  const sty = styles.length == 0 ? "" : ` style="${styles.join("; ")}"`
  const rowspan = cell.row_span > 1 ? ` rowspan="${cell.row_span}"` : ""
  const colspan = cell.col_span > 1 ? ` colspan="${cell.col_span}"` : ""
  return `${rowspan}${colspan}${cls}${sty}`

}
```

- [ ] **Step 5: Remove the now-obsolete dead comment**

In `src/generators/html.ts`, delete these two leftover lines (they were the marker for exactly the gap this task closes — `span` is no longer unimplemented):

```ts
//span: FormatSpan | null = null
//style: FormatClass | null = null
```

- [ ] **Step 6: Run the test and verify it passes**

Run: `npx jest __tests__/span_html_test.ts`
Expected: `Tests: 7 passed, 7 total`

- [ ] **Step 7: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (277 tests from after Task 1 + this task's 7 new ones = 284 total).

- [ ] **Step 8: Commit**

```bash
git add src/generators/html.ts __tests__/span_html_test.ts
git commit -m "$(cat <<'EOF'
Render spans in HTML output

do_row skips hidden cells; cell_opener emits rowspan/colspan
attributes when a cell's span is greater than 1. Removes the dead
"//span: FormatSpan | null = null" comment that marked this gap.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

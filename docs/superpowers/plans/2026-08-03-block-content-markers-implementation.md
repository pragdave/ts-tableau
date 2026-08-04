# Block Content + `<tableau-md>` Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `col N {{ ... }}` block-content parsing from the reference implementation, and wrap all HTML cell content in `<tableau-md>` markers so downstream consumers can find and render the Markdown that ts-tableau itself intentionally does not render.

**Architecture:** A new parser module (`src/parser/parse_column_blocks.ts`) handles the lookahead scan for `col`/`column` blocks; `src/tableau.ts`'s data-line loop changes from a simple `for...of` to an index-based loop so it can call into it. `src/generators/html.ts`'s `do_cell` wraps every cell's (HTML-entity-escaped) content in `<tableau-md>...</tableau-md>`, unconditionally — this changes the output of every existing HTML-generation test, which get updated as part of this plan.

**Tech Stack:** TypeScript, Jest (`ts-jest`), existing parser/generator infrastructure — no changes to `Cell`'s model (`content` stays a plain `string`).

## Global Constraints

- Block syntax: `(column|col)` (case-insensitive, `column` tried before `col` in any alternation — `col` would otherwise consume the first 3 characters of `column2` and misparse it), followed by a column number (`[1-9][0-9]?` or a single letter `a`-`z`, case-insensitive, `a`→1 `b`→2 ...), followed by `{{`, on its own line. Closed by a line matching `^\s*}}`.
- A block only attaches to the row from the data line immediately preceding it; it cannot be the first thing in the data section (falls out of the loop structure — no special-case code needed).
- Multiple consecutive blocks can follow one row, each targeting a different column.
- A block targeting an out-of-range column (beyond that row's own field count, checked before any padding to the table's eventual width) is silently ignored, not an error.
- A block missing its closing `}}` before EOF throws.
- Block content is normalized: tabs expanded (tab size 8), then dedented by the block's own minimum common leading whitespace — computed over non-blank lines only (a block containing a blank paragraph-separator line must not force the minimum to zero).
- `<tableau-md>` wraps **every** cell's content, unconditionally — no special-casing by whether it came from a single pipe-delimited field or a `col N {{}}` block.
- Escaping order: `&` → `&amp;` first, then `<` → `&lt;`, then `>` → `&gt;`.
- `Cell.content` stays a plain `string` — multi-line content is just a string containing `\n` characters, no model change.

---

### Task 1: Block content parsing (`col N {{ ... }}`)

**Files:**
- Create: `src/parser/parse_column_blocks.ts`
- Modify: `src/tableau.ts`
- Test: `__tests__/column_blocks_test.ts` (new)

**Interfaces:**
- Produces: `merge_column_blocks(lines: string[], index: number, row: Row): number` — starting at `index` in `lines`, consumes zero or more `col N {{...}}` blocks, mutating `row`'s cells in place, and returns the index of the first line that isn't a block header (i.e. where normal data-line processing should resume). Consumed by `src/tableau.ts`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/column_blocks_test.ts`:

```ts
import { tableau } from "../src/tableau"

function rows_of(lines: string[]) {
  return tableau(lines).rows.map((row) => row.cells.map((cell) => cell.content))
}

test("a row followed by one column block replaces that column's content", () => {
  const lines = [
    "Cicero|||",
    "col 2 {{",
    "paragraph one",
    "",
    "paragraph two",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["Cicero", "paragraph one\n\nparagraph two", ""],
  ])
})

test("multiple consecutive blocks target different columns of the same row", () => {
  const lines = [
    "Cicero|||",
    "col 2 {{",
    "second column text",
    "}}",
    "col 3 {{",
    "third column text",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["Cicero", "second column text", "third column text"],
  ])
})

test("'column' keyword is recognized, not just 'col'", () => {
  const lines = [
    "a|b",
    "column2 {{",
    "text",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "text"],
  ])
})

test("letter-based column addressing resolves to the same columns as numbers", () => {
  const lines = [
    "a|b|c",
    "colb {{",
    "text for b",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "text for b", "c"],
  ])
})

test("dedenting strips common leading whitespace but preserves relative indentation", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "    outer line",
    "      nested line",
    "    outer line again",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "outer line\n  nested line\nouter line again"],
  ])
})

test("a blank line inside a block doesn't force the dedent amount to zero", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "    paragraph one",
    "",
    "    paragraph two",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "paragraph one\n\nparagraph two"],
  ])
})

test("a block targeting an out-of-range column is silently ignored", () => {
  const lines = [
    "a|b",
    "col5 {{",
    "text",
    "}}",
  ]
  expect(rows_of(lines)).toEqual([
    ["a", "b"],
  ])
})

test("a block missing its closing '}}' throws", () => {
  const lines = [
    "a|b",
    "col2 {{",
    "text with no closer",
  ]
  expect(() => tableau(lines)).toThrow()
})

test("a 'col N {{' line with no preceding data row is just parsed as an ordinary row", () => {
  const lines = [
    "col2 {{",
  ]
  expect(rows_of(lines)).toEqual([
    ["col2 {{"],
  ])
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx jest __tests__/column_blocks_test.ts`
Expected: FAIL — `col N {{...}}` blocks aren't recognized at all yet; they get parsed as ordinary (garbled) data rows instead of being merged into the preceding row.

- [ ] **Step 3: Create `src/parser/parse_column_blocks.ts`**

```ts
import { Row } from "../row"

const BLOCK_HEADER_RE = /^(column|col)\s*([1-9][0-9]?|[a-z])\s*\{\{\s*$/i
const BLOCK_CLOSE_RE = /^\s*\}\}\s*$/

// Consumes zero or more "col N {{ ... }}" blocks from `lines`, starting at
// `index`, attaching each block's (normalized) content to the given row.
// Returns the index of the first line that isn't a block header.
export function merge_column_blocks(lines: string[], index: number, row: Row): number {
  while (index < lines.length) {
    const header = lines[index].match(BLOCK_HEADER_RE)
    if (!header) break

    const col_no = decode_column_number(header[2])
    index++

    const content: string[] = []
    while (index < lines.length && !BLOCK_CLOSE_RE.test(lines[index])) {
      content.push(lines[index])
      index++
    }
    if (index >= lines.length) {
      throw `Missing closing '}}' for '${header[0].trim()}'`
    }
    index++ // skip the closing "}}"

    if (col_no >= 1 && col_no <= row.cells.length) {
      row.cells[col_no - 1].content = normalize(content).join("\n")
    }
  }
  return index
}

function decode_column_number(spec: string): number {
  if (/^[0-9]+$/.test(spec)) {
    return parseInt(spec, 10)
  }
  return spec.toLowerCase().charCodeAt(0) - "a".charCodeAt(0) + 1
}

// Expands tabs, then strips the block's own minimum common leading
// whitespace -- computed over non-blank lines only, so a blank
// paragraph-separator line inside the block doesn't force the minimum
// to zero and defeat dedenting entirely.
function normalize(content: string[]): string[] {
  const expanded = content.map(expand_tabs)
  const indents = expanded
    .filter((line) => line.trim().length > 0)
    .map(leading_whitespace)
  const min_indent = indents.length > 0 ? Math.min(...indents) : 0
  return expanded.map((line) => line.slice(min_indent))
}

function leading_whitespace(line: string): number {
  const match = line.match(/^\s*/)
  return match ? match[0].length : 0
}

function expand_tabs(line: string, tab_size = 8): string {
  let result = ""
  for (const ch of line) {
    if (ch === "\t") {
      const pad = tab_size - (result.length % tab_size)
      result += " ".repeat(pad)
    } else {
      result += ch
    }
  }
  return result
}
```

- [ ] **Step 4: Wire it into `src/tableau.ts`**

Change:

```ts
import { Cell } from "./cell"
import { TableData } from "./table_data"
import { parse_data_row } from "./parser/parse_data_row"
import { parse_format_row } from "./parser/parse_format_row"

export function tableau(lines: string[]): TableData {

  const [data, format] = split(lines)
  const table_data = new TableData()

  for (const line of data) {
    const row = parse_data_row(line)
    table_data.add_row(row)
  }

  for (const line of format) {
    const format = parse_format_row(line)
    table_data.add_format(format)
  }

  table_data.resolve_spans()

  return table_data
}
```

to:

```ts
import { Cell } from "./cell"
import { TableData } from "./table_data"
import { parse_data_row } from "./parser/parse_data_row"
import { parse_format_row } from "./parser/parse_format_row"
import { merge_column_blocks } from "./parser/parse_column_blocks"

export function tableau(lines: string[]): TableData {

  const [data, format] = split(lines)
  const table_data = new TableData()

  let index = 0
  while (index < data.length) {
    const row = parse_data_row(data[index])
    index++
    index = merge_column_blocks(data, index, row)
    table_data.add_row(row)
  }

  for (const line of format) {
    const format = parse_format_row(line)
    table_data.add_format(format)
  }

  table_data.resolve_spans()

  return table_data
}
```

Note the order: `merge_column_blocks` runs on `row` *before* `table_data.add_row(row)` — so the out-of-range check in Step 3 sees the row's own original field count from its own pipe-delimited line, not a count already padded to match the table's eventual longest row (which `add_row` does internally, and which would give a different, wrong answer if checked after).

The rest of `src/tableau.ts` (`split`, `LineMerger`) is unchanged.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `npx jest __tests__/column_blocks_test.ts`
Expected: `Tests: 9 passed, 9 total`

- [ ] **Step 6: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (295 pre-existing + 9 new = 304 total).

- [ ] **Step 7: Commit**

```bash
git add src/parser/parse_column_blocks.ts src/tableau.ts __tests__/column_blocks_test.ts
git commit -m "$(cat <<'EOF'
Implement column block content parsing (col N {{ ... }})

Ported from the reference Lua implementation
(parser/ast.yue:123-166): a data row can be followed by one or more
"col N {{ ... }}" / "column N {{ ... }}" blocks, each replacing that
row's Nth column (numeric or letter-addressed) with multi-line
content, dedented by its own minimum common leading whitespace.

src/tableau.ts's data-line loop changes from a simple for-of to an
index-based loop with lookahead, since block parsing needs to look
past the line it's attached to.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 2: `<tableau-md>` wrapping and documentation

**Files:**
- Modify: `src/generators/html.ts`
- Modify: `__tests__/test_generate_html.ts`
- Modify: `__tests__/span_html_test.ts`
- Test: `__tests__/tableau_md_test.ts` (new)
- Modify: `README.md`

**Interfaces:**
- Consumes: nothing from Task 1 directly in the implementation, but one of this task's own tests exercises Task 1's output (multi-line block content) to confirm embedded newlines survive escaping/wrapping correctly.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/tableau_md_test.ts`:

```ts
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
```

Then update the two existing HTML-generation test files, which currently assert unwrapped `<td>x</td>` output that this task's change will break.

Replace the full content of `__tests__/test_generate_html.ts` with:

```ts
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
    "<tr><td><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>",
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
```

(Only the one `expected` line inside `test_global_attrs` changed — everything else in the file is identical to before.)

Replace the full content of `__tests__/span_html_test.ts` with:

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
    "<tr><td><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>",
    "<tr><td><tableau-md>c</tableau-md></td><td><tableau-md>d</tableau-md></td></tr>",
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
    `<tr><td colspan="2"><tableau-md>a</tableau-md></td></tr>`,
    "<tr><td><tableau-md>c</tableau-md></td><td><tableau-md>d</tableau-md></td></tr>",
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
    `<tr><td rowspan="2"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "<tr><td><tableau-md>d</tableau-md></td></tr>",
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
    `<tr><td rowspan="2" colspan="2"><tableau-md>a</tableau-md></td></tr>`,
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
    `<tr><td colspan="2"><tableau-md>a</tableau-md></td></tr>`,
    `<tr><td colspan="2"><tableau-md>c</tableau-md></td></tr>`,
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
    "<tr><td><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>",
    "<tr><td><tableau-md>c</tableau-md></td><td><tableau-md>d</tableau-md></td></tr>",
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
    `<tr><td rowspan="2"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "<tr><td><tableau-md>d</tableau-md></td></tr>",
    `<tr><td rowspan="2"><tableau-md>e</tableau-md></td><td><tableau-md>f</tableau-md></td></tr>`,
    "<tr><td><tableau-md>h</tableau-md></td></tr>",
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
    `<tr><td colspan="2" style="background: red"><tableau-md>a</tableau-md></td></tr>`,
    "<tr><td><tableau-md>c</tableau-md></td><td><tableau-md>d</tableau-md></td></tr>",
    "</table>",
  ])
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx jest __tests__/tableau_md_test.ts __tests__/test_generate_html.ts __tests__/span_html_test.ts`
Expected: the 3 new tests in `tableau_md_test.ts` fail (no wrapping exists yet). The updated expectations in `test_generate_html.ts` and `span_html_test.ts` also fail against the current (unwrapped) output — that's expected, they're written against the target state this task produces.

- [ ] **Step 3: Update `src/generators/html.ts`**

Add a new function, and change `do_cell` to use it. Change:

```ts
// CELL level formatting
//
function do_cell(cell: Cell): string {
  const tag = (cell.header || cell.footer) ? "th" : "td"
  return `<${tag}${cell_opener(cell)}>${cell.content}</${tag}>`
}
```

to:

```ts
// CELL level formatting
//
function do_cell(cell: Cell): string {
  const tag = (cell.header || cell.footer) ? "th" : "td"
  return `<${tag}${cell_opener(cell)}><tableau-md>${escape_markdown(cell.content)}</tableau-md></${tag}>`
}

// cell.content is deferred Markdown source, not HTML -- ts-tableau
// intentionally does not render it. Wrapping it in <tableau-md> (a valid,
// inert custom-element name) marks it for a downstream consumer to find,
// unescape, and render with its own Markdown pipeline.
function escape_markdown(content: string): string {
  return content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
```

The rest of `src/generators/html.ts` is unchanged.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx jest __tests__/tableau_md_test.ts __tests__/test_generate_html.ts __tests__/span_html_test.ts`
Expected: all pass.

- [ ] **Step 5: Document the contract in `README.md`**

In `README.md`, insert a new section after the `## Status` section (i.e. right before `## Documentation`):

```md
## Cell Content

Tableau does not render Markdown inside cells itself -- it treats cell
content as opaque text and wraps it in a `<tableau-md>...</tableau-md>`
marker in its HTML output, with the content HTML-entity-escaped. This
keeps the library engine-agnostic: any postprocessor (a remark plugin, a
Quarto/Pandoc filter, or anything else consuming this HTML) is expected to
find `<tableau-md>` elements, HTML-unescape their contents, run its own
Markdown renderer over the result, and replace the element with the
rendered output.

`<tableau-md>` is a valid custom-element name and is otherwise inert --
plain HTML viewers will just show its (unescaped, unrendered) text
content.

```

So the file reads, in order: `# Tableau...`, the bullet list of sample tables, the layout-language paragraph and image, `## Status`, the new `## Cell Content` section, then `## Documentation`, `## Installation`, etc. — everything else in `README.md` is unchanged.

- [ ] **Step 6: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (304 from after Task 1 + 3 new in `tableau_md_test.ts` = 307 total).

- [ ] **Step 7: Commit**

```bash
git add src/generators/html.ts __tests__/test_generate_html.ts __tests__/span_html_test.ts __tests__/tableau_md_test.ts README.md
git commit -m "$(cat <<'EOF'
Wrap cell content in <tableau-md> markers

do_cell() now wraps every cell's (HTML-entity-escaped) content in
<tableau-md>...</tableau-md>, uniformly regardless of whether it came
from a single pipe-delimited field or a col N {{}} block. Neither
ts-tableau nor remark-tableau currently renders Markdown inside cell
content at all (confirmed by a live repro: "_x_" renders as literal
underscores, not <em>) -- this marks that content so a downstream
consumer can find, unescape, and render it with its own Markdown
pipeline, keeping ts-tableau itself engine-agnostic.

Documents the contract in README.md for anyone implementing a
postprocessor.

Updates all existing HTML-generation test expectations to match.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

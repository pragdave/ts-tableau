# Cell spans (rowspan/colspan) design

## Purpose

Tableau's `span` format keyword is recognized by the parser but never
implemented — `FormatSpan` (`src/formats/others.ts`) is an empty marker,
nothing reads `Cell.span`, and `src/generators/html.ts:170` has only a dead
comment (`//span: FormatSpan | null = null`) where merged-cell rendering
should be. There are no tests for it. This spec ports the working span
logic that already exists in the Quarto/Pandoc Lua filter
(`../pandoc-tableau/_extensions/tableau_pre/tableau_pre.lua`,
`merge_spans`/`find_and_mark_contiguous_block`) into `ts-tableau`, adapted
to a simpler algorithm made possible by a stricter invariant (below).

## How `span` works for the document author

`span` is applied within a selector clause, the same way any other
selector-scoped format is (e.g. `[r1-2:c1-2] span`). Every cell the
selector's range covers becomes part of one merged cell, rendered as a
single `<td>`/`<th>` with `rowspan`/`colspan` attributes; the other cells
in the range are omitted from output entirely.

A selector can be compound — multiple `;`-separated range terms in one
clause (`[r1:c1;r2:c2] span`). Each term gets its own independent span
group, not one group covering the union. This was an open design question,
resolved in conversation: guaranteeing one group per `SelTerm` keeps every
group exactly rectangular by construction (a `SelTerm` is always a single
row-range × col-range cross product — see `selectors.ts`), which is what
makes the simplified merge algorithm below correct.

## Architecture

**`Cell` (`src/cell.ts`)** gains four fields, all defaulting to "no span":

```ts
span_group: number | null = null
row_span = 1
col_span = 1
hidden = false
```

`FormatSpan` (`src/formats/others.ts`) is unchanged — it stays an empty
marker class. Its only job is to signal "this clause requests a span";
the actual group identity is assigned by `TableData`, not carried on the
format object.

**Tagging (`TableData`, `src/table_data.ts`)**: a new private counter,
`next_span_group = 1`. In `apply_format(format: FormatRow)`, after the
existing (unchanged) call to `apply_selector_format` that applies the
clause's formats to its flattened cell set, check whether
`format.formats` contains a `FormatSpan`. If so, iterate
`format.selectors.cell_ranges` (the `SelTerm[]` making up the selector) —
not the already-flattened `Selector.cells()` generator, since that
merges all terms into one deduplicated set and would lose per-term
identity. For each `SelTerm`, claim a fresh id from `next_span_group`,
and set `span_group` to that id on every cell the term's own
`cell_coords(table)` yields.

This only applies to selector-scoped formats. `span` was never a
recognized global-format keyword (`parse_global_format` in
`parse_formats.ts` has no `span` case) and this doesn't change — spans
remain selector-only, matching the existing parser.

**Resolving (`TableData`)**: a new method, `resolve_spans()`, called once
by `tableau()` (`src/tableau.ts`) after all data rows and format rows have
been processed, right before returning the `TableData`. It:

1. Walks every cell in the grid, grouping coordinates by `span_group`
   (skipping cells where it's `null`).
2. For each group, computes `min_row`/`max_row`/`min_col`/`max_col` across
   its coordinates. Because every group came from exactly one `SelTerm`
   (a rectangular range), this bounding box exactly equals the group's
   membership — there's no need for Lua's iterative
   contiguous-block-growing scan, which exists there to handle grouping
   schemes that aren't guaranteed rectangular. A direct min/max is
   sufficient and simpler here.
3. Sets `row_span = max_row - min_row + 1` and `col_span = max_col -
   min_col + 1` on the top-left cell (`min_row`, `min_col`) — only when
   greater than 1, leaving the field at its default 1 otherwise (a
   single-cell group, i.e. `span` applied to a single cell with no range,
   is thus a true no-op: it gets a `span_group` but resolves to a 1×1
   "span" that changes nothing about rendering).
4. Marks every other cell in the group `hidden = true`.

**Rendering (`src/generators/html.ts`)**:
- `do_row` skips cells where `cell.hidden` is true — they contribute
  nothing to the row's output.
- `cell_opener` emits `rowspan="N"` / `colspan="N"` attributes (before the
  existing `class`/`style` attributes) whenever the cell's `row_span` /
  `col_span` is greater than 1.

## Data flow summary

```
parse format section
  → each line becomes a FormatRow (selector + formats)
  → tableau() calls table_data.add_format(row) per line
      → apply_format applies formats to cells (existing, unchanged)
      → if formats include FormatSpan: tag cells per-SelTerm with a
        fresh span_group id (new)
  → after all rows/formats processed: table_data.resolve_spans() (new)
      → groups cells by span_group, computes bounding box,
        sets row_span/col_span on the top-left cell, hides the rest
  → generate() renders: hidden cells skipped, spans emitted as attributes
```

## Testing

New test file, e.g. `__tests__/span_test.ts`, covering:

- Horizontal merge: a 1-row, 2-column range with `span` produces one
  `<td colspan="2">` and the second cell is absent from the row's output.
- Vertical merge: a 2-row, 1-column range with `span` produces
  `<td rowspan="2">` on the first row and one fewer `<td>` in the second
  row.
- Rectangular merge: a 2×2 range with `span` produces a single
  `<td rowspan="2" colspan="2">`; the other three cells are absent.
- Single-cell span is a no-op: `[r1:c1] span` produces no `rowspan`/
  `colspan` attributes at all.
- Two independent span groups in the same document (two separate
  format-section lines, each with its own `span`) each merge correctly
  and don't interfere with each other's grouping.
- Compound selector, the case motivating the per-`SelTerm` decision:
  `[r1:c1;r2:c2] span` — two disjoint single cells — produces two
  independent no-op groups (proving they don't get merged into one
  incoherent group covering both).
- Compound selector with ranges: `[r1-2:c1;r3-4:c1] span` — two separate
  2-row vertical ranges in one clause — produces two independent
  `rowspan="2"` cells, not one `rowspan="4"` cell.

## Out of scope

- PDF/Quarto output — this repo only has an HTML generator today; spans
  are implemented for that generator only, matching the scope of
  everything else already in `src/generators/`.
- Any new selector syntax — range selectors already exist and are
  sufficient; this spec adds no parser changes beyond what's needed to
  recognize `FormatSpan` is present in a clause's formats (which the
  parser already does — `span` is already a recognized selector-format
  keyword, see `parse_formats.ts:267`).

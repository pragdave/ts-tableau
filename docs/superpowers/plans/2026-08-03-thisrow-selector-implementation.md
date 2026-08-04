# $thisrow / $tr Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing `SelNumberThisRow` stub in ts-tableau's selector engine actually work, so a column spec can reference "the row currently being iterated" (e.g. `c$tr` for a diagonal), ported from the Quarto/Pandoc filter's `@r`.

**Architecture:** Thread an optional `current_row?: number` parameter through the selector-number resolution chain in `src/selectors.ts` (`SelNumber` and its subclasses, `SelAdjustedNumber`, `SelNumberGenerator`, `SelRowCol`). `SelTerm.cell_coords()` changes from resolving its column spec once before the row loop to resolving it fresh on every row iteration, passing that row through. The parser (`src/parser/parse_selector.ts`) recognizes `$tr`/`$thisrow` and produces a `SelNumberThisRow`.

**Tech Stack:** TypeScript, Jest (`ts-jest`), existing selector/parser infrastructure (`src/selectors.ts`, `src/parser/parse_selector.ts`) — no changes to the data-row parser, `Cell`, `TableData`, or the HTML generator.

## Global Constraints

- Token spelling is `$tr` / `$thisrow` — not the old guide's `@r`. Joins `$r`/`$lastrow`, `$c`/`$lastcol` under one sigil.
- Row-only. No `$thiscol`/`$tc` — out of scope for this plan.
- `$tr`/`$thisrow` is only meaningful inside a *column* spec, resolved once per row as a selector iterates.
- Degenerate uses reject via a thrown error, not silent/arbitrary resolution: `$tr` inside a *row* spec, and `$tr` combined with `span` (via `Selector.rectangles()`/`SelTerm.rectangles()`, which never has a current-row value available).
- `SelTerm.rectangles()` and the `contiguous_values()` helper (added by the span feature) are not modified — they already resolve number generators without a current-row argument, which is what produces the required throw for the span case, with zero changes needed there.

---

### Task 1: Thread current-row resolution through the selector engine

**Files:**
- Modify: `src/selectors.ts`
- Modify: `src/parser/parse_selector.ts`
- Test: `__tests__/selectors.test.ts`

**Interfaces:**
- Produces: `SelNumberThisRow.getValue(table: TableData, current_row?: number): number` — returns `current_row`, throwing if it's `undefined`. No other task or file consumes this directly; it's exercised end-to-end via `Selector.cells(table)` / `Selector.rectangles(table)`.

- [ ] **Step 1: Write the failing tests**

In `__tests__/selectors.test.ts`, replace the existing commented-out line:

```ts
    // "this row":        ["c$thisrow",           cell_list([ one_cell(1,1), one_cell(2,2), one_cell(3,3), one_cell(4,4), ])]
```

with three working entries in the `TESTS` dict (add them right after the `"last col 3"` entry, before the `// skips` comment):

```ts
    "this row (long form)": ["c$thisrow", cell_list([one_cell(1, 1), one_cell(2, 2), one_cell(3, 3), one_cell(4, 4)])],
    "this row (short form)": ["c$tr", cell_list([one_cell(1, 1), one_cell(2, 2), one_cell(3, 3), one_cell(4, 4)])],
    "this row with offset": ["c$tr+1", cell_list([one_cell(1, 2), one_cell(2, 3), one_cell(3, 4), one_cell(4, 5)])],
```

Then, at the end of the file (after the existing `describe('selector_parse', ...)` block, before or after the `TABLE`-building loop — placement doesn't affect correctness since Jest registers test bodies as closures and only runs them after the whole file has loaded, but for readability add it right after the first `describe` block), add:

```ts
describe("$tr / $thisrow degenerate cases", () => {
  test("$tr in a row spec throws", () => {
    const src = new StringScanner("r$tr]")
    const result = parse_selector(src)
    expect(() => Array.from(result.cells(TABLE))).toThrow()
  })

  test("$tr combined with span throws", () => {
    const src = new StringScanner("c$tr]")
    const result = parse_selector(src)
    expect(() => Array.from(result.rectangles(TABLE))).toThrow()
  })
})
```

(`StringScanner`, `parse_selector`, and `TABLE` are already imported/defined earlier in this file — no new imports needed.)

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx jest __tests__/selectors.test.ts`
Expected: FAIL. The three new `TESTS` entries fail because `SelNumberThisRow.getValue()` currently returns the literal `7` regardless of which row is current, so every row of the diagonal resolves to column 7 instead of the row's own number (and column 7 doesn't exist in the 4x5 test table, so `cell_at` in downstream code would be involved in a mismatch — for this test, `Selector.cells()` doesn't call `cell_at`, so the actual failure is a `toEqual` mismatch, not a throw). The two "degenerate cases" tests fail because `$tr`/`$thisrow` aren't recognized by the parser yet at all — `src.scan(/\$(lastrow|lastcol|thisrow|c|r|t)/)` matches `$tr`'s `$t` prefix as far as `t`, then `getMatch()` is `"$t"`, which falls through to `default: throw "Unknown number type"` — so these two currently throw for the *wrong* reason (an "Unknown number type" parse error, not the intended "no current row available" resolution error), which is still a passing `toThrow()` today. That's fine — the point of Step 2 is confirming the three positive-case tests fail; the two throw-tests are not a meaningful signal here since they'll pass in this intermediate state for the wrong reason and continue passing correctly after the real implementation, for the right reason.

- [ ] **Step 3: Update `src/selectors.ts`**

Change `SelNumber` (the abstract base class) from:

```ts
export abstract class SelNumber {
  abstract getValue(table: TableData): number;
  abstract syntax_value(): string;
```

to:

```ts
export abstract class SelNumber {
  abstract getValue(table: TableData, current_row?: number): number;
  abstract syntax_value(): string;
```

Change `SelNumberInt.getValue` from:

```ts
  getValue(_: TableData) {
    return this.value;
  }
```

to:

```ts
  getValue(_table: TableData, _current_row?: number) {
    return this.value;
  }
```

Change `SelNumberLastRow.getValue` from:

```ts
  getValue(table: TableData) {
    return table.row_count();
  }
```

to:

```ts
  getValue(table: TableData, _current_row?: number) {
    return table.row_count();
  }
```

Change `SelNumberLastCol.getValue` from:

```ts
  getValue(table: TableData) {
    return table.col_count();
  }
```

to:

```ts
  getValue(table: TableData, _current_row?: number) {
    return table.col_count();
  }
```

Change `SelNumberThisRow.getValue` from:

```ts
  getValue(_table: TableData) {
    return 7;
  }
```

to:

```ts
  getValue(_table: TableData, current_row?: number) {
    if (current_row === undefined) {
      throw "$thisrow (or $tr) can only be used inside a column spec, resolved per row -- it has no meaning in a row spec or inside a span selector"
    }
    return current_row;
  }
```

Change `SelAdjustedNumber.getValue` from:

```ts
  getValue(table: TableData): number {
    return this.number.getValue(table) + this.offset;
  }
```

to:

```ts
  getValue(table: TableData, current_row?: number): number {
    return this.number.getValue(table, current_row) + this.offset;
  }
```

Change `SelNumberGenerator.cell_coords` from:

```ts
  *cell_coords(table: TableData): Generator<number> {
    const from = this.from.getValue(table);
    const to = this.to.getValue(table);
    for (let i = from; i <= to; i++) {
      let n = i
      if (this.skip.is_relative())
        n -= from
      n += this.skip.offset
      if ((n % this.skip.skip) == 0)
        yield i
    }
  }
```

to:

```ts
  *cell_coords(table: TableData, current_row?: number): Generator<number> {
    const from = this.from.getValue(table, current_row);
    const to = this.to.getValue(table, current_row);
    for (let i = from; i <= to; i++) {
      let n = i
      if (this.skip.is_relative())
        n -= from
      n += this.skip.offset
      if ((n % this.skip.skip) == 0)
        yield i
    }
  }
```

Change `SelRowCol.cell_coords` from:

```ts
  *cell_coords(table: TableData): Generator<number> {
    for (let snr of this.numbers) {
      for (let index of snr.cell_coords(table)) {
        yield index;
      }
    }
  }
```

to:

```ts
  *cell_coords(table: TableData, current_row?: number): Generator<number> {
    for (let snr of this.numbers) {
      for (let index of snr.cell_coords(table, current_row)) {
        yield index;
      }
    }
  }
```

Change `SelTerm.cell_coords` from:

```ts
  *cell_coords(table: TableData): Generator<CellCoords> {
    const row_iterator = this.row
      ? this.row.cell_coords(table)
      : table.all_row_numbers();
    const col_iterator = this.col
      ? this.col.cell_coords(table)
      : table.all_col_numbers();

    const persistent_cols = Array.from(col_iterator)

    for (let row of row_iterator) {
      for (let col of persistent_cols) {
        yield { row: row, col: col };
      }
    }
  }
```

to:

```ts
  *cell_coords(table: TableData): Generator<CellCoords> {
    const row_iterator = this.row
      ? this.row.cell_coords(table)
      : table.all_row_numbers();

    for (let row of row_iterator) {
      const col_iterator = this.col
        ? this.col.cell_coords(table, row)
        : table.all_col_numbers();
      for (let col of col_iterator) {
        yield { row: row, col: col };
      }
    }
  }
```

Do **not** modify `SelTerm.rectangles()`, `Selector.rectangles()`, or the module-level `contiguous_values()` helper — they already call `SelNumberGenerator.cell_coords(table)` with no second argument, which is exactly what makes `$tr` inside a `span` selector throw (via `SelNumberThisRow.getValue` receiving `current_row === undefined`).

- [ ] **Step 4: Update `src/parser/parse_selector.ts`**

Change the `number()` function from:

```ts
function number(src: StringScanner): SelNumber {
  if (src.scan(/\$(lastrow|lastcol|thisrow|c|r|t)/))
    switch (src.getMatch()) {
      case "$c":
      case "$lastcol": return new SelNumberLastCol()

      case "$r":
      case "$lastrow": return new SelNumberLastRow()

      // case "$t":
      // case "$thisrow": return new SelNumberThisRow()
      default: throw "Unknown number type"
    }
  else
    return new SelNumberInt(int(src))
}
```

to:

```ts
function number(src: StringScanner): SelNumber {
  if (src.scan(/\$(lastrow|lastcol|thisrow|tr|c|r)/))
    switch (src.getMatch()) {
      case "$c":
      case "$lastcol": return new SelNumberLastCol()

      case "$r":
      case "$lastrow": return new SelNumberLastRow()

      case "$tr":
      case "$thisrow": return new SelNumberThisRow()

      default: throw "Unknown number type"
    }
  else
    return new SelNumberInt(int(src))
}
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `npx jest __tests__/selectors.test.ts`
Expected: all tests in the file pass, including the 3 new positive-case entries and the 2 degenerate-case tests.

- [ ] **Step 6: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass. Before this task, the full suite has 289 tests; after adding 5 (3 `TESTS` entries + 2 degenerate-case tests), expect 294 passed, 294 total.

- [ ] **Step 7: Commit**

```bash
git add src/selectors.ts src/parser/parse_selector.ts __tests__/selectors.test.ts
git commit -m "$(cat <<'EOF'
Implement $thisrow / $tr (current-row selector)

Makes the existing SelNumberThisRow stub real, ported from the
Quarto/Pandoc filter's @r with a different token spelling ($tr/
$thisrow, joining $r/$c/$lastrow/$lastcol under one sigil).

Threads an optional current_row through the selector-number
resolution chain (SelNumber and subclasses, SelAdjustedNumber,
SelNumberGenerator, SelRowCol). SelTerm.cell_coords() now resolves its
column spec fresh on every row iteration instead of once before the
row loop, so a column spec can depend on which row is current.

Degenerate uses (inside a row spec, or combined with span) reject via
a thrown error -- SelTerm.rectangles() and contiguous_values() are
untouched, and already call cell_coords() without a current-row
argument, which is what produces the throw for the span case.

Tests adapted from pandoc-tableau's own Lua test suite
(src/parser/test_parse_selector.yue, src/test_iterate_selector.yue).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

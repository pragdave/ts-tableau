# `$thisrow` / `$tr` (current-row selector) design

## Purpose

The original Quarto/Pandoc `tableau` filter supports a dynamic selector
token, `@r`, meaning "the row currently being iterated" — used inside a
*column* spec to build diagonal or triangular selections, e.g. `c@r`
(the diagonal) or `c2-@r~1` (a growing triangle, used to shade the
multiplication table in the ported guide).

`ts-tableau`'s selector model has a stub for this (`SelNumberThisRow` in
`src/selectors.ts`), but it's non-functional: `getValue()` returns the
literal `7`, and the parser's `$thisrow`/`$t` recognition branch is
commented out. This spec makes it real.

Found while investigating: `pandoc-tableau`'s own test suite
(`src/parser/test_parse_selector.yue:171-183`,
`src/test_iterate_selector.yue:79-83`) has directly adaptable coverage for
this exact feature — both a parser-level test (resolving `c@r`/`c@r~2`
given a current-row context) and an end-to-end test (`r:c@r` → the
diagonal, `r:c@r+1` → an offset diagonal). These get rewritten in
ts-tableau's Jest idiom as part of this work.

## Decisions

- **Token spelling: `$tr` / `$thisrow`**, not the old guide's `@r`. This
  keeps every "special number" token under one sigil (`$r`/`$lastrow`,
  `$c`/`$lastcol`, and now `$tr`/`$thisrow`) rather than introducing a
  second one. Updating the ported guide's `@r` examples to match is a
  separate follow-up (see "Out of scope") — better done once this is
  implemented and tested, so the updated examples can be verified against
  a real, working implementation rather than converted speculatively.
- **Row-only, no `$thiscol`/`$tc` for now.** The original only ever
  demonstrates the current-*row* case; nothing in the ported guide needs
  a current-*column* equivalent inside a row spec. YAGNI — add it later
  if a real need shows up, following the same mechanism.
- **Degenerate uses are rejected with a thrown error**, not silently
  resolved into something arbitrary. This falls out of the mechanism
  below rather than needing explicit special-case code:
  - `$tr` inside a *row* spec (e.g. `r$tr`) — row resolution never has a
    current-row value available (chicken-and-egg: it's what's being
    resolved), so `SelNumberThisRow.getValue()` throws when its
    `current_row` argument is `undefined`.
  - `$tr` combined with `span` (e.g. `[c$tr] span`) — confirmed by
    reading `rectangles()`/`contiguous_values()` in `src/selectors.ts`:
    they resolve column generators via `SelNumberGenerator.cell_coords(table)`
    with no current-row argument at all (span's rectangle model computes
    each column generator's values once, independent of which row within
    the row generator is current — incompatible with a per-row-dynamic
    value by construction). This throws for the same reason as the row-spec
    case, with no changes needed to the span code.

## Architecture

Thread an optional `current_row?: number` parameter through the existing
resolution chain in `src/selectors.ts`:

- `SelNumber.getValue(table, current_row?)` (abstract, plus all 4
  subclasses — `SelNumberInt`, `SelNumberLastRow`, `SelNumberLastCol` all
  ignore the new parameter; `SelNumberThisRow` returns it, throwing if
  it's `undefined`)
- `SelAdjustedNumber.getValue(table, current_row?)` — passes it through
  to `this.number.getValue(...)`
- `SelNumberGenerator.cell_coords(table, current_row?)` — passes it
  through to `this.from.getValue(...)` / `this.to.getValue(...)`
- `SelRowCol.cell_coords(table, current_row?)` — passes it through to
  each `SelNumberGenerator`'s `cell_coords(...)`

`SelTerm.cell_coords()` changes from resolving the column spec once,
before the row loop starts, to resolving it fresh on every row iteration,
passing that row as `current_row`:

```ts
*cell_coords(table: TableData): Generator<CellCoords> {
  const row_iterator = this.row
    ? this.row.cell_coords(table)
    : table.all_row_numbers();

  for (const row of row_iterator) {
    const col_iterator = this.col
      ? this.col.cell_coords(table, row)
      : table.all_col_numbers();
    for (const col of col_iterator) {
      yield { row, col };
    }
  }
}
```

(Previously: `const persistent_cols = Array.from(col_iterator)` was
computed once, outside the row loop, then reused for every row. That's
exactly what made `$tr` impossible — the column set had no way to depend
on which row was current.)

The row branch (`this.row.cell_coords(table)`) is **not** changed to
accept a current-row parameter — there is no "current something" to
thread into row resolution, by design (no `$thiscol` in scope).

`SelTerm.rectangles()` and the `contiguous_values()` helper it uses
(added by the span feature) are **not modified at all**. They already
call `SelNumberGenerator.cell_coords(table)` with a single argument, which
remains valid — `current_row` simply stays `undefined` on that path,
producing the intended throw if `$tr` shows up there.

**Parser** (`src/parser/parse_selector.ts`): the `number()` function's
existing regex already lists `thisrow`/`t` as alternatives
(`/\$(lastrow|lastcol|thisrow|c|r|t)/`) but the switch statement's case
for them is commented out, falling through to `throw "Unknown number
type"`. Change the regex to `/\$(lastrow|lastcol|thisrow|tr|c|r)/` (drop
the bare `t`, add `tr`) and uncomment/complete the case:

```ts
case "$tr":
case "$thisrow": return new SelNumberThisRow()
```

## Testing

New tests, adapted from `pandoc-tableau`'s Lua suite into ts-tableau's
existing Jest idiom:

- `__tests__/selectors.test.ts` (extends the existing `TestCases` dict,
  same 4-row × 5-col fixture already used there):
  - `r:c$tr` resolves to the diagonal: `{1,1}, {2,2}, {3,3}, {4,4}`
    (adapted from `test_iterate_selector.yue:80`, adjusted for this
    file's actual fixture size).
  - `r:c$tr+1` resolves to the diagonal shifted by one column: `{1,2},
    {2,3}, {3,4}, {4,5}` (adapted from `test_iterate_selector.yue:83`).
- New file or addition covering the degenerate cases:
  - `r$tr` (or any selector using `$tr`/`$thisrow` inside a row spec)
    throws.
  - `[c$tr] span` throws.

## Out of scope

- `$thiscol`/`$tc` (current column, for use inside a row spec) — not
  implemented; add later via the identical mechanism if needed.
- Updating the ported guide's `@r` examples to `$tr`/`$thisrow` — tracked
  as a follow-up once this is implemented and tested, not part of this
  implementation task itself.

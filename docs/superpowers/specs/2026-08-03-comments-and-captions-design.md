# Comments and captions design

## Purpose

Two related, previously-unimplemented pieces of the layout section syntax,
ported from the reference implementation
(`../pandoc-tableau/src/parser/parse_layout_row.yue`):

1. **Comments**: a layout line starting with `--` (optionally preceded by
   whitespace) should be ignored entirely.
2. **Captions**: a layout line starting with `#` (any number of them) or
   `:`, followed by whitespace, sets the table's caption to the rest of
   the line.

Investigating this surfaced two adjacent, pre-existing bugs in the same
code region, fixed as part of this work (confirmed in conversation):

- Comments already silently no-op in `ts-tableau` today — but only by
  accident. `parse_global_format`'s alternation chain
  (`src/parser/parse_formats.ts`) ends in a `log(src)` fallback that
  `console.log`s `"No match", ...` and returns `false` for *any*
  unrecognized text, which then falls through to `null` and is silently
  dropped by the caller. This means a `--comment` line and a genuine typo
  in a global-format line are currently indistinguishable — both vanish
  silently, the former intentionally (from this session's perspective) and
  the latter is a real correctness gap. Confirmed live: `-- this is a
  comment` on its own line produces a `No match -- this is` console
  message but the table still renders correctly (the comment itself is a
  no-op; only the noise is the problem).
- `parse_selector_formats` (`src/parser/parse_formats.ts:89`) has
  `if (!src.hasTerminated)` — missing parentheses. `hasTerminated` is a
  method; referencing it without calling it evaluates to a function
  reference, which is always truthy in JS, so `!src.hasTerminated` is
  always `false` and this check has never actually fired. Malformed
  selector-format lines have always silently passed instead of throwing
  the intended `unrecognized format: ...` error.

Both are fixed here since implementing comments makes "this is
intentionally ignored" and "this is a mistake" distinguishable for the
first time, and the two bugs are the same class of issue in the same file.

## Comments

`parse_format_row` (`src/parser/parse_format_row.ts`) gains a check at the
very top, before the existing selector-bracket check: a new regex,
`/^\s*(--|$)/`, matching both blank/whitespace-only lines (already
harmless today, but now handled explicitly rather than by accident) and
`--`-prefixed lines (with or without leading whitespace, matching the
reference — comments don't require a leading blank first). On a match,
return `new FormatRow(null, [])` immediately — a no-op, without ever
reaching `parse_global_formats` or its `log()` fallback.

## Captions

**Syntax**: `/^\s*(?:#+|:)\s+(.*)$/` — one or more `#` characters, or a
single `:`, followed by required whitespace, then the caption text (rest
of the line, no further parsing of it as formats). This is checked in
`parse_format_row` immediately after the comment check. A caption line is
exclusively a caption — matching the reference, nothing else can share the
line with it (the regex consumes to end-of-line by construction, so there
is no remaining text to interpret as other formats even if someone tried).

**Model**: a new `FormatCaption` class in `src/formats/others.ts`
(alongside the existing `FormatBoxed`, `FormatFooter`, etc. — a plain
`{ text: string }` holder, following the same pattern as those). On a
caption-line match, `parse_format_row` returns
`new FormatRow(null, [new FormatCaption(text)])` — reusing the existing
global-format application machinery rather than introducing a new
line-type concept, since `TableData.apply_global_format` already
dispatches on format class via a `switch`.

`TableData.global_attr` (`src/table_data.ts`) gains a `caption: string |
null` field (default `null`). `apply_global_format`'s switch gains a case
setting it from the `FormatCaption`.

**Rendering**: `src/generators/html.ts` emits
`<caption><tableau-md>escaped-text</tableau-md></caption>` as the `<table>`
element's first child (a real HTML `<caption>` — the semantically correct,
browser-recognized element for this purpose, which must be the table's
first child) whenever `global_attr.caption` is non-null. Reuses the
existing `escape_markdown` helper (added for cell content) rather than
duplicating escaping logic — this was already anticipated when
`<tableau-md>` was designed ("captions get the same treatment once
implemented").

## Error-handling tightening (same code region)

- `parse_global_formats`/`parse_global_format`: since comments and blank
  lines are now intercepted explicitly before this code ever runs, the
  `log()` fallback is no longer needed to keep those cases silent — change
  the alternation chain to drop `log(src)`, and make
  `parse_global_formats` throw (`` `unrecognized format: ${src.peek(30)}` ``,
  matching the existing message format `parse_selector_formats` already
  uses) when the loop ends without the scanner being fully consumed. The
  `log()` function itself is removed as dead code once nothing references
  it.
- `parse_selector_formats`: fix the missing parentheses,
  `if (!src.hasTerminated())`, so its existing (previously dead) error
  check actually fires.

## Testing

Adapted from `../pandoc-tableau/src/parser/test_row_layout.yue`:

- Blank line, whitespace-only line, `--comment`, and `  --comment` (with
  leading whitespace) all parse to a no-op format row (no formats, no
  selector).
- `: a caption`, `# a caption`, and `### a caption` all set the table's
  caption to `"a caption"` — the number of `#`s doesn't matter.
- A caption line's text is used verbatim, including any leading/trailing
  content shape decisions already established for HTML rendering (escaped
  the same way cell content is).

New tests for the error-handling fixes:

- A global-format line with genuinely unrecognized text (not blank, not a
  comment, not valid format syntax) throws.
- A selector-format line with genuinely unrecognized trailing text after
  a valid format throws (this is the `hasTerminated()` fix — needs a case
  that previously silently passed).

New rendering test:

- A table with a caption set renders `<caption><tableau-md>...</tableau-md></caption>`
  as the first child of `<table>`, before any `<tr>` rows.

## Out of scope

- No change to `Cell` or any per-cell format — caption is table-level
  only, matching the reference (`context: table only` — it's never valid
  inside a selector-scoped line, and the regex-based exclusivity above
  means there's no ambiguity to resolve).
- No new comment syntax elsewhere (e.g. in the data section) — this spec
  covers only the layout/format section, matching the reference.

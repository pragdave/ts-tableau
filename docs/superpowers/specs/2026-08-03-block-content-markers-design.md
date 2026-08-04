# Block content parsing + `<tableau-md>` markers design

## Purpose

Two related, previously-unimplemented pieces of the original Quarto/Pandoc
`tableau` filter, tackled together because the second only makes sense in
terms of the first's output:

1. **Block content** (`col N {{ ... }}`) — lets a data row's cell hold
   multi-line, block-level Markdown content (paragraphs, nested divs, code
   blocks) instead of a single inline pipe-delimited field.
2. **Markdown rendering of cell content is currently missing entirely.**
   Confirmed live: `_Alpha Ursae_|plain text` renders as
   `<td>_Alpha Ursae_</td>` — the literal underscores, not `<em>`. The
   original renders cell content via Pandoc's own Markdown parser
   (`tableau_pre.lua`'s `md2ast`, calling `pandoc.read()`); ts-tableau has
   no equivalent step, and `generate()` just interpolates `cell.content`
   as a raw string. Nothing downstream can fill this gap either —
   `remark-tableau` emits a raw HTML mdast node, and remark's own pipeline
   treats raw HTML as opaque, so it won't re-parse Markdown syntax found
   inside it.

This spec covers only the **ts-tableau side**: parsing block content, and
marking *all* cell content (single-line or block, uniformly) as "this is
Markdown source, not HTML, and needs rendering" via a wrapper element that
any downstream consumer can find and process. **Actually rendering that
Markdown is explicitly out of scope here** — that's a second, separate
piece of work in `remark-tableau` (or any other consumer), designed
separately once this ships, since its design depends on this one's exact
output format.

## Part A: Parsing `col N {{ ... }}`

Ported from the reference implementation's algorithm
(`../pandoc-tableau/src/parser/ast.yue:123-166`, functions `col_text_re`,
`merge_following_column_blocks`, `parse_data`), adapted to
`src/tableau.ts`.

**Syntax**: a line matching `^(column|col)\s*([1-9][0-9]?|[a-z])\s*\{\{\s*$`
(case-insensitive on the `col`/`column` keyword), followed by zero or more
content lines, followed by a line matching `^\s*\}\}`. The column number
is either a positive integer or a single letter (`a`→1, `b`→2, ... —
ported for full fidelity with the original, alongside numeric addressing).
Note the alternation order — `column` must be tried before `col`, since
regex alternation takes the first matching branch rather than the longest
one; `col` before `column` would parse `column2 {{` as `col` + letter-column
`u` and then fail to match the required trailing `{{`.

**Where it can appear**: only immediately following a normal data row
(itself parsed from one pipe-delimited line), never as the first thing in
the data section. Multiple such blocks can follow one row consecutively,
each targeting a different column of that same row — matches the guide's
own example (`docs/guide/tableau-guide.qmd`, "Longer column content"
section), where one row has both a `col 2 {{...}}` and a `col 3 {{...}}`
block attached.

**Behavior**: `src/tableau.ts`'s data-line loop changes from a simple
`for (const line of data)` to an index-based loop with lookahead (the
current loop has no way to look ahead at the next line, which this
requires). After parsing a row from one line via the existing
`parse_data_row`, check subsequent lines for a block header; if found,
consume lines until the closing `}}`, collecting the intervening lines —
error (throw, matching this codebase's existing convention of throwing
plain strings for malformed input, e.g. the `===`-in-format-section case
already in `tableau.ts`) if EOF is reached before a closing `}}` is found.

**Normalization**: matching the original's `normalize()`/`expandtabs()`,
tabs are expanded (tab stops of 8) and then the block's lines are dedented
by its own minimum common leading-whitespace amount — preserves relative
indentation of nested structures (e.g. a Quarto `::: {.callout-note}`
div) while stripping the block's own base indentation from the source
document.

**Result**: the captured, normalized lines are joined with `\n` and
replace that cell's `content` entirely — `Cell.content` stays a plain
`string` (no model change needed; multi-line content is just a string
containing embedded `\n` characters, same type as today).

**Out-of-range columns are silently ignored** — a `col N {{...}}` block
whose `N` exceeds the row's actual width does nothing, matching this
session's established convention (see the out-of-bounds selector-coordinate
fix from the `$thisrow` work) rather than throwing on a case that's more
"garbage in" than a real error.

## Part B: `<tableau-md>` markers

`src/generators/html.ts`'s `do_cell` changes to wrap **every** cell's
content — regardless of whether it came from a single-line field or a
`col N {{...}}` block, no special-casing by origin or length — in
`<tableau-md>...</tableau-md>` before HTML-entity-escaping it:

```
<td>content</td>   -->   <td><tableau-md>escaped-content</tableau-md></td>
```

`<tableau-md>` (hyphenated, not `<md>` or a namespaced `<tableau:md>`) is a
valid custom-element name per the HTML spec, so it's inert and
collision-safe in any HTML parser without needing an `xmlns` declaration
or any other supporting machinery.

**Escaping order matters**: `&` → `&amp;` first (to avoid double-escaping
entities produced by the later replacements), then `<` → `&lt;`, then
`>` → `&gt;`. This is deferred Markdown *source text*, not real markup —
it must round-trip through any HTML parser (including `rehype-raw`,
`DOMParser`, etc.) as inert text content, unmodified, until a consumer
deliberately un-escapes and Markdown-renders it.

**Captions**: not implemented yet (tracked separately), but when they are,
they should get the same `<tableau-md>` treatment — noted here so that
work doesn't have to rediscover this decision; not part of this spec's
deliverable.

## Part C: Document the contract

Add a new section to `README.md` explaining `<tableau-md>` to anyone
implementing a postprocessor:

- What it wraps (every cell's content, verbatim Markdown source).
- That its contents are HTML-entity-escaped and must be un-escaped before
  Markdown rendering.
- That finding, rendering, and unwrapping these elements is the
  *consumer's* responsibility — ts-tableau intentionally does not render
  Markdown itself, to stay engine-agnostic across HTML-only use, the
  `remark-tableau` plugin, and any future integration (e.g. a Quarto/Pandoc
  path).

## Testing

- **Block-content parsing** (new tests in a suitable `__tests__/` file,
  following existing patterns — e.g. extending `__tests__/data_row_test.ts`
  or a new file):
  - A row followed by one `col N {{...}}` block: the target column's
    content is replaced; other columns keep their pipe-delimited values.
  - A row followed by multiple consecutive blocks targeting different
    columns.
  - `column` keyword (not just `col`) is recognized.
  - Letter-based column addressing (`cola`/`colb`) resolves to the same
    columns as `col1`/`col2`.
  - Dedenting: a block with common leading whitespace across all its
    lines has that whitespace stripped uniformly; relative indentation
    within the block is preserved.
  - A block targeting an out-of-range column is silently ignored (row's
    other cells are unaffected, no error).
  - A block missing its closing `}}` (reaches EOF first) throws.
  - A `col N {{` line with no preceding data row does not trigger block
    parsing (it's just parsed as an ordinary, oddly-worded single data row).

- **`<tableau-md>` wrapping** (extending `__tests__/test_generate_html.ts`
  or similar):
  - A simple single-word cell is wrapped: `<td><tableau-md>x</tableau-md></td>`.
  - A cell containing `&`, `<`, `>` is correctly HTML-entity-escaped
    inside the wrapper.
  - Multi-line block content (from Part A) is wrapped with its embedded
    `\n` characters preserved verbatim inside `<tableau-md>`.

## Out of scope

- Actually rendering the Markdown inside `<tableau-md>` — a separate
  `remark-tableau`-side (or other consumer-side) piece of work, designed
  once this ships.
- Table captions (`# Caption text`) — not implemented; the note in Part B
  is forward-looking context only.
- Any change to `Cell`'s model beyond what already exists — `content`
  stays a plain `string`.

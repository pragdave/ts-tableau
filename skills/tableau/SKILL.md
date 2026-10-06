---
name: tableau
description: Write Tableau tables — ```tableau code blocks in Markdown with the data first, then a layout section of cell selectors and formats (headers, spans, lines, alignment, shading, captions, widths). Use when writing or editing a table that plain Markdown tables can't express.
---

# Writing Tableau Tables

Tableau separates a table's **data** from its **layout**. The data is rows
of pipe-separated cells; the layout, after a line of `===`, says how to
style them. It is written in a Markdown code block with the language
`tableau`:

~~~~
~~~ tableau
Animal   | Lifespan
|        | Average | Max
Badger   | 8       | 14
Elephant | 40      | 70
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-$r:c2-$c] align(r)
~~~
~~~~

The layout section is optional. Without it you get a plain table with
default alignment.

## Data section

```
| a | b | c |        // pipes separate cells
d | e | f            // leading/trailing pipes are optional...
| | h | i            // ...unless the cell next to them is empty
```

- **Empty first cell needs a leading pipe.** Without it, leading spaces are
  ignored and the row's data shifts left one column.
- **No `|---|` separator row.** Tableau does not read one; it would show up
  as a row of minus signs. Headers come from the layout (`[r1] header`).
- **Cells are Markdown.** `_italic_`, `**bold**`, `` `code` ``, links and
  `$math$` all work.
- **A blank line** is a half-height spacer row. It still counts as a row
  when you number rows for selectors.
- **`=empty`** on its own line is a full-height row of empty cells.
- **Escapes:** `\|` is a literal pipe; `\\` a literal backslash.
- **Continuation:** a line ending in `\` joins the next line.

### Longer cell content: column blocks

After a data row, `col N {{ … }}` (or `column N`, or a letter: `col b`)
fills column N of that row with block-level Markdown — paragraphs, lists,
code:

```
Cicero | |
col 2 {{
At vero eos et accusamus et iusto odio dignissimos ducimus.

- and a list
}}
===
align(l)
```

## Layout section

Each line is either a table-level format, or `[selector] format…` applied
to the selected cells. Several formats may share a line. Blank lines and
lines starting `--` are ignored.

```
hlines vlines                 // table-level: no selector
[r1] header                   // cell-level: row 1
[r2:c3] bg(shade2) small      // two formats on one cell
-- this is a comment
```

### Caption

`# text` (or `## text`, or `: text`) sets the caption. It renders below the
table. The last caption line wins.

### Cell selectors

| Selector | Selects |
|---|---|
| `r2` | every cell in row 2 |
| `c3` | column 3 in every row |
| `r2:c3` | the cell at row 2, column 3 |
| `r1,3` / `c2,4,5` | rows 1 and 3 / columns 2, 4, 5 |
| `r2-5` / `c2-4` | a range of rows / columns |
| `r1,3:c2,4` | every combination (outer product) |
| `[r1;c1]` | `;` joins independent selectors: row 1 *and* column 1 |
| `$r`, `$c` | the last row, the last column (`$lastrow`, `$lastcol`) |
| `$tr` | the row currently being matched (`$thisrow`) |
| `$r~1`, `$tr+2` | arithmetic: `~` subtracts (`-` already means range), `+` adds |
| `r2-8%even`, `%odd`, `%3` | only rows whose number is even / odd / a multiple of 3 |
| `r3-8%%even` | `%%` counts from the start of the range: rows 3, 5, 7 |

Rows and columns are numbered from 1. Some useful combinations:

```
[r3-$r:c2-$c] align(r)        // the body, minus the label column
[r2-$r:c$tr] line(lb)         // the diagonal: column number = row number
[r2-$r:c2-$tr~1] bg(shade6)   // everything left of the diagonal
[r1-$r%%4] line(b)            // a rule under every fourth row
[r1-8%even:c1-8%odd] bg(shade6)   // half of a chessboard
```

### Formats

| Format | Where | Meaning |
|---|---|---|
| `header` / `head` | cells | header cells (usually `[r1]` or `[c1]`) |
| `footer` / `foot` | cells | footer cells (usually `[r$r]`) |
| `span` | cells | merge the selected block into one cell (content from its top-left cell) |
| `align(` `l c r j` + `t m b` `)` | both | horizontal and/or vertical alignment |
| `l` `c` `r` `j` `t` `m` `b`, `lt`, `cm`… | both | shorthand for `align(…)` |
| `lines(` `t b l r x` `)` / `line(…)` | cells | rules on the top/bottom/left/right of each cell; `x` boxes it |
| `hlines` / `vlines` | table | rules between every row / column |
| `boxed` / `box` | table | a box round the whole table |
| `bg(color)` / `fg(color)` | both | background / text color |
| `small` `xsmall` `xxsmall` (`sm` `xsm` `xxsm`) | both | smaller text |
| `large` `xlarge` `xxlarge` (`lg` `xlg` `xxlg`) | both | larger text |
| `normal` | both | back to normal size, overriding a wider `small`/`large` |
| `width(n)` / `w(n)` | both | `width(.5)` is a ratio of the line (has a decimal point, ≤ 1.0); `width(12)` is about 12 characters |
| `.name` / `style(name)` / `class(name)` | both | add a CSS class; classes accumulate |

**Colors** are `shade1` … `shade9` (a palette that adapts to light and dark
mode; prefer these), a hex value (`#cdf`, `#94a8cb`), or a CSS color name
(`crimson`). A color only ever appears inside `bg(…)` or `fg(…)`.

### Spans

`span` merges each contiguous block the selector describes:

```
[r1-3:c1] span          // one cell, three rows tall
[r1:c2-3] span          // one cell, two columns wide
[r1-2:c2-4] span        // one 2×3 cell: dash ranges make one block
[r1-2:c2,3,4] span      // three 2×1 cells: a comma list makes separate blocks
```

Style a spanned cell through its top-left cell: `[r1:c2] bg(shade3)`.
Blocks must be contiguous (no `%even`) and must not overlap; both are
errors.

## Common patterns

### Header row and column with a caption
```
| x | 1 | 2 | 3 |
| 1 | 1 | 2 | 3 |
| 2 | 2 | 4 | 6 |
===
# Times table
[r1;c1] header
```

### APA-style table (rules only where they mean something)
```
| Parameter | 9-year-olds | | 16-year-olds | | p
|           | M  | SD | M  | SD |
Asymptote   | .843 | .135 | .877 | .082 | .347
Crossover   | 759  | 87   | 694  | 42   | .006
===
# Curve-fitting results
small
[c1] align(l)
[r3-$r:c2-$c] align(r)
[r1:c2-3;r1:c4-5] span
[r1-2:c1,6] span
[r1;r3] line(t)
[r$r] line(b)
[r1:c2-5] line(b)
```

### Zebra striping
```
[r1] header
[r2-$r%%2] bg(shade5)
```

## Gotchas

- **An unknown format is an error for the whole table**, reported as
  `unrecognized format: …`. Check spelling — and remember table-only
  formats (`hlines`, `vlines`, `boxed`) are rejected after a selector, and
  cell-only formats (`header`, `footer`, `span`, `lines`) without one.
- **Blank data lines are rows.** A spacer between groups shifts the row
  numbers of everything after it.
- **Use `~` for subtraction** in selectors. `r$r-1` is read as the range
  "last row to row 1", which selects nothing — silently, with no error.
- **No Markdown header separator.** Mark headers in the layout instead.

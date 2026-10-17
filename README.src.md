# Tableau: Enhanced Markdown Tables

Tableau separates a table's data from its layout. You write the rows as
plain pipe-separated text, then, after a line of `===`, say how they
should look: headers, spans, rules, alignment, shading, captions. It is
intended as a preprocessor for Markdown and similar markup languages, but
can be used standalone to generate HTML.

Try it in the [playground](https://pragdave.github.io/ts-tableau/playground/),
or read the [guide](https://pragdave.github.io/ts-tableau/).

## Examples

A header, a footer, and rules between the rows:

```tableau source-open
Name  | Score | Grade
Alice | 92    | A
Bob   | 81    | B
Carol | 74    | C
Average | 82  |
===
[r1] header
[r$r] footer
hlines
```

Selectors can be dynamic. `$tr` is the row being styled, so `c$tr` picks
out the diagonal, and `c2-$tr~1` everything to its left:

```tableau source
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
# Times table
[r1;c1] header

-- $tr is the row being matched, so c$tr is the diagonal
[r2-$r:c$tr] line(lb)

-- everything left of the diagonal: the repeated products
[r2-$r:c2-$tr~1] small bg(shade6)
```

Spans across columns and down rows, for a conference programme:

```tableau source
|       | Main Hall | Room A | Room B
| 09:00 | Keynote: _The Shape of Data_ | |
| 10:00 | Tables Are Interfaces | Parsing Pipes | Workshop: Build a Renderer
| 11:00 | Spans in Practice | Layout Algebra |
| 12:00 | Lunch | |
| 13:00 | Lightning Talks | Accessible Tables | Print & PDF
| 14:00 | Panel: Is Markdown Enough? | | Hallway Track
===
# DataDocs Conf · Day 1
align(cm)
[r1;c1] header

-- one session across every room
[r2:c2-$c] span bg(shade4)
[r5:c2-$c] span bg(shade1)

-- the workshop runs for two slots
[r3-4:c4] span bg(shade7)

[r7:c2-3] span
```

Two-level column headings, right-aligned figures, and rules where an
accountant would put them, down to the double rule under the bottom line:

```tableau source
| $ thousands       | 2025 |     | 2026 (forecast) |
|                   | H1   | H2  | H1  | H2
| Product revenue   | 412  | 455 | 498 | 531
| Services          | 128  | 134 | 141 | 150
| **Total revenue** | 540  | 589 | 639 | 681
| Cost of sales     | 210  | 224 | 238 | 249
| Operating costs   | 190  | 197 | 205 | 214
| **Operating profit** | 140 | 168 | 196 | 218
===
# Half-yearly results
[r1-2] header
[r1-2:c1] span
[r1:c2-3;r1:c4-5] span

[c1] align(l)
[r2-$r:c2-$c] align(r)
[r3-$r:c4-5] fg(shade8)

-- rules above the subtotals, and a double rule under the bottom line
[r5;r$r] line(t)
[r$r] line(b, double, xthick)
```

Group headings that span the whole row, and a shaded column to draw the
eye:

```tableau source
|                       | Free   | Pro       | Team
| Price per month       | €0     | €8        | €20 / seat
| **Storage**           |        |           |
| Projects              | 3      | Unlimited | Unlimited
| File size limit       | 10 MB  | 1 GB      | 5 GB
| Version history       | 7 days | 1 year    | Forever
| **Collaboration**     |        |           |
| Shared workspaces     | ✗      | ✓         | ✓
| Comments              | ✗      | ✓         | ✓
| Admin controls        | ✗      | ✗         | ✓
| **Support**           |        |           |
| Community forum       | ✓      | ✓         | ✓
| Email support         | ✗      | ✓         | ✓
| Account manager       | ✗      | ✗         | ✓
===
# Choose a plan
[r1] header
[c1] align(l)
[c2-$c] align(c)
[r2] line(b)

-- the plan we want you to pick
[r2-$r:c3] bg(shade3)

-- group headings span the whole row
[r3;r7;r11] span bg(shade5) align(l)
```

An APA-style results table: grouped headings, and rules only where they
mean something:

```tableau source
| Logistic parameter                  | 9-year-olds| | 16-year-olds| | t(40) | _p_ | _d_
|                                     |   M  |  SD   |   M    | SD   |
Maximum asymptote, proportion         | .843 | .135  | .877   | .082 | 0.951 | .347 | 0.302
Crossover, in ms                      | 759  |   87  |  694   |   42 | 2.877 | .006 | 0.840
Slope, as change in proportion per ms | .001 | .0002 | .002   |.0002 | 2.635 | .012 | 2.078
===
# Results of Curve-Fitting Analysis Examining the Time Course of Fixations to the Target
small
[c1] align(l)
[r3-$r:c2-$c] align(r)

-- grouped column headings
[r1:c2-3;r1:c4-5] span
[r1-2:c1;r1-2:c6,7,8] span

-- rules only where they mean something
[r1;r3] line(t)
[r$r] line(b)
[r1:c2-5] line(b)
```

## Installation

```sh
npm install ts-tableau
```

## Preprocessors

Tableau itself only turns table markup into HTML (see [Cell
Content](#cell-content) below) -- something upstream still needs to feed
it that markup and hand its output to a Markdown/HTML pipeline. Known
preprocessors:

* [remark-tableau](https://github.com/pragdave/remark-tableau) -- a
  remark plugin that renders Tableau fenced code blocks for
  unified/remark-based toolchains (this is what generates the guide
  linked above).
* [slidev-addon-tableau](https://github.com/pragdave/slidev-addon-tableau)
  -- a [Slidev](https://sli.dev) addon that renders Tableau fenced code
  blocks in presentations.
* [pandoc-tableau](https://github.com/pragdave/pandoc-tableau) -- the
  original Pandoc/Quarto Lua filter version of Tableau, with its own
  markup syntax.

If you build a preprocessor for another toolchain, let me know and I'll
add it here.

## Using

Most consumers won't call `ts-tableau` directly -- see
[Preprocessors](#preprocessors) above for pipeline integrations
(`remark-tableau` for unified/remark-based Markdown pipelines, or
`pandoc-tableau` for Pandoc/Quarto). To call it yourself:

```js
import { tableau, generate } from "ts-tableau"

const table = tableau([
  "a | b | c",
  "d | e | f",
  "===",
  "hlines vlines",
])

console.log(generate(table).join("\n"))
```

`tableau()` parses table markup (data section, then an optional `===`
layout section) into a `TableData`; `generate()` renders that into an
array of HTML lines. Load `ts-tableau/tableau.css` alongside the
generated HTML for the table's default styling. See
[the guide](https://pragdave.github.io/ts-tableau/) for the full markup
and layout-format reference.

## Longer Cell Content

A data row can be followed by one or more `col N {{ ... }}` (or
`column N {{ ... }}`) blocks, each of which replaces the content of one
column of that row with a multi-line block of text, up to the matching
`}}`. `N` can be a column number (`col2`) or a letter (`colb`, equivalent
to column 2). The block's content is dedented by its own minimum common
leading whitespace, so you can indent it to match the surrounding markup
without that indentation ending up in the cell. A block that targets a
column outside the row's range is silently ignored.

```
Cicero|||
col2 {{
  paragraph one

  paragraph two
}}
```

## For Integrators

### Cell Content

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
content. An empty cell produces an empty marker, `<tableau-md></tableau-md>`.

### Styling in Host Environments

Host pages and site themes (Docusaurus, MkDocs, etc.) often apply their
own default table styling -- zebra striping, borders, shadows. The
shipped stylesheet (`assets/tableau.css`) resets `background`, `border`,
and `box-shadow` back to neutral values on `table.tableau` and its
`tr`/`th`/`td` descendants, using ordinary CSS specificity, not
`!important`. This beats most host default table styling on its own.

It won't beat a host theme that uses `!important` or unusually high
specificity for its own table styles. For those environments, a
host-specific integration package is expected to add whatever override
its environment needs (higher specificity, `!important`, or CSS `@layer`
ordering, depending on what fits that host).

## License

Copyright © 2023–2026, Dave Thomas (pragdave)

See [LICENSE.md](./LICENSE.md)

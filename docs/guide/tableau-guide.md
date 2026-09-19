# Tableau
##### A Different Kind of Table Formatter for Pandoc/Quarto

Tableau lets you create great-looking tables from plain-text descriptions.
It was initially written as a preprocessor for markdown documents, but
can also be used standalone. It renders HTML out of the box, but you
can plug in renderers for any other markup language (such as LaTeX).
 
Tableau separates the data content of your table from its presentation.

For example, here's a multiplication table:

::::columns
:::column
~~~
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
~~~
:::
:::column
~~~ tableau
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
~~~
:::
::::

This table has no presentation specifications, so tableau uses its default layout.

Presentation is specified after the table data, and starts with a line containing three equals signs.

::::columns
:::column
~~~
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
# Times table 
[r1;c1] header
~~~
:::
:::column
~~~ tableau
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
# Times table 
[r1;c1] header
~~~
:::
::::

We told it to use "Times Table" as the table's caption (the `#` is like a markdown header). The next line formats cells. Each cell format line is a _cell selector_ between `[` and `]`, followed by format instructions. Here the selector is `[r1;c1]`. This selects all cells in row 1 and also all cells in column 1. The `head` format turns these cells into table headings.

Cell selectors can be more powerful:


::::columns
:::column
~~~
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
# Times table 
[r1;c1] header
[r2-$r:c$tr] line(lb)
[r2-$r:c2-$tr~1] small bg(shade6)
~~~
:::
:::column
~~~ tableau
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
# Times table 
[r1;c1] header
[r2-$r:c$tr] line(lb)
[r2-$r:c2-$tr~1] small bg(shade6)
~~~
:::
::::

`[r2-$r:c$tr] line(lb)`
selects the cells in rows two through the last row in the table whose column
number is the same as the row number and draw a line on its left and below it. `line(lb)` draws a line on the cell's left and bottom sides.

`[r2-$r:c2-$tr~1] small bg(shade6)`
selects the cells in rows two through six, columns two through the column one less than the row number. 
Make the text small, and shade the background.

We'll explain all this in detail later. First, a few more examples:

## More Examples

### APA-style Table


~~~ tableau
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
[r1:c2-3] span
[r1:c4-5] span
[r1-2:c1,6,7,8] span
[r1;r3] line(t)
[r$r] line(b)
[r1:c2-5] line(b)
~~~

### Nutrition Label

~~~ tableau
| Nutrition Information
| Serving Size 1/2 cup (about 82g)         |
| Servings Per Container 8                 |
| Amount Per Serving:                      |
| Calories 200 • Calories from Fat 130     |
|   \% Daily Value  |                      |
| Total Fat |                        | 22% |
|           | Saturated Fat 9g       | 22% |
|           | Trans Fat 9g           |  0% |
| Cholesterol 55mg |                 | 18% |
| Sodium 40mg |                      |  2% |
| Total Carbohydrate 17g |           |  6% |
|            | Dietary Fiber 1g      |  4% |
|            | Sugars 14g            |  0% |
| Protein 3g                               |
===
width(.5)
# Nutrition Facts for Yummy Treats

align(l)
-- box

[c1] width(0.1)
[c3] align(r)

[r1] large .bold align(c) span
[r1-3] bg(shade4)
[r4-$r] bg(shade1)

[r2] span
[r3] span 
[r4] span xsmall line(t) 
[r5] span line(b)
[r6] span align(r)
[r7:c1-2] span
[r10:c1-2] span
[r11:c1-2] span
[r12:c1-2] span
[r15] span
~~~

### Funky backgrounds and Flexible Spans

::::columns
:::column
``` tableau
 ant | bee | cat
 dog | elk | fox
 gnu | hen | idk
===
.gradient
[r2:c2] .glow
xlarge
```
:::
:::column
``` tableau
 1  | 2  | 3  |  4 |  5
 6  | 7  | 8  |  9 | 10
 11 | 12 | 13 | 14 | 15 
 16 | 17 | 18 | 19 | 20
 21 | 22 | 23 | 24 | 25
 ===
[r1-3:c1] span
[r1:c1] bg(shade1)

[r3:c4-5] span bg(shade2)

[r2-4:c2-3] span
[r2:c2] bg(shade3)

```
:::
::::


# A Gentle Guide to Tableau

## Table Data


::::columns
:::column
~~~
| a | b | c |
| d | e | f |
~~~
:::
:::column
~~~ tableau
| a | b | c |
| d | e | f |
~~~
:::
::::

* Tableau tables are written inside code blocks with the language `tableau`.
* As is conventional, pipe characters separate columns

##### Leading and Trailing Pipes

::::columns
:::column
~~~
a | b | c
d | e | f
~~~
:::
:::column
~~~ tableau
a | b | c
d | e | f
~~~
:::
::::

* Leading and trailing pipe characters may be omitted, but only when the
  cell they precede or follow is not empty.

##### Blank Lines

::::columns
:::column
~~~
a | b | c
d | e | f

g | h | i
~~~
:::
:::column
~~~ tableau
a | b | c
d | e | f

g | h | i
~~~
:::
::::

* Blank lines generate a small vertical space. This space is actually a 
  data row with no cells; in this table the blank line would be row three, or `r3`,
  and the line starting `g |…` would be `r4`.

##### Inline Cell Formatting

::::columns
:::column
~~~
Pole star | _Alpha Ursae_ |	$323–433 ly$
Dog star  | _Sirius_ | $8.60 \pm 0.04 ly$ 
~~~
:::
:::column
~~~ tableau
Pole star | _Alpha Ursae_ |	$323–433 ly$
Dog star  | _Sirius_ | $8.60 \pm 0.04 ly$ 
~~~
:::
::::

* Regular inline markup can be used in table cells.

## Table Layout

Table layout and styling is placed in a separate block that follows the table data, separated 
from it by three equals signs.

~~~~
~~~ tableau
data
data
===
layout
layout
~~~
~~~~

Layout can be applied to the table as a whole, or to one or more cells.

##### Add a Caption

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
~~~
:::
::::

* The `# ...` line is used to set the table's caption.
* Notice that we needed to include a leading pipe character on the
  second row. That is because the cell is empty; without the leading
  pipe tableau would assume the line had leading spaces and that
  `Average` was in column one.

##### Add Lines

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
hlines vlines
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
hlines vlines
~~~
:::
::::

* The `hlines` format adds lines between each row.
* Similarly, `vlines` puts lines between each column.
* A layout line can contain any number of format specifiers. Formats can also be written on separate lines.


##### Add Lines to Particular Rows (the hard way)

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r3] lines(t)
[r4] lines(t)
[r5] lines(t)
[r6] lines(t)
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r3] lines(t)
[r4] lines(t)
[r5] lines(t)
[r6] lines(t)
~~~
:::
::::

* This is an example of using _selectors_. A selector is an expression that appears at the start
  of a format row, wrapped in square brackets and separated from the format itself by a space.

* This time we only wanted horizontal lines between
  the data rows. We use `r3`, `r4`, ... to select those rows, and the `lines(t)`
  format to draw a line on top of each cell in those rows.

##### Add Lines to Particular Rows (an easier way)

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r3,4,5,6] lines(t)
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r3,4,5,6] lines(t)
~~~
:::
::::

* We could list each of the rows in the same selector, separated by
  commas.


##### Add Lines to Particular Rows (the easiest way)

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r3-6] lines(t)
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r3-6] lines(t)
~~~
:::
::::

* or we could use a range. 

##### Add a Header

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r3-6] lines(t) 
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r3-6] lines(t) 
~~~
:::
::::

* The line  `[r1-2] header` denotes rows 1 and 2 as header rows.

##### Span Some Cells

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-6] lines(t) 
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-6] lines(t) 
~~~
:::
::::

* `[r1:c2-3] span` selects columns 2 and 3 in row one, and then spans
  them.

##### Align Ranges of Cells

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-6] lines(t) 
[r3-$r:c1] align(l)
[r3-$r:c2-$c] align(r)
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-6] lines(t) 
[r3-$r:c1] align(l)
[r3-$r:c2-$c] align(r)
~~~
:::
::::

* The notations `$r` and `$c` refer to the last row and column
* The new format lines align column 1 in rows 3 through 6 to the left,
* and the cells in rows 3-6, columns 2 and 3 to the right.


##### Shade the Background of Some Cells

::::columns
:::column
~~~
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-6] lines(t) 
[r3-$r:c1] align(l)
[r3-$r:c2-$c] align(r)
[r5:c2;r6:c2] bg(shade)
[r3:c3;r4:c3] bg(shade8)
~~~
:::
:::column
~~~ tableau
Animal   | Lifespan
|        | Average  | Max
Badger   |  8       | 14
Elephant | 40       | 70 
Hare     | 6        | 10
Mouse    | 1.5      |  4
===
# Fake Animal Lifespan Data
[r1-2] header
[r1:c2-3] span
[r3-6] lines(t) 
[r3-$r:c1] align(l)
[r3-$r:c2-$c] align(r)
[r5:c2;r6:c2] bg(shade)
[r3:c3;r4:c3] bg(shade8)
~~~
:::
::::

* We've shaded the background of the cells of the two animals with the
  shortest average life, and used a different color to shade the animals
  with the longest maximum life.
* We used a semicolon to separate multiple selectors with the same
  format. We could also write these selectors as

  ~~~
  [r5,6:c2] bg(shade)
  [r3,4:c3] bg(shade8)
  ~~~

* Tableau comes with a palette of shades that complement each other. They
  adapt to dark and light modes.

##### Longer column content

(Because this example is longer, I'm formatting it with the output below the markup.)

~~~~
~~~ tableau
Cicero | | |
col 2 {{
At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
}}
col 3 {{
atque corrupti quos dolores et quas molestias
}}

| | | |
col 2 {{
:::callout-note
On the other hand, we denounce with righteous indignation and dislike men who
are so beguiled and demoralized by the charms of pleasure of the moment, so
blinded by desire...
:::
}}

lorem | | |
col 2 {{
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
}}
col 3 {{
incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet,
}}
===
align(l)
[r2:c2-3] span
~~~
~~~~

This renders as:

~~~ tableau
Cicero | | |
col 2 {{
At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis
}}
col 3 {{
atque corrupti quos dolores et quas molestias
}}

| | | |
col 2 {{
:::callout-note
On the other hand, we denounce with righteous indignation and dislike men who
are so beguiled and demoralized by the charms of pleasure of the moment, so
blinded by desire...
:::
}}

lorem | | |
col 2 {{
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
}}
col 3 {{
incididunt ut labore et dolore magna aliqua.Lorem ipsum dolor sit amet,
}}
===
align(l)
[r2:c2-3] span
~~~

* This table has three data rows. The first and last have text in column
  one, the middle one has three empty columns.
* Following each row is column block data. This starts `col n {{`, where
  `n` is the column number to be filled. This is followed by one or more
  blocks of markdown, and then is terminated by a closing '}}'.
* The column blocks are substituted into the appropriate column of the row
  that precedes them.

##### Matching the Current Row 

::::columns
:::column
~~~
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
[r1;c1] header
[r2-6:c$tr] line(lb)
~~~
:::
:::column
~~~ tableau
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
[r1;c1] header
[r2-6:c$tr] line(lb)
~~~
:::
::::

* `[r1;c1] header` uses the `;` to separate distinct selectors: the
  result selects all the cells in row one and in column one.

* `r2-6:c$tr` selects rows two through six. In each row, it then selects
  the cell whose column equals the row number (that's the `$tr`
  notation).

* For each selected cell, we draw a line on the left and the bottom.

##### Matching a Range Based on the Current Row 

::::columns
:::column
~~~
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
[r1;c1] header
[r2-6:c$tr] line(lb)
[r2-6:c2-$tr~1] small bg(shade6)
~~~
:::
:::column
~~~ tableau
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
[r1;c1] header
[r2-6:c$tr] line(lb)
[r2-6:c2-$tr~1] small bg(shade6)
~~~
:::
::::

* `r2-6:c2-$tr~1` is probably the most complex selector so far. Let's
  dissect it:

  * `r2-6` selects rows two through six
  * `:` then selects some cells within that row
  * `c2-$tr~1` selects the cells starting in column two and 
    ending at the current row number (`$tr`) minus one (`~1`). 
  * Note that we use `~` (tilde) for minus, because we already use the
    minus sign to denote a range.

##### Selecting Periodic Values in a Range

::::columns
:::column
~~~
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
[r1;c1] header
[r2-6%even:c2-$c] bg(shade1)
~~~
:::
:::column
~~~ tableau
|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
[r1;c1] header
[r2-6%even:c2-$c] bg(shade1)
~~~
:::
::::

* `r2-6%even` selects just the even-numbered rows in the given range.
  The syntax `$c` represents the last column, so `c2-$c` is the cells in column two 
  through to the end of the row.
  For each of these, we add a background color.

* We can also use `/odd` to select odd numbered rows, and `/n` to select
  rows that are a multiple of $n$.

##### Selecting Periodic Rows And Columns

::::columns
:::column
~~~
| ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ |
| ♟ | ♟︎ | ♟︎ | ♟︎ | ♟︎ | ♟︎ | ♟︎ | ♟︎ |
=empty
=empty
=empty
=empty
| ♙	| ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ |
| ♖	| ♘ | ♗ | ♕ | ♔ | ♗ | ♘ | ♖ |
===
xlarge
[r1-8%even:c1-8%odd] bg(shade6)
[r1-8%odd:c1-8%even] bg(shade6)
~~~
:::
:::column
~~~ tableau
| ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ |
| ♟ | ♟︎ | ♟︎ | ♟︎ | ♟︎ | ♟︎ | ♟︎ | ♟︎ |
=empty
=empty
=empty
=empty
| ♙	| ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ |
| ♖	| ♘ | ♗ | ♕ | ♔ | ♗ | ♘ | ♖ |
===
xlarge
[r1-8%even:c1-8%odd] bg(shade6)
[r1-8%odd:c1-8%even] bg(shade6)
~~~
:::
::::

* To create a chess board, we highlight the odd columns on the even
  rows, and the even columns on the odd rows.

* Rather than enter the four blank rows as a set of eight empty cells
  each, we used the shortcut `=empty`, which fills them in for us. (If
  we'd just used a blank line, the row height would be a lot smaller.)

* I have no idea why the black pawns look different to the white
  pawns.

##### Selecting Rows or Column Numbers That Are a Multiple Of a Value

::::columns
:::column
~~~
County Number | County Name | FIPS Code | Public Health Region | Health Service Region
1 | Anderson | 48001 | 4 | 4/5N
2 | Andrews | 48003 | 9 | 9/10
3 | Angelina | 48005 | 5 | 4/5N
4 | Aransas | 48007 | 11 | 11
5 | Archer | 48009 | 2 | 2/3
6 | Armstrong | 48011 | 1 | 1
7 | Atascosa | 48013 | 8 | 8
8 | Austin | 48015 | 6 | 6/5S
9 | Bailey | 48017 | 1 | 1
10 | Bandera | 48019 | 8 | 8
11 | Bastrop | 48021 | 7 | 7
12 | Baylor | 48023 | 2 | 2/3
13 | Bee | 48025 | 11 | 11
14 | Bell | 48027 | 7 | 7
15 | Bexar | 48029 | 8 | 8
===
[r1] header
[r1-$r%%4] line(b)
~~~
:::
:::column
~~~ tableau
County Number | County Name | FIPS Code | Public Health Region | Health Service Region
1 | Anderson | 48001 | 4 | 4/5N
2 | Andrews | 48003 | 9 | 9/10
3 | Angelina | 48005 | 5 | 4/5N
4 | Aransas | 48007 | 11 | 11
5 | Archer | 48009 | 2 | 2/3
6 | Armstrong | 48011 | 1 | 1
7 | Atascosa | 48013 | 8 | 8
8 | Austin | 48015 | 6 | 6/5S
9 | Bailey | 48017 | 1 | 1
10 | Bandera | 48019 | 8 | 8
11 | Bastrop | 48021 | 7 | 7
12 | Baylor | 48023 | 2 | 2/3
13 | Bee | 48025 | 11 | 11
14 | Bell | 48027 | 7 | 7
15 | Bexar | 48029 | 8 | 8
===
[r1] header
[r1-$r%%4] line(b)
~~~
:::
::::

* The selector `r1-$r%%4` breaks down as 
  * select the first to last row, and then
  * only pick every fourth of them. Using `%%` (instead of `%`) causes the
    numbering to be based on the offset into the range, rather than
    absolute row numbers.

# Tableau Reference

## Create a Table

Tableau tables are created inside code blocks with a language of tableau.

~~~~
~~~ tableau
...
~~~
~~~~

As with all code blocks, you can add additional attributes. For example, we
can add an ID so we can reference the table elsewhere:

~~~~
~~~ {.tableau #my-table}
...
~~~
~~~~

The table contains a data section and an optional layout section, separated
by a line containing just three equals signs:

~~~~
~~~ tableau
«data»
===
«layout»
~~~
~~~~

Both the data and layout sections are normally interpreted line-by-line.
One or more lines in the input may end with a backslash character, in which
case they will be concatenated with the line that follows before being
processed.

~~~~
~~~ tableau
a | \
b | \
c
d | e | f
g \
| h | \
i
~~~
~~~~

is interpreted as if it were:

~~~~
~~~ tableau
a | b | c
d | e | f
g | h | i
~~~
~~~~

When we talk about lines in the following descriptions, we mean these
concatenated lines.

## Tableau Data Section


The data section is normally interpreted line by line. There are four line
types. The first three each correspond to a row in the resulting table:

* column data for a row
* an empty line
* a blank line

The fourth type lets you enter paragraph data to fill a column.

### Column Data for a Row

Tableau follows the standard Markdown convention of using pipe characters
to separate columns in a row.

~~~~
~~~ tableau
| a | b | c |
| d | e | f |
| g | h | i |
~~~
~~~~

Opening pipe characters are optional _unless_ the cell they
are adjacent to is blank.

~~~
  a | b | c
    | d | e
| f | h
~~~

In this example, the first row has values in columns 1, 2, and 3. In the
second row, tableau interprets the pipe character as opening the first
column, and so this row has data in columns 1 and 2, and not columns 2 and
3.

Include a literal pipe character in a column by escaping it with a
backslash. A backslash escapes whatever character follows it, so use
`\\\\` for a literal backslash.

#### No Format Information in the Data Section

Unlike most Markdown tables, Tableau does not interpret lines containing
minus signs between pipe characters as a heading separator and column
alignment specification. If you write

~~~~
~~~ tableau
| a | b | c |
|---|---|---|
| d | e | f |
| g | h | i |
~~~
~~~~

you'll just see a table whose second row contains minus signs. 

In Tableau, we specify layout in a separate section.

### Blank Lines

A line consisting of zero or more spaces will create a half-height empty
row in the displayed table.

### Empty Lines

A line containing just the text `=empty` creates a row containing empty
cells, where each cell will have the same height as a filled table row.

### Column Paragraphs

Any column data row may be followed by one or more column paragraph
entries. These look like:

~~~
col «n» {{
    paragraph text
    .. .. .. .. ..
}}
~~~

«n» is either a column number (`col2`) or a letter (`colb`, which is the
same column). `column` may be written in full or abbreviated to `col`. A
block naming a column the previous row does not have is ignored.

The text between the opening `{{` and closing `}}` will be interpreted at
the Markdown block level, and so may contain paragraphs, code blocks, divs,
and so on. This text will be formatted, and the result will be used as the
value of column «n» of the previous row. See [Longer column content](#longer-column-content) for an example.


## Table Layout Section

Blank lines, and lines starting with two minus signs are ignored in the
layout section.

All other lines have the form

_[«cell selector(s)»] «format specification(s)»_

or

_«format specification(s)»_

The _cell selectors_ specify one or more cells. The _format specifications_
are applied to these cells.

In the second form (with no cell selectors), the format
specifications apply to all cells: they are table-level formats.

### Cell Selectors

Here's the raw syntax of cell selectors. This is followed by an annotated
version.

~~~ bnf
<cell selector>   := <cell range> ( ";" <cell range> )*

<cell range>      := <row> ( ":" <col> )?
                  |  <col>

<row>             := "r" <numbers>
<col>             := "c" <numbers>

<numbers>         := <number range> ( "," <number range> )*

<number range>    := <adjusted number> | <adjusted number> "-" <adjusted number> <skip>?

<adjusted number> := <number> ( [~+] <integer> )?

<number>          := <integer>
                  | '$c' | '$lastcol'
                  | '$r' | '$lastrow'
                  | '$tr' | '$thisrow'

<skip>          := ( "%" | "%%" ) ( "odd" | "even" | <integer> )
~~~


#### Notes

* ``` bnf
  <cell selector>   := <cell range> ( ";" <cell range> )*
  ```

  A selector consists of one or more cell range specifications, separated by
  semicolons. The corresponding format specifiers are associated
  independently with each selector, so

  ~~~
  [sel1;sel2;sel3] fmt1 fmt2
  ~~~

  is the same as writing

  ~~~
  [sel1] fmt1 fmt2
  [sel2] fmt1 fmt2
  [sel3] fmt1 fmt2
  ~~~


* ~~~bnf
  <cell range>      := <row> ( ":" <col> )?
                    |  <col>

  <row>             := "r" <numbers>
  <col>             := "c" <numbers>
  ~~~

  Each individual selector specifies a number of rows and/or columns. 
  If only a row is specified, all columns in that row are implied. If only
  a column is specified, the specifier applied to that column in all rows.

  For example:

  ~~~ lua
  -- select the cell at row 2, column 3
  r2:c3

  -- select every cell in row 4
  r4

  -- select the cell in column 5 of every row
  c5
  ~~~

* ~~~ bnf
  <numbers>         := <number range> ( "," <number range> )*
  ~~~

  The `r` or `c` of a row or column selector is followed by one or more
  comma-separated number ranges. We'll look at the details of these ranges
  next, but for now here's an example using the simplest type of range: an
  integer:

  ~~~ lua
  -- select rows 1 and 3
  r1,3

  -- select columns 2, 4, and 5
  c2,4,5

  -- select the cells in columns 2, 4, and 5 or rows 1 and 3
  r1,3:c2,4,5
  ~~~

  You can view the `:` as a kind of outer product: it produces a list of
  all the cells specified by every combination of the row and column
  specifiers.

We're going to look at the remaining syntax in a different order,
starting with the definition of a number

* ``` bnf
  <number>          := <integer>
                    | '$c' | '$lastcol'
                    | '$r' | '$lastrow'
                    | '$tr' | '$thisrow'
  ```

  A number represents a particular row or column. Both are numbered
  starting at 1.

  The values `$c` and `$r` represent the maximum column and row values.
  They may also be written in full as `$lastcol` and `$lastrow`.

  The value `$tr` (or, in full, `$thisrow`) represents the current row. For example, the selector
  `r1,3,5:c$tr` represents the three cells `r1:c1`, `r3:c3`, and `r5:c5`.

  This will be more useful when we look at ranges.

* ``` bnf
  <adjusted number> := <number> ( [~+] <integer> )?
  ```

  You can add or subtract a fixed amount from a number. This is typically
  only used when  using the special values `$tr`, `$c`, and `$r`.

  ~~~ lua
  -- select the second to last row
  r$r~1

  -- select the cell whose column number is two more than the current row
  -- number.
  c$tr+2
  ~~~

  Note that we use a tilde (`~`) to represent subtraction.

  
* ``` bnf
  <number range>    := <adjusted number> | <adjusted number> "-" <adjusted number> <skip>?
  ```

  Each number can be either a single value or a range of values.
  The range selects each cell from the starting value to the end value.

  We saw this when we shaded the multiplication table:

::::columns
:::column
~~~
  |  x |  1 |  2 |  3 |  4 |  5 |
  |  1 |  1 |  2 |  3 |  4 |  5 |
  |  2 |  2 |  4 |  6 |  8 | 10 |
  |  3 |  3 |  6 |  9 | 12 | 15 |
  |  4 |  4 |  8 | 12 | 16 | 20 |
  |  5 |  5 | 10 | 15 | 20 | 25 |
  ===
  # Times table 
  [r1;c1] header
  [r2-$r:c$tr] line(lb)
  [r2-$r:c2-$tr~1] small bg(shade6)
~~~
:::
:::column
~~~ tableau
  |  x |  1 |  2 |  3 |  4 |  5 |
  |  1 |  1 |  2 |  3 |  4 |  5 |
  |  2 |  2 |  4 |  6 |  8 | 10 |
  |  3 |  3 |  6 |  9 | 12 | 15 |
  |  4 |  4 |  8 | 12 | 16 | 20 |
  |  5 |  5 | 10 | 15 | 20 | 25 |
  ===
  # Times table 
  [r1;c1] header
  [r2-$r:c$tr] line(lb)
  [r2-$r:c2-$tr~1] small bg(shade6)
~~~
:::
::::

  The selector `r2-$r:c$tr` selects cells in rows 2 through the end of the
  table whose column number is the same as the row number.

  `r2-$r:c2-$tr~1` looks at rows 2 through the last. In each row, it selects the
  cells starting at column 2 and ending at the current row number minus 1.

* ``` bnf
  <skip>          := ( "%" | "%%" ) ( "odd" | "even" | <integer> )
  ```

  Finally, a skip can be applied to a range. This can be `odd` to select
  odd values, `even` for even values, or an integer to select values that
  are multiples of that integer.

  The skip starts with either `%` or `%%`.
  If you use `%`, then the skip test uses the absolute value of each number
  in the range. If instead you use `%%`, the test uses the offset into the
  range: the first value in the range has a skip value of 0, the second has
  a value of 1 and so on.

  ``` lua
  r3-8%even   -> 4, 6, 8   (absolute: n is even)
  r3-8%%even  -> 3, 5, 7   (relative: n-start is even)
  ```

<!-- ==================================================================== -->

### Format Specifiers

Apart from captions, comments and blank lines, all layout lines look like

_[«cell selector(s)»] «format specification(s)»_

or

_«format specification(s)»_

Lines that contain cell selectors apply their formats to the selected
cells.

Lines that do not contain cell selectors apply to the table as a whole.

There are some format selectors that only make sense when applied to the
whole table, and others only apply to cells.

~~~ tableau
Format | Table | Cell |  |  | Format | Table | Cell
align  | Y     | Y    |  |  | large  | Y     | Y
bg     | Y     | Y    |  |  | lines  |       | Y
boxed  | Y     |      |  |  | normal | Y     | Y
caption| Y    |      |  |  | small  | Y     | Y
fg     | Y     | Y    |  |  | span   |       | Y
footer |       | Y    |  |  | style  | Y     | Y
header |       | Y    |  |  | vlines | Y     |
hlines | Y     |      |  |  | width  | Y     | Y
 
===
# Tableau Format Specifiers
[r1] header
[c1;c6] align(l)
[r2-$r%%2] line(t)
[c4] line(r)
[c4,5] width(2)
~~~

Many formats have both explicit and implicit forms. The explicit form is
the name of the format, with options between parentheses. The implicit form
uses just the options. For example, these two lines are the same:

```
[r1:c2] align(lt) bg(shade2)
[r1:c2] lt bg(shade2)
```

The descriptions that follow show whether a particular format has an
implicit form, and when it can be used.



#### `align`: Horizontal and vertical alignment

~~~ tableau
context:  | table and cell
explicit: | `align(` [lcrj] [tmb] `)`
implicit: | [lcrj] [tmb]
===
l
[c1] width(10)
~~~

Set horizontal cell alignment (left, center, right, justified) and/or
vertical cell alignment (top, middle, bottom)

::::columns
:::column
~~~
| lt | ct | rt | Now is the time for all
| lb | cm | rt | Now is the time for all
| b  | rm | l  | Now is the time for all
===
vlines hlines
[r1:c1] lt
[r1:c2] ct
[r1:c3] rt
[r1:c4] j
[r2:c1] lt
[r2:c2] cm
[r2:c3] rb
[r2:c4] lt
[r3:c1] b 
[r3:c2] rm 
[r3:c3] l
[r3:c4] r
~~~
:::
:::column
~~~ tableau
| lt | ct | rt | Now is the time for all
| lb | cm | rt | Now is the time for all
| b  | rm | l  | Now is the time for all
===
vlines hlines
[r1:c1] lt
[r1:c2] ct
[r1:c3] rt
[r1:c4] j
[r2:c1] lt
[r2:c2] cm
[r2:c3] rb
[r2:c4] lt
[r3:c1] b 
[r3:c2] rm 
[r3:c3] l
[r3:c4] r
~~~
:::
::::



#### `bg`: Background color

~~~ tableau
context:  | table and cell
explicit: | `bg(` color `)`
implicit: | n/a
===
l
[c1] width(10)
~~~

Set the background color of the selected cells. A color is one of:

* a hex value, `#`xxx or `#`xxxxxx
* one of the nine predefined shades, `shade1` through `shade9`
* a [CSS named color](https://developer.mozilla.org/en-US/docs/Web/CSS/named-color),
  such as `crimson` or `hotpink`

Anything else is an error: there is no bare-color shorthand, so a color
always appears inside `bg(...)`.

For backgrounds Tableau cannot express directly -- gradients, images,
animations -- attach a class to the cells instead and write the CSS
yourself. See [`.style`](#style) below.

::::columns
:::column
~~~
shade1 | shade2 | shade3 | shade4
shade5 | shade6 | shade7 | shade8
shade9 | #cdf   | #94a8cb | nothing
===
[r1:c1] bg(shade1)
[r1:c2] bg(shade2)
[r1:c3] bg(shade3)
[r1:c4] bg(shade4)
[r2:c1] bg(shade5)
[r2:c2] bg(shade6)
[r2:c3] bg(shade7)
[r2:c4] bg(shade8)
[r3:c1] bg(shade9)
[r3:c2] bg(#cdf)
[r3:c3] bg(#94a8cb)
~~~
:::
:::column
~~~ tableau
shade1 | shade2 | shade3 | shade4
shade5 | shade6 | shade7 | shade8
shade9 | #cdf   | #94a8cb | nothing
===
[r1:c1] bg(shade1)
[r1:c2] bg(shade2)
[r1:c3] bg(shade3)
[r1:c4] bg(shade4)
[r2:c1] bg(shade5)
[r2:c2] bg(shade6)
[r2:c3] bg(shade7)
[r2:c4] bg(shade8)
[r3:c1] bg(shade9)
[r3:c2] bg(#cdf)
[r3:c3] bg(#94a8cb)
~~~
:::
::::

#### `boxed`: Box table
~~~ tableau
context:  | table only
explicit: | `boxed` \| `box`
implicit: | n/a
===
l
[c1] width(10)
~~~

Draw a box around the entire table.

::::columns
:::column
~~~
cat  | kitten
dog  | puppy
deer | fawn
===
boxed
~~~
:::
:::column
~~~ tableau
cat  | kitten
dog  | puppy
deer | fawn
===
boxed
~~~
:::
::::



#### `caption`: Give the table a caption

~~~ tableau
context:  | table only
explicit: | `#` text \| `:` text
implicit: | n/a
===
l
[c1] width(10)
~~~

A layout line whose first non-blank character is `#` or `:`, followed by
a space, sets the table's caption. Any number of leading `#` characters
works the same way, so `#`, `##` and `###` are equivalent -- the markdown
habit of picking a heading level does no harm.

Unlike the other specifiers, a caption line carries no cell selector and
takes the rest of the line as its text. If several layout lines set a
caption, the last one wins.

::::columns
:::column
~~~
cat  | kitten
deer | fawn
===
: Animals and their young
~~~
:::
:::column
~~~ tableau
cat  | kitten
deer | fawn
===
: Animals and their young
~~~
:::
::::

The caption renders below the table by default. See [Styling](#styling)
for how to move it above.



#### `fg`: Foreground color
~~~ tableau
context:  | table and cells
explicit: | `fg(` color `)`
implicit: | n/a
===
l
[c1] width(10)
~~~

Set the foreground color of the selected cells. See the description of `bg`
for notes on the color parameter.

::::columns
:::column
~~~
cat  | kitten | 27 | medium
dog  | puppy  | 42 | large
deer | fawn   | 68 | larger
===
fg(#a00)
[r2:c2-3] fg(shade4)
~~~
:::
:::column
~~~ tableau
cat  | kitten | 27 | medium
dog  | puppy  | 42 | large
deer | fawn   | 68 | larger
===
fg(#a00)
[r2:c2-3] fg(shade4)
~~~
:::
::::



#### `footer`: Specify table footer cells

~~~ tableau
context:  | cells only
explicit: | `footer` \| `foot`
implicit: | n/a
===
l
[c1] width(10)
~~~

The selected cells are made into a table footer. Normally applied to whole
rows or columns. See the description of `header` for an example.






#### `header`: Specify table header cells
~~~ tableau
context:  | cells only
explicit: | `header` \| `head`
implicit: | n/a
===
l
[c1] width(10)
~~~

The selected cells are made into a table header. Normally applied to whole
rows or columns. 


::::columns
:::column
~~~
adult | child  | beta | concern
cat   | kitten | 27 | medium
dog   | puppy  | 42 | large
deer  | fawn   | 68 | larger
adult | child  | beta | concern
===
[r1] header
[r$r] footer
~~~
:::
:::column
~~~ tableau
adult | child  | beta | concern
cat   | kitten | 27 | medium
dog   | puppy  | 42 | large
deer  | fawn   | 68 | larger
adult | child  | beta | concern
===
[r1] header
[r$r] footer
~~~
:::
::::





#### `hlines`: Draw lines between rows

~~~ tableau
context:  | table only
explicit: | `hlines` \| `hline`
implicit: | n/a
===
l
[c1] width(10)
~~~

Draw lines between table rows.

::::columns
:::column
~~~
cat   | kitten | 27 | medium
dog   | puppy  | 42 | large
deer  | fawn   | 68 | larger
===
hlines
~~~
:::
:::column
~~~ tableau
cat   | kitten | 27 | medium
dog   | puppy  | 42 | large
deer  | fawn   | 68 | larger
===
hlines
~~~
:::
::::


#### `large`: Enlarge text
~~~ tableau
context:  | table and cells
explicit: | `large` \| `xlarge` \| `xxlarge`
short:    | `lg` \| `xlg` \| `xxlg`
implicit: | n/a
===
l
[c1] width(10)
~~~

Increase font size by a small, medium, or large amount. Also see `normal`
and `small`.

::::columns
:::column
~~~
  small  | xsmall | xxsmall
  normal | normal | normal
  xxlarge | xlarge | large
===
[r1;r3] align(m)
[r1:c1] small
[r1:c2] xsmall
[r1:c3] xxsmall
[r3:c1] xxlarge
[r3:c2] xlarge
[r3:c3] large
~~~
:::
:::column
~~~ tableau
  small  | xsmall | xxsmall
  normal | normal | normal
  xxlarge | xlarge | large
===
[r1;r3] align(m)
[r1:c1] small
[r1:c2] xsmall
[r1:c3] xxsmall
[r3:c1] xxlarge
[r3:c2] xlarge
[r3:c3] large
~~~
:::
::::



#### `lines`: Draw lines around cells
~~~ tableau
context:  | cells only
explicit: | `lines(` [tblrx]+ `)` \| `line(` [tblrx]+ `)`
implicit: | n/a
===
l
[c1] width(10)
~~~

Draw lines on the (t)op, (b)ottom, (l)eft, or (r)ight of the selected
cells. The bo(x) attribute draws a box around the cell. Multiple sides may
be given in a single `lines` specifier.

::::columns
:::column
~~~
 1  | 2  | 3  | 4
 5  | 6  | 7  | 8
 9  | 10 | 11 | 12
 13 | 14 | 15 | 16
 ===
 align(c)
[r1:c1-2] lines(x)
[r1:c4] lines(tbr)
[r4] lines(l)
[r4:c1-$c%even] lines(t)
[r4:c1-$c%odd] lines(b)
~~~
:::
:::column
~~~ tableau
 1  | 2  | 3  | 4
 5  | 6  | 7  | 8
 9  | 10 | 11 | 12
 13 | 14 | 15 | 16
 ===
 align(c)
[r1:c1-2] lines(x)
[r1:c4] lines(tbr)
[r4] lines(l)
[r4:c1-$c%even] lines(t)
[r4:c1-$c%odd] lines(b)
~~~
:::
::::
Note that the `lines` specifier applies to each selected cell individually.






#### `normal`: Normal-sized font
~~~ tableau
context:  | table and cells
explicit: | `normal`
implicit: | n/a
===
l
[c1] width(10)
~~~

Makes the text in selected cells normal size. Typically only used to
override a more encompassing `small` or `large` specifier. See `large` for
an example.



#### `small`: Reduce text
~~~ tableau
context:  | table and cells
explicit: | `small` \| `xsmall` \| `xxsmall`
short:    | `sm` \| `xsm` \| `xxsm`
implicit: | n/a
===
l
[c1] width(10)
~~~

Decrease font size by a small, medium, or large amount. Also see `large`
for an example.




#### `span`: Span cells horizontally and/or vertically
~~~ tableau
context:  | cells only
explicit: | `span`
implicit: | n/a
===
l
[c1] width(10)
~~~

Merges the selected cells into single logical cells, whose content and
style are taken from the top-left–most cell of each block.

The selector produces one block per combination of a row range and a
column range, so `[r1-3:c1;r4:c2-4] span` makes two blocks. Each range
must be contiguous -- a skip such as `%even` has no rectangle to draw --
and two blocks may not overlap. Either is an error rather than a
silently mangled table.

::::columns
:::column
~~~
 1  | 2  | 3  | 4
 5  | 6  | 7  | 8
 9  | 10 | 11 | 12
 13 | 14 | 15 | 16
 ===
[r1-3:c1] span
[r1:c1] bg(shade1)

[r1-3:c2-3] span
[r1:c2] bg(shade3)

[r4:c2-4] span
[r4:c2] bg(shade6)
~~~
:::
:::column
~~~ tableau
 1  | 2  | 3  | 4
 5  | 6  | 7  | 8
 9  | 10 | 11 | 12
 13 | 14 | 15 | 16
 ===
[r1-3:c1] span
[r1:c1] bg(shade1)

[r1-3:c2-3] span
[r1:c2] bg(shade3)

[r4:c2-4] span
[r4:c2] bg(shade6)
~~~
:::
::::

A cell-selector row or column spec that's written as a dash **range**
(`r1-3`, `c2-4`) is treated as a single contiguous block, but one written
as a **comma list** (`r1,2,3`, `c2,3,4`) is treated as several
independent, single-value selectors -- each combination of a row group
and a column group produces its own rectangle. This matters for `span`:
a range merges its cells into one block, while a comma list keeps each
value's cells as a separate block. So `[r1-2:c2-4] span` spans rows 1-2
and columns 2-4 into a *single* 2×3 cell, but `[r1-2:c2,3,4] span` spans
rows 1-2 within *each* of columns 2, 3, and 4 independently, giving three
separate two-row-tall cells side by side:

::::columns
:::column
~~~
 1  | 2  | 3  | 4
 5  | 6  | 7  | 8
 9  | 10 | 11 | 12
 ===
[r1-2:c2,3,4] span
~~~
:::
:::column
~~~ tableau
 1  | 2  | 3  | 4
 5  | 6  | 7  | 8
 9  | 10 | 11 | 12
 ===
[r1-2:c2,3,4] span
~~~
:::
::::

#### `.style`: Attach a CSS class

~~~ tableau
context:  | table and cells
explicit: | `style(` name `)` \| `class(` name `)`
implicit: | `.`name
===
l
[c1] width(10)
~~~

Associates the given style with the selected cells. The interpretation of
the style depends on the output format used. For HTML output, the style
becomes a CSS class.

The name may be written with or without a leading dot inside `style(...)`
or `class(...)`, so `style(warning)`, `style(.warning)`, `class(warning)`
and `.warning` are all the same thing.

Styles accumulate. A cell (or the table) keeps every class applied to it,
in the order the layout section applies them, so

~~~
[r1:c1] .boxed-in
[r1:c1] .warning
~~~

gives that cell `class="boxed-in warning"`. Applying the same name twice
is harmless -- it is only emitted once. This is how you attach a
background Tableau cannot express itself, such as a gradient or an
image: write the CSS yourself and name the class here.

::::columns
:::column
~~~
 ant | bee | cat
 dog | elk | fox
 gnu | hen | idk
===
.gradient
[r2:c2] .glow
~~~
:::
:::column
~~~ tableau
 ant | bee | cat
 dog | elk | fox
 gnu | hen | idk
===
.gradient
[r2:c2] .glow
~~~
:::
::::

<style>
table.tableau.gradient {
  background: linear-gradient(0.1turn, #3f87a6, #ebf8e1, #f69d3c);
}

table.tableau td.glow {
  box-shadow: 0px 0px 20px 14px rgba(255,46,46,0.9);
}
</style>

:::callout-note{collapse=true}
### Expand to see the CSS for the previous table
~~~ css
table.tableau.gradient {
  background: linear-gradient(0.1turn, #3f87a6, #ebf8e1, #f69d3c);
}

table.tableau td.glow {
  box-shadow: 0px 0px 20px 14px rgba(255,46,46,0.9);
}
~~~
:::







#### `vlines`: Draw lines between columns

~~~ tableau
context:  | table only
explicit: | `vlines` \| `vline`
implicit: | n/a
===
l
[c1] width(10)
~~~

Draw lines between table columns. See `hlines` for the horizontal
equivalent; the two are frequently used together.

::::columns
:::column
~~~
cat   | kitten | 27
dog   | puppy  | 42
deer  | fawn   | 68
===
vlines
~~~
:::
:::column
~~~ tableau
cat   | kitten | 27
dog   | puppy  | 42
deer  | fawn   | 68
===
vlines
~~~
:::
::::


#### `width`: Set table or column  width
~~~ tableau
context:  | table and cells
explicit: | `width(` number `)` \| `w(` number `)`
implicit: | n/a
===
l
[c1] width(10)
~~~

The `width` specifier takes a number, and how it reads that number
depends on how you write it. Written with a decimal point -- anything
from `.0001` up to `1.0` -- it is a ratio (multiply it by 100 in your
head if you prefer working with percentages). Written as a plain
integer of 1 or more, it is the approximate width of that many
characters in the default font.

So `width(1)` is one character wide and `width(1.0)` is full width. A
ratio above `1.0`, or anything that is not a number, is an error.

When applied at the table level, `width` specifies the width of the table
as a whole. When a ratio is given, the width is that ratio of the line
length.

When applied to a cell, it represents the width of that cell. Column widths
are calculated from the widths of cells in that column using a heuristic
which attempts to maintain proportional widths depending on the widths of
the cells in each column.

:::callout-note{collapse=true}
### If you want to know how this works, expand this

* if no widths are given for a particular column, then the width is
  approximated by the width of the widest cell in the column.

* if a character width is specified for one or more cells, then the width
  is set to the largest of these.

* if one or more cells has a ratio as a width, the column width is set to
  the largest of these.

At this point we have a list of columns. Some may have ratio widths,
others may have character widths. Our goal is to convert them all into
ratios, such that the ratios add up to 1.0.

We first remove the columns with ratio widths, adding up those ratios. We
subtract the total from 1.0, giving the ratio remaining. Call it ${rr}i$. 

We than add up the character widths of the remaining columns. Call this total
is ${cw}_{tot}$. Then we set the ratio width of these columns to their
character widths times $\frac{rr}{{cw}_{tot}}$.

:::

::::columns
:::column
~~~
one  | two  | three
four | five | six
===
bg(#f0f9ff)
~~~
:::
:::column
~~~ tableau
one  | two  | three
four | five | six
===
bg(#f0f9ff)
~~~
:::
::::

::::columns
:::column
~~~
one  | two  | three
four | five | six
===
bg(#f0f9ff)
[c1] width(20)
[c2] width(4)
~~~
:::
:::column
~~~ tableau
one  | two  | three
four | five | six
===
bg(#f0f9ff)
[c1] width(20)
[c2] width(4)
~~~
:::
::::

::::columns
:::column
~~~
one  | two  | three
four | five | six
===
bg(#f0f9ff)
width(.75)
[c1] width(20)
[c2] width(4)
~~~
:::
:::column
~~~ tableau
one  | two  | three
four | five | six
===
bg(#f0f9ff)
width(.75)
[c1] width(20)
[c2] width(4)
~~~
:::
::::

::::columns
:::column
~~~
one  | two  | three
four | five | six
===
bg(#f0f9ff)
width(.4)
[c1] width(.2)
[c2] width(.4)
~~~
:::
:::column
~~~ tableau
one  | two  | three
four | five | six
===
bg(#f0f9ff)
width(.4)
[c1] width(.2)
[c2] width(.4)
~~~
:::
::::

# Styling

## HTML Output

Tableau uses CSS for all styling. Generated tables have the class
`tableau`, so scope any changes you make with `table.tableau` (or, for a
single cell's custom class, `table.tableau.yourclass`) in order to get
the correct specificity -- `table.tableau` beats a bare `.yourclass`
rule, since `tableau.css` itself uses `table.tableau` selectors to reset
background/border/box-shadow back to neutral values (so that a host
page's own table theme, or an earlier `bg()`/`lines()`/shading rule,
doesn't leak through). See the `.gradient` example above.

You can override colors using CSS variables:

~~~ css
:root {
  --tb-hue: 240deg;
  --tb-sat: 29%;

  --tb-border-color: hsl(var(--tb-hue) var(--tb-sat) 55%);
  --tb-cell-border-color: hsl(var(--tb-hue) var(--tb-sat) 55%);
  --tb-line-color: hsl(var(--tb-hue) var(--tb-sat) 80%);
  --tb-header-bg: hsl(var(--tb-hue) var(--tb-sat) 60%);
  --tb-header-fg: #fff;
  --tb-footer-bg: var(--tb-header-bg);
  --tb-footer-fg: var(--tb-header-fg);
  --tb-caption-bg: hsl(var(--tb-hue) var(--tb-sat) 98%);
  --tb-caption-line-color: hsl(var(--tb-hue) var(--tb-sat) 50%);

  --tb-shade1-bg: hsl(60deg, 66%, 84%);
  --tb-shade2-bg: hsl(95deg, 61%, 79%);
  --tb-shade3-bg: hsl(130deg, 61%, 79%);
  --tb-shade4-bg: hsl(165deg, 61%, 79%);
  --tb-shade5-bg: hsl(200deg, 61%, 79%);
  --tb-shade6-bg: hsl(235deg, 61%, 79%);
  --tb-shade7-bg: hsl(270deg, 61%, 79%);
  --tb-shade8-bg: hsl(305deg, 61%, 79%);
  --tb-shade9-bg: hsl(340deg, 61%, 79%);
  --tb-shade-bg:  var(--tb-shade1-bg);

  --tb-shade1-fg: hsl(60deg, 66%, 28%);
  --tb-shade2-fg: hsl(95deg, 61%, 32%);
  --tb-shade3-fg: hsl(130deg, 61%, 33%);
  --tb-shade4-fg: hsl(165deg, 61%, 32%);
  --tb-shade5-fg: hsl(200deg, 61%, 39%);
  --tb-shade6-fg: hsl(235deg, 61%, 39%);
  --tb-shade7-fg: hsl(270deg, 61%, 39%);
  --tb-shade8-fg: hsl(305deg, 61%, 39%);
  --tb-shade9-fg: hsl(340deg, 61%, 39%);
  --tb-shade-fg:  var(--tb-shade1-fg);
}
~~~

`--tb-hue`/`--tb-sat` set the single hue the header, footer, caption
banner, and grid lines are all derived from, so changing just those two
re-themes the whole table consistently. `--tb-shade1-bg` through
`--tb-shade9-bg` (and their `-fg` counterparts) are the named colors
`bg(shade1)`...`bg(shade9)` resolve to.

Tableau also ships dark-mode values, applied automatically via
`prefers-color-scheme` -- no extra class or data attribute needed:

~~~ css
@media (prefers-color-scheme: dark) {
  :root {
    --tb-border-color: hsl(var(--tb-hue) var(--tb-sat) 50%);
    --tb-cell-border-color: hsl(var(--tb-hue) var(--tb-sat) 50%);
    --tb-line-color: hsl(var(--tb-hue) var(--tb-sat) 50%);
    --tb-header-bg: hsl(var(--tb-hue) var(--tb-sat) 30%);
    --tb-caption-bg: hsl(var(--tb-hue) var(--tb-sat) 23%);

        :       :
  }
}
~~~

Overriding these variables inside a `@media (prefers-color-scheme: dark)`
block of your own (after `tableau.css` is loaded) re-themes dark mode the
same way.

The table caption renders below the table by default (`caption-side:
bottom` is already set on `table.tableau`). To put it back above the
table:

~~~ css
table.tableau {
  caption-side: top;
}
~~~


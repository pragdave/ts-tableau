v0.4.0     2026-10-24
           * align(d) lines up a column's numbers on their decimal point,
             including negatives, (accounting) brackets, grouped thousands
             and suffixes such as %. Cells that aren't plain numbers end
             at the point. decimal(,) makes a table use decimal commas
           * integrators: a plain number in an align(d) cell is written
             out directly, with no <tableau-md> marker round it
           * playground: a decimal alignment example. The APA examples use
             align(d) and new data

v0.3.0     2026-10-17
           * shade$tr and shade$tc pick a shade by each cell's row or
             column number, wrapping after shade9: [c1] bg(shade$tr)
           * new shades: the same nine hues in light and dark mode, spread
             round the color wheel so neighbouring shades stay distinct.
             shade1 is now orange and shade2 yellow
           * text on a bg(shadeN) cell is black in light mode and white in
             dark mode, unless the cell sets fg()
           * tableau.css colors follow the page's color-scheme, not just the
             system setting, so a host's dark-mode toggle switches them too
           * line() takes a weight (thin, default, thick, xthick), a style
             (solid, dashed, dotted, double, groove, ridge, inset, outset)
             and a shade, e.g. line(b, shade4, dotted, thick). A line()
             with no sides restyles the cell's other lines
           * hlines, vlines and boxed take the same style arguments
           * playground: showcase examples (schedule, financials, pricing,
             API reference, calendar, APA, nutrition label, ...) grouped
             apart from the per-feature ones; the times table is the default
           * playground: render Markdown in cells by default, and replace
             each <tableau-md> with its output so cell margins collapse
           * playground: the dev server serves ?example= URLs
           * docs: the guide's APA example no longer merges the t, p and d
             headings into one cell

v0.2.2     2026-10-06
           * fix: lines(x) now draws a box round the cell (its CSS rule
             was named for a class nothing generates)
           * add skills/tableau, an agent skill for writing tableau tables

v0.2.1     2026-10-01
           * add playground

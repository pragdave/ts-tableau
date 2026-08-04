# Tableau: Enhanced Markdown Tables for Quarto

Tableau is a library that simplifies table layout by separating
data from layout. It is intended to be used as a preprocessor for
markup languages swuch as Markdown, but can be used standalone to
generate HTML.

Here are some sample tables:

* Easy spans, partial underlines

  ![An APA Style table](README_ASSETS/apa.png)

* Different heading styles
* Lines under every _n_ rows

  ![County data](README_ASSETS/counties.png)

* Block level cell content (single cell and spanned)

  ![Lorem](README_ASSETS/lorem.png)

* Nontraditional layout

  ![Various layouts](README_ASSETS/funky.png)

The layout language is vaguely dynamic. The following example shows the
markup on the left and the result on the right. The layout section uses
the special variables `$r` (the number of rows), and `$tr` (the current
row being generated). It also does arithmetic.

![Multiplication table](README_ASSETS/times-table.png)

## Status

* HTML generation: working
* PDF generation:
  * prototype/poc working
  * development starting

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

## Documentation

A combined guide and reference [is available](https://pragdave.github.io/pandoc-tableau/tableau-guide.html).

## Installation

The Tableau extension is available in the `_extensions` directory.

## Adding to Your Document

This extension must be run prior to the bulk of Quarto processing. Add
it to your `_quarto.yml` file like this:

~~~ yml
filters:
  - _extensions/tableau_pre/tableau_pre.lua
  - quarto
  - other_filters_go_here
~~~

You'll need to add the `tableau_pre` extension at the top of your
filters, and then add the `- quarto` line (if it isn't already there).
This second line tells Quarto where in the filter chain it should run.

## Using

See [the guide](https://pragdave.github.io/pandoc-tableau/tableau-guide.html).

### License

Copyright © 2023, Dave Thomas (pragdave)

See [LICENSE.md](./LICENSE.md)

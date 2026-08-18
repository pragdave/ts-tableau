# Tableau Playground: Design

## Purpose

Provide an interactive, in-browser playground for ts-tableau's markup
language, modeled on the picjs playground
(`/Users/dave/Play/picjs/docs/index.html`): a source editor on one side, a
live-rendered result on the other, with errors shown inline as you type.

Two delivery modes are required:

1. A standalone static web page, deployable as-is to GitHub Pages (or any
   static host) as a page in this repo.
2. A simple CLI command that builds (if needed) and launches the same page
   locally, opening it in the default browser.

## Non-goals (explicitly deferred)

- Markdown-with-fenced-`tableau`-block input (the `remark-tableau` /
  `md2html.mts` pipeline). The playground edits raw tableau markup only,
  matching `cli/tab.ts`'s input model.
- GitHub Pages workflow / CI wiring. This design only needs to produce
  something that *can* be dropped into Pages later; actual publishing is
  out of scope.
- Switching the library import to the published `ts-tableau` npm package.
  The playground imports directly from `src/` for now; swapping to the
  package later is a one-line change in `playground/lib.ts`.

## Location

A new top-level `playground/` directory, separate from the existing
`docs/` (which holds the Quarto guide sources and spec/plan documents and
is not touched by this work):

```
playground/
  index.html       # page shell: header, editor pane, result pane
  main.ts          # glue: CodeMirror setup, examples, toggles, render loop
  lib.ts           # run(source) -> { html, tableData, error }
  vite.config.ts   # root: 'playground', builds a static bundle to playground/dist
  serve.mjs        # build-if-needed + serve dist/ + open browser
```

## `lib.ts`: bridging to ts-tableau

```ts
import { tableau } from "../src/tableau"
import { generate } from "../src/generators/html"
import { TableData } from "../src/table_data"

export type PlaygroundResult =
  | { ok: true; html: string; tableData: TableData }
  | { ok: false; error: string }

export function run(source: string): PlaygroundResult {
  try {
    const lines = source.split("\n")
    const tableData = tableau(lines)
    const html = generate(tableData).join("\n")
    return { ok: true, html, tableData }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
```

`tableau()` and the parser throw both plain strings (`throw "..."`, seen in
`src/tableau.ts` and `src/selectors.ts`) and, from `format_row_test.ts`'s
`.toThrow()` assertions, potentially `Error` objects from deeper parser
code — `run()` normalizes both to a display string.

This is a source-relative import into the library's own `src/`, not a
package dependency; both the Vite build and `tsx`-based dev/test paths in
this repo already do the equivalent (see `cli/tab.ts`).

## Page layout and behavior

Mirrors picjs's playground structure and CSS approach (light/dark theme
via CSS custom properties and a `<html class="dark">` toggle, responsive
stacking below 768px):

- **Header**: title, short description, theme toggle.
- **Editor pane** (left): CodeMirror 6 editor (loaded from `esm.sh`, same
  approach as picjs), an example-table dropdown, an "auto-render" checkbox,
  and explicit Render/Clear buttons. `Cmd/Ctrl+Enter` forces a render.
  Content is persisted to `localStorage` and restored on load; loading an
  example sets `?example=<name>` in the URL (shareable link), same as
  picjs.
- **Result pane** (right): three checkboxes control what's visible below
  the always-shown rendered table:
  - **Render Markdown in cells** (off by default). ts-tableau does not
    render Markdown itself — cell content is HTML-entity-escaped and
    wrapped in `<tableau-md>...</tableau-md>` (see README's "Cell Content"
    section, confirmed in `__tests__/tableau_md_test.ts`). With the toggle
    off, the browser shows that escaped text as inert plain text, which is
    exactly what the library emits. With it on, `main.ts` walks the
    rendered DOM for `<tableau-md>` elements, takes their (already
    unescaped-by-the-browser) text content, runs it through `marked`
    (loaded from `esm.sh`, no build-time dependency added to the library
    itself), and replaces the element's contents with the rendered HTML.
  - **Show generated HTML** — a collapsible `<pre>` showing `result.html`.
  - **Show parsed JSON** — a collapsible `<pre>` showing
    `JSON.stringify(result.tableData, null, 2)`.
- **Errors**: on `{ ok: false }`, the result pane gets an error style
  (matching picjs's `.has-error` treatment) and shows `result.error` in a
  `<pre>`; the toggle panels are hidden since there's nothing to show.
- **Styling**: `assets/tableau.css` is imported so rendered tables look
  like they will in real usage; the playground's own chrome uses its own
  minimal stylesheet (adapted from picjs's), not tableau.css.

## Syntax highlighting

A CodeMirror `StreamLanguage`, tableau-specific (not reused from picjs,
whose grammar is for a different language). Tokens to recognize, based on
the actual parser/format grammar:

- `--` line comments
- Quoted-free plain cell text and `|` column separators
- The `===` format-section separator
- `[selector]` format lines (e.g. `[r1:c1-2]`, `[c$tr]`, `[r$r]`)
- Format keywords used in the format section (`align`, `bg`, `fg`,
  `boxed`, `caption`, `class`, `fontsize`, `footer`, `header`, `hlines`,
  `span`, `vlines`, `width` — pulled from `src/formats.ts`'s exports)
- `#`/`:` caption-prefix lines
- `col N {{` / `column N {{` / closing `}}` block markers

This is a "good enough to be readable" highlighter, not a formal grammar;
it does not need to reject invalid syntax (the parser already does that,
surfaced via the error pane).

## Examples

A fixed set of examples, each verified against real parser behavior
referenced from the test suite and README:

| key | demonstrates |
|---|---|
| `simple` | Bare `a\|b` / `c\|d` rows, no format section |
| `headerfooter` | `header`/`footer`/`hlines` formatting |
| `spans` | `[r1:c1-2] span` and `[r1-2:c1] span` (colspan/rowspan) |
| `alignment` | `[c2] align(r)`, `bg`, `fontsize` selectors |
| `blocks` | `col2 {{ ... }}` multi-line block content |
| `caption` | `# My Caption` |
| `timestable` | The README's `$r`/`$tr` dynamic multiplication-table example |

## CLI: `serve.mjs`

Exposed as an npm script, e.g. `npm run playground`:

1. If `playground/dist` doesn't exist or `playground/` sources are newer
   than it, run `vite build` (via the local `vite` devDependency, config
   at `playground/vite.config.ts`).
2. Serve `playground/dist` with a minimal static file server (plain
   Node `http`, no new runtime dependency).
3. Open the default browser to the served URL (`child_process` + platform
   `open`/`start`/`xdg-open`, same pattern as picjs's tooling would use).

This produces exactly the static output that would later be copied into a
GitHub Pages source directory — the CLI is a convenience wrapper around
the same build, not a separate code path.

## Testing

- `lib.ts`'s `run()` is a pure function over existing `tableau`/`generate`
  exports and is covered indirectly by the existing test suite for those;
  a small dedicated test (`playground/lib.test.ts` or under `__tests__/`)
  verifies `run()`'s error-normalization behavior (string throw → message,
  and a known-bad input producing `ok: false`).
- No automated testing of the CodeMirror/DOM wiring in `main.ts` — verified
  manually by running the CLI and exercising each toggle and example, per
  this project's UI-verification norm.

## Dependencies added

- `vite` (devDependency) — build tool for the playground bundle.
- No new runtime dependency on the library itself. `marked` and CodeMirror
  packages are loaded from `esm.sh` at runtime inside `playground/`, the
  same way picjs's page loads CodeMirror — they are not added to
  `package.json`.

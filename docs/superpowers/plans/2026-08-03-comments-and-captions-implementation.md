# Comments and Captions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port `--` comments and `#`/`:` captions from the reference layout-row parser, and fix two adjacent pre-existing bugs in the same code that silently swallowed unrecognized/malformed format-line text instead of erroring.

**Architecture:** `parse_format_row` gains two checks at the top, before its existing selector-vs-global dispatch: a blank/comment check (returns an empty no-op `FormatRow` immediately) and a caption check (returns a `FormatRow` containing a single new `FormatCaption`, reusing the existing global-format application machinery rather than a new line-type concept). `TableData.global_attr` gains a `caption` field; the HTML generator emits it as a real `<caption>` element.

**Tech Stack:** TypeScript, Jest (`ts-jest`), existing parser/generator infrastructure.

## Global Constraints

- Comment/blank check: `/^\s*(--|$)/` — matches blank lines, whitespace-only lines, and `--`-prefixed lines (leading whitespace optional either way).
- Caption check: `/^\s*(?:#+|:)\s+(.*)$/` — one or more `#`, or a single `:`, then required whitespace, then the rest of the line verbatim as the caption text. The number of `#`s doesn't matter (`#`, `##`, `###` all behave identically).
- A caption line is exclusively a caption — no other formats can share it (falls out of the regex consuming to end-of-line, no special-case code needed).
- Once comments/blanks are handled explicitly, unrecognized global-format text must throw (`` `unrecognized format: ${src.peek(30)}` ``, matching the message format already used for selector-format lines) instead of silently vanishing via the removed `log()` fallback.
- `parse_selector_formats`'s existing (currently-dead) trailing-garbage check must actually fire: `if (!src.hasTerminated())`, not `if (!src.hasTerminated)`.
- Caption renders as `<caption><tableau-md>escaped-text</tableau-md></caption>`, the `<table>` element's first child, reusing the existing `escape_markdown` helper.

---

### Task 1: Comments, and tightening unrecognized-format error handling

**Files:**
- Modify: `src/parser/parse_format_row.ts`
- Modify: `src/parser/parse_formats.ts`
- Test: `__tests__/format_row_test.ts` (new)

**Interfaces:**
- Produces: `parse_format_row` now returns an empty no-op `FormatRow(null, [])` for blank/comment lines, checked before any other parsing. Consumed by `src/tableau.ts` (unchanged — it already calls `parse_format_row` per format-section line).

- [ ] **Step 1: Write the failing tests**

Create `__tests__/format_row_test.ts`:

```ts
import { tableau } from "../src/tableau"

test("blank lines in the format section are ignored", () => {
  const table = tableau(["a|b", "===", "", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("whitespace-only lines in the format section are ignored", () => {
  const table = tableau(["a|b", "===", "   ", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("-- comment lines in the format section are ignored", () => {
  const table = tableau(["a|b", "===", "-- this is a comment", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("-- comment lines with leading whitespace are ignored", () => {
  const table = tableau(["a|b", "===", "  -- this is a comment", "boxed"])
  expect(table.global_attr.boxed).toBe(true)
})

test("unrecognized text in a global-format line throws", () => {
  expect(() => tableau(["a|b", "===", "garbledtext123"])).toThrow()
})

test("unrecognized trailing text in a selector-format line throws", () => {
  expect(() => tableau(["a|b", "===", "[r1] garbledtext123"])).toThrow()
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx jest __tests__/format_row_test.ts`
Expected: FAIL. The first four tests fail because comments/blanks currently reach `parse_global_formats`'s `log()` fallback (a silent no-op with console spam) rather than being intercepted explicitly — wait, these four should actually already *pass* today since the accidental fallback is also silent; re-run and check: if they pass already, that's fine, they're still valuable regression tests locking in intentional (not accidental) behavior — the two "throws" tests are the ones that must fail at this step, since neither `parse_global_formats` nor `parse_selector_formats` currently throws on unrecognized text (the bugs this task fixes).

- [ ] **Step 3: Update `src/parser/parse_format_row.ts`**

Change:

```ts
import { StringScanner } from "strscan-ts"
import { FormatRow } from "../format_row"

import { parse_global_formats, parse_selector_formats } from "./parse_formats"
import { parse_selector } from "./parse_selector"

export function parse_format_row(line: string) {
  const src = new StringScanner(line)
  const selectors = src.scan(/^\s*\[/) ? parse_selector(src) : null
  let result: FormatRow

  if (selectors === null) {
    result = new FormatRow(null, parse_global_formats(src))
  }
  else {
    const f = parse_selector_formats(src)
    result = new FormatRow(selectors, f)
  }

  if (!src.hasTerminated()) {
    console.error("unexpected stuff at end of line: " + src.peek(50))
  }

  return result
}
```

to:

```ts
import { StringScanner } from "strscan-ts"
import { FormatRow } from "../format_row"

import { parse_global_formats, parse_selector_formats } from "./parse_formats"
import { parse_selector } from "./parse_selector"

const BLANK_OR_COMMENT_RE = /^\s*(--|$)/

export function parse_format_row(line: string) {
  if (BLANK_OR_COMMENT_RE.test(line)) {
    return new FormatRow(null, [])
  }

  const src = new StringScanner(line)
  const selectors = src.scan(/^\s*\[/) ? parse_selector(src) : null
  let result: FormatRow

  if (selectors === null) {
    result = new FormatRow(null, parse_global_formats(src))
  }
  else {
    const f = parse_selector_formats(src)
    result = new FormatRow(selectors, f)
  }

  if (!src.hasTerminated()) {
    console.error("unexpected stuff at end of line: " + src.peek(50))
  }

  return result
}
```

(A later task, not this one, will insert a caption check right after the new blank/comment check — leave room there conceptually, but don't add it now.)

- [ ] **Step 4: Update `src/parser/parse_formats.ts`**

Change `parse_global_formats`/`parse_global_format` (removing the `log` function entirely, dropping its use from the alternation, and making the loop throw on leftover unrecognized text) from:

```ts
function log(src: StringScanner) {
  console.log("No match", src.peek(10))
  return false
}
export function parse_global_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null
  while (fmt = parse_global_format(src))
    result.push(fmt)
  return result
}


function parse_global_format(src: StringScanner): Formats | null {
  src.skip(/\s+/)
  if (src.hasTerminated())
    return null

  return (
    align(src) ||
    bg(src) ||
    boxed(src) ||
    fclass(src) ||
    fg(src) ||
    font_size(src) ||
    hlines(src) ||
    vlines(src) ||
    width(src) ||
    log(src) ||
    null)
}
```

to:

```ts
export function parse_global_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null
  while (fmt = parse_global_format(src))
    result.push(fmt)
  if (!src.hasTerminated()) {
    throw `unrecognized format: ${src.peek(30)}`
  }
  return result
}


function parse_global_format(src: StringScanner): Formats | null {
  src.skip(/\s+/)
  if (src.hasTerminated())
    return null

  return (
    align(src) ||
    bg(src) ||
    boxed(src) ||
    fclass(src) ||
    fg(src) ||
    font_size(src) ||
    hlines(src) ||
    vlines(src) ||
    width(src) ||
    null)
}
```

Change `parse_selector_formats` (fixing the missing parentheses on `hasTerminated`, and removing an unrelated debug `console.error` in the same loop body) from:

```ts
export function parse_selector_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null

  while (fmt = parse_selector_format(src)) {
    console.error("fmt", fmt)
    result.push(fmt)
  }
  if (!src.hasTerminated) {
    throw `unrecognized format: ${src.peek(30)}`
  }
  return result
}
```

to:

```ts
export function parse_selector_formats(src: StringScanner): Formats[] {
  const result: Formats[] = []
  let fmt: Formats | null

  while (fmt = parse_selector_format(src)) {
    result.push(fmt)
  }
  if (!src.hasTerminated()) {
    throw `unrecognized format: ${src.peek(30)}`
  }
  return result
}
```

The rest of `src/parser/parse_formats.ts` is unchanged.

- [ ] **Step 5: Run the tests and verify they pass**

Run: `npx jest __tests__/format_row_test.ts`
Expected: `Tests: 6 passed, 6 total`

- [ ] **Step 6: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (312 pre-existing + 6 new = 318 total).

- [ ] **Step 7: Commit**

```bash
git add src/parser/parse_format_row.ts src/parser/parse_formats.ts __tests__/format_row_test.ts
git commit -m "$(cat <<'EOF'
Implement layout-section comments; throw on unrecognized format text

"--"-prefixed lines (and blank/whitespace-only lines, already
harmless by accident) are now explicitly recognized as no-ops in
parse_format_row, before any other parsing -- rather than silently
falling through parse_global_format's noisy log()-and-drop fallback,
which made a real typo in a format line indistinguishable from an
intentional comment.

Removes that fallback entirely: parse_global_formats now throws on
genuinely unrecognized text, matching parse_selector_formats's
existing intent. Also fixes parse_selector_formats's own check, which
had a bug of the same kind: `if (!src.hasTerminated)` referenced the
method without calling it (always truthy in JS), so it never actually
fired regardless of leftover garbage.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 2: Captions

**Files:**
- Modify: `src/formats/others.ts`
- Modify: `src/formats.ts`
- Modify: `src/table_data.ts`
- Modify: `src/parser/parse_format_row.ts`
- Modify: `src/generators/html.ts`
- Test: `__tests__/format_row_test.ts` (extend)

**Interfaces:**
- Consumes: the `BLANK_OR_COMMENT_RE` check and overall `parse_format_row` shape from Task 1.
- Produces: `FormatCaption` (new class, `{ text: string }`), `TableData.global_attr.caption: string | null`.

- [ ] **Step 1: Write the failing tests**

Append to `__tests__/format_row_test.ts` (add `generate` to the existing import from `"../src/generators/html"` — the file will need `import { generate } from "../src/generators/html"` added alongside its existing `import { tableau } from "../src/tableau"`):

```ts
test("':' prefix sets the caption", () => {
  const table = tableau(["a|b", "===", ": a caption"])
  expect(table.global_attr.caption).toBe("a caption")
})

test("'#' prefix sets the caption", () => {
  const table = tableau(["a|b", "===", "# a caption"])
  expect(table.global_attr.caption).toBe("a caption")
})

test("'###' prefix sets the caption the same as a single '#'", () => {
  const table = tableau(["a|b", "===", "### a caption"])
  expect(table.global_attr.caption).toBe("a caption")
})

test("caption renders as the table's first child, wrapped in tableau-md", () => {
  const html = generate(tableau(["a|b", "===", "# My Caption"]))
  expect(html[0]).toEqual(`<table class="tableau halign-c valign-m">`)
  expect(html[1]).toEqual("<caption><tableau-md>My Caption</tableau-md></caption>")
  expect(html[2]).toEqual("<tr><td><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>")
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx jest __tests__/format_row_test.ts`
Expected: FAIL — captions aren't recognized at all yet; `#`/`:` lines currently fail to parse as any known global format and throw (thanks to Task 1's new throw-on-unrecognized behavior), rather than setting a caption.

- [ ] **Step 3: Add `FormatCaption` to `src/formats/others.ts`**

Change:

```ts
export class FormatBoxed { }
export class FormatFooter { }
export class FormatHeader { }
export class FormatHlines { }
export class FormatSpan { }
export class FormatVlines { }
```

to:

```ts
export class FormatBoxed { }
export class FormatCaption {
  constructor(public text: string) { }
}
export class FormatFooter { }
export class FormatHeader { }
export class FormatHlines { }
export class FormatSpan { }
export class FormatVlines { }
```

- [ ] **Step 4: Wire `FormatCaption` into `src/formats.ts`**

Change:

```ts
import {
  FormatBoxed,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatSpan,
  FormatVlines,
} from "./formats/others"

export {
  FormatAlign,
  FormatBg,
  FormatBoxed,
  FormatClass,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatLines,
  FormatSpan,
  FormatVlines,
  FormatWidth,
}

export type Formats
  = FormatAlign
  | FormatBg
  | FormatBoxed
  | FormatClass
  | FormatFg
  | FormatFontsize
  | FormatFooter
  | FormatHeader
  | FormatHlines
  | FormatLines
  | FormatSpan
  | FormatClass
  | FormatVlines
  | FormatWidth
```

to:

```ts
import {
  FormatBoxed,
  FormatCaption,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatSpan,
  FormatVlines,
} from "./formats/others"

export {
  FormatAlign,
  FormatBg,
  FormatBoxed,
  FormatCaption,
  FormatClass,
  FormatFg,
  FormatFontsize,
  FormatFooter,
  FormatHeader,
  FormatHlines,
  FormatLines,
  FormatSpan,
  FormatVlines,
  FormatWidth,
}

export type Formats
  = FormatAlign
  | FormatBg
  | FormatBoxed
  | FormatCaption
  | FormatClass
  | FormatFg
  | FormatFontsize
  | FormatFooter
  | FormatHeader
  | FormatHlines
  | FormatLines
  | FormatSpan
  | FormatClass
  | FormatVlines
  | FormatWidth
```

The rest of `src/formats.ts` is unchanged.

- [ ] **Step 5: Add `caption` to `TableData.global_attr`**

In `src/table_data.ts`, add `FormatCaption` to the import from `"./formats"` (alongside the existing `FormatAlign, FormatBg, ...` import list).

Change the `GlobalAttributes` type from:

```ts
type GlobalAttributes = {
  boxed: boolean,
  halign: HALIGN,
  hlines: boolean,
  style: string,
  valign: VALIGN,
  vlines: boolean,
  width: FormatWidth,
}
```

to:

```ts
type GlobalAttributes = {
  boxed: boolean,
  caption: string | null,
  halign: HALIGN,
  hlines: boolean,
  style: string,
  valign: VALIGN,
  vlines: boolean,
  width: FormatWidth,
}
```

Change the `global_attr` initializer from:

```ts
  readonly global_attr: GlobalAttributes = {
    boxed: false,
    halign: "c",
    hlines: false,
    style: "",
    valign: "m",
    vlines: false,
    width: new FormatWidth(1.0, "ratio"),
  }
```

to:

```ts
  readonly global_attr: GlobalAttributes = {
    boxed: false,
    caption: null,
    halign: "c",
    hlines: false,
    style: "",
    valign: "m",
    vlines: false,
    width: new FormatWidth(1.0, "ratio"),
  }
```

Add a case to `apply_global_format`'s switch — change:

```ts
      case FormatBoxed:
        this.global_attr.boxed = true
        break

      case FormatHlines:
```

to:

```ts
      case FormatBoxed:
        this.global_attr.boxed = true
        break

      case FormatCaption:
        this.global_attr.caption = (format as FormatCaption).text
        break

      case FormatHlines:
```

The rest of `src/table_data.ts` is unchanged.

- [ ] **Step 6: Add the caption check to `src/parser/parse_format_row.ts`**

Add `FormatCaption` to the imports (`import { FormatCaption } from "../formats"`), and change:

```ts
const BLANK_OR_COMMENT_RE = /^\s*(--|$)/

export function parse_format_row(line: string) {
  if (BLANK_OR_COMMENT_RE.test(line)) {
    return new FormatRow(null, [])
  }

  const src = new StringScanner(line)
```

to:

```ts
const BLANK_OR_COMMENT_RE = /^\s*(--|$)/
const CAPTION_RE = /^\s*(?:#+|:)\s+(.*)$/

export function parse_format_row(line: string) {
  if (BLANK_OR_COMMENT_RE.test(line)) {
    return new FormatRow(null, [])
  }

  const caption_match = line.match(CAPTION_RE)
  if (caption_match) {
    return new FormatRow(null, [new FormatCaption(caption_match[1])])
  }

  const src = new StringScanner(line)
```

The rest of `src/parser/parse_format_row.ts` is unchanged.

- [ ] **Step 7: Emit the `<caption>` element in `src/generators/html.ts`**

Change `do_table` from:

```ts
function do_table(table: TableData): string[] {
  let result = [table_opener(table)]
  table.rows.forEach((row) => {
    result = result.concat(do_row(row))
  })

  result.push("</table>")
  //console.log(result)
  return result
}
```

to:

```ts
function do_table(table: TableData): string[] {
  let result = [table_opener(table)]
  if (table.global_attr.caption !== null) {
    result.push(`<caption><tableau-md>${escape_markdown(table.global_attr.caption)}</tableau-md></caption>`)
  }
  table.rows.forEach((row) => {
    result = result.concat(do_row(row))
  })

  result.push("</table>")
  //console.log(result)
  return result
}
```

The rest of `src/generators/html.ts` is unchanged — `escape_markdown` already exists in this file (added when `<tableau-md>` cell wrapping was implemented) and needs no changes to be reused here.

- [ ] **Step 8: Run the tests and verify they pass**

Run: `npx jest __tests__/format_row_test.ts`
Expected: `Tests: 10 passed, 10 total`

- [ ] **Step 9: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (318 from after Task 1 + 4 new = 322 total).

- [ ] **Step 10: Commit**

```bash
git add src/formats/others.ts src/formats.ts src/table_data.ts src/parser/parse_format_row.ts src/generators/html.ts __tests__/format_row_test.ts
git commit -m "$(cat <<'EOF'
Implement table captions ("#"/":" prefix)

A layout line starting with one or more "#" characters, or a single
":", followed by whitespace, sets the table's caption to the rest of
the line -- ported from the reference implementation. Reuses the
existing global-format application machinery (a new FormatCaption,
recognized like any other global-only format) rather than introducing
a separate line-type concept.

Renders as a real <caption> element, the table's first child, wrapped
in <tableau-md> like all other text content (anticipated when that
convention was introduced).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

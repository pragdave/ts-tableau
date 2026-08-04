# Shade Colors and Theming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix shade colors (`bg(shade3)` etc.) so they actually render, and port a complete light/dark theming system into `assets/tableau.css`.

**Architecture:** `do_color()` in `src/generators/html.ts` gains a `kind: "bg" | "fg"` parameter and emits `var(--${shade}-${kind})` for `ShadeColor` instead of the bare (invalid) shade name — `RGBColor`/`CssColor` are untouched. `assets/tableau.css` gains a `:root` block defining all 9 shades' bg/fg custom properties plus the existing border/line colors and new header/footer-background variables, with a complete `@media (prefers-color-scheme: dark)` override block.

**Tech Stack:** TypeScript, Jest (`ts-jest`), plain CSS (no build step for the asset — it's copied verbatim by `npm run build`, per the existing `cp assets/tableau.css dist/tableau.css` step).

## Global Constraints

- `do_color(color, kind)` — `kind` is `"bg"` or `"fg"`, used only by the `ShadeColor` branch to pick the CSS variable suffix.
- Shade color CSS values, light mode (verbatim from the reference implementation):
  - `--shade1-bg: hsl(60deg, 66%, 84%)`, `--shade1-fg: hsl(60deg, 66%, 44%)` (shade1 is the one special-cased at 66% saturation; all others use 61%)
  - `--shadeN-bg: hsl(H, 61%, 79%)`, `--shadeN-fg: hsl(H, 61%, 39%)` for N=2..9, where H = 95, 130, 165, 200, 235, 270, 305, 340 respectively (35° steps starting from shade1's 60°)
  - `--shade-bg: var(--shade1-bg)`, `--shade-fg: var(--shade1-fg)` (bare alias)
- Shade color CSS values, dark mode (same hues as light mode, uniform 61% saturation, bg lightness 30%, fg lightness 75%):
  - `--shadeN-bg: hsl(H, 61%, 30%)`, `--shadeN-fg: hsl(H, 61%, 75%)` for N=1..9, same H values as light mode (60, 95, 130, 165, 200, 235, 270, 305, 340)
  - `--shade-bg: var(--shade1-bg)`, `--shade-fg: var(--shade1-fg)`
- Dark mode trigger: `@media (prefers-color-scheme: dark) { :root { ... } }` — not the reference's `[data-md-color-scheme=slate]`.
- Non-shade theme variables: `--tb-border-color` (light `#bbb`, dark `#666`), `--tb-line-color` (light `#ddd`, dark `#444`), `--tb-header-bg` (light `#cef`, dark `hsl(195, 40%, 20%)`), `--tb-footer-bg` (light `#ecf`, dark `hsl(285, 40%, 20%)`).
- `.tb_l_*`/`.tb-boxed` rules' hardcoded `#888` consolidate to `var(--tb-border-color)`.

---

### Task 1: Fix `do_color()` to emit shade CSS variable references

**Files:**
- Modify: `src/generators/html.ts`
- Test: `__tests__/shade_color_test.ts` (new)

**Interfaces:**
- Produces: `do_color(color: ColorRepresentations, kind: "bg" | "fg"): string`. Only consumed within `src/generators/html.ts` itself (`do_cell_styles`); no other file calls `do_color`.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/shade_color_test.ts`:

```ts
import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"

function html_for(lines: string[]) {
  return generate(tableau(lines))
}

test("shade background color renders as a CSS variable reference", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(shade3)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: var(--shade3-bg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("shade foreground color renders as a CSS variable reference", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] fg(shade7)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="color: var(--shade7-fg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("bare 'shade' alias renders as a CSS variable reference", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(shade)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: var(--shade-bg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("shade bg and fg combined on one cell render both correctly", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(shade3) fg(shade7)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: var(--shade3-bg); color: var(--shade7-fg)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("RGB color rendering is unchanged by the do_color signature change", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(#2a6)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: rgb(34, 170, 102)"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})

test("named CSS color rendering is unchanged by the do_color signature change", () => {
  const lines = [
    "a|b",
    "===",
    "[r1:c1] bg(red)",
  ]
  expect(html_for(lines)).toEqual([
    `<table class="tableau halign-c valign-m">`,
    `<tr><td style="background: red"><tableau-md>a</tableau-md></td><td><tableau-md>b</tableau-md></td></tr>`,
    "</table>",
  ])
})
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx jest __tests__/shade_color_test.ts`
Expected: FAIL — the four shade-related tests fail because `do_color` currently returns the bare shade name (`"shade3"`) instead of `var(--shade3-bg)` etc. (the last two RGB/named-color tests should already pass unchanged, since those branches aren't broken today — that's expected and fine, they're regression tests for Step 3's signature change).

- [ ] **Step 3: Update `src/generators/html.ts`**

Change `do_color` from:

```ts
function do_color(color: ColorRepresentations) {
  if (color instanceof RGBColor) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  }
  else if (color instanceof ShadeColor) {
    return color.shade
  }
  else if (color instanceof CssColor) {
    return color.name
  }
  else {
    throw new Error("Unknown color type")
  }
}
```

to:

```ts
function do_color(color: ColorRepresentations, kind: "bg" | "fg") {
  if (color instanceof RGBColor) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`
  }
  else if (color instanceof ShadeColor) {
    return `var(--${color.shade}-${kind})`
  }
  else if (color instanceof CssColor) {
    return color.name
  }
  else {
    throw new Error("Unknown color type")
  }
}
```

Change `do_cell_styles` from:

```ts
  if (cell.bg) {
    result.push(`background: ${do_color(cell.bg)}`)
  }
  if (cell.fg) {
    result.push(`color: ${do_color(cell.fg)}`)
  }
```

to:

```ts
  if (cell.bg) {
    result.push(`background: ${do_color(cell.bg, "bg")}`)
  }
  if (cell.fg) {
    result.push(`color: ${do_color(cell.fg, "fg")}`)
  }
```

The rest of `src/generators/html.ts` is unchanged.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx jest __tests__/shade_color_test.ts`
Expected: `Tests: 6 passed, 6 total`

- [ ] **Step 5: Run the full test suite to confirm nothing else broke**

Run: `npx jest`
Expected: all suites pass (327 pre-existing + 6 new = 333 total).

- [ ] **Step 6: Commit**

```bash
git add src/generators/html.ts __tests__/shade_color_test.ts
git commit -m "$(cat <<'EOF'
Fix shade colors to emit CSS variable references

do_color() returned the bare shade name (e.g. "shade3") as a CSS
value directly -- never valid CSS, so bg(shade3)/fg(shade3) parsed
correctly but silently rendered no color at all. Now emits
var(--shade3-bg) / var(--shade3-fg), matching the variable names the
next task defines in assets/tableau.css. RGBColor/CssColor rendering
is unchanged.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 2: Full theming pass on `assets/tableau.css`

**Files:**
- Modify: `assets/tableau.css`

**Interfaces:**
- Consumes: the exact CSS variable names Task 1's `do_color` now emits (`--shade1-bg` through `--shade9-bg`, `--shade1-fg` through `--shade9-fg`, `--shade-bg`, `--shade-fg`).

- [ ] **Step 1: Replace the full content of `assets/tableau.css`**

This is a static asset with no Jest coverage — verification for this task is a build + visual/manual check (Step 2), not a test run. Replace the entire file with:

```css
:root {
  --tb-border-color: #bbb;
  --tb-line-color: #ddd;
  --tb-header-bg: #cef;
  --tb-footer-bg: #ecf;

  --shade1-bg: hsl(60deg, 66%, 84%);
  --shade2-bg: hsl(95deg, 61%, 79%);
  --shade3-bg: hsl(130deg, 61%, 79%);
  --shade4-bg: hsl(165deg, 61%, 79%);
  --shade5-bg: hsl(200deg, 61%, 79%);
  --shade6-bg: hsl(235deg, 61%, 79%);
  --shade7-bg: hsl(270deg, 61%, 79%);
  --shade8-bg: hsl(305deg, 61%, 79%);
  --shade9-bg: hsl(340deg, 61%, 79%);
  --shade-bg:  var(--shade1-bg);

  --shade1-fg: hsl(60deg, 66%, 44%);
  --shade2-fg: hsl(95deg, 61%, 39%);
  --shade3-fg: hsl(130deg, 61%, 39%);
  --shade4-fg: hsl(165deg, 61%, 39%);
  --shade5-fg: hsl(200deg, 61%, 39%);
  --shade6-fg: hsl(235deg, 61%, 39%);
  --shade7-fg: hsl(270deg, 61%, 39%);
  --shade8-fg: hsl(305deg, 61%, 39%);
  --shade9-fg: hsl(340deg, 61%, 39%);
  --shade-fg:  var(--shade1-fg);
}

@media (prefers-color-scheme: dark) {
  :root {
    --tb-border-color: #666;
    --tb-line-color: #444;
    --tb-header-bg: hsl(195, 40%, 20%);
    --tb-footer-bg: hsl(285, 40%, 20%);

    --shade1-bg: hsl(60deg, 61%, 30%);
    --shade2-bg: hsl(95deg, 61%, 30%);
    --shade3-bg: hsl(130deg, 61%, 30%);
    --shade4-bg: hsl(165deg, 61%, 30%);
    --shade5-bg: hsl(200deg, 61%, 30%);
    --shade6-bg: hsl(235deg, 61%, 30%);
    --shade7-bg: hsl(270deg, 61%, 30%);
    --shade8-bg: hsl(305deg, 61%, 30%);
    --shade9-bg: hsl(340deg, 61%, 30%);
    --shade-bg:  var(--shade1-bg);

    --shade1-fg: hsl(60deg, 61%, 75%);
    --shade2-fg: hsl(95deg, 61%, 75%);
    --shade3-fg: hsl(130deg, 61%, 75%);
    --shade4-fg: hsl(165deg, 61%, 75%);
    --shade5-fg: hsl(200deg, 61%, 75%);
    --shade6-fg: hsl(235deg, 61%, 75%);
    --shade7-fg: hsl(270deg, 61%, 75%);
    --shade8-fg: hsl(305deg, 61%, 75%);
    --shade9-fg: hsl(340deg, 61%, 75%);
    --shade-fg:  var(--shade1-fg);
  }
}

table.tableau {
  border-collapse: collapse;

  & td {
    padding: 0.25rem 0.5rem;
    margin:0;
  }

  &.halign-l td{
    text-align: left;
  }

  &.halign-c td {
    text-align: center;
  }
  &.halign-r td{
    text-align: right;
  }
  &.halign-j td {
    text-align: justify;
    text-justify: auto;
  }

  &.valign-t td {
    vertical-align: top;
  }

  &.valign-m td {
    vertical-align: middle;
  }

  &.valign-b td {
    vertical-align: bottom;
  }

  &.boxed {
    border: 1px solid var(--tb-border-color);
  }

  &.hlines tr:not(:last-child) td {
    border-bottom: 0.5px solid var(--tb-line-color);
  }

  &.vlines tr td:not(:last-child) {
    border-right: 0.5px solid var(--tb-line-color);
  }
}

table.tableau tr td, table.tableau tr th {
  &.halign-l {
    text-align: left;
  }

  &.halign-c {
    text-align: center;
  }
  &.halign-r {
    text-align: right;
  }
  &.halign-j {
    text-align: justify;
    text-justify: auto;
  }

  &.valign-t {
    vertical-align: top;
  }

  &.valign-m {
    vertical-align: middle;
  }

  &.valign-b {
    vertical-align: bottom;
  }

  &.tb-header {
    background: var(--tb-header-bg);
  }
  &.tb-footer {
    background: var(--tb-footer-bg);
  }

  &.tb-boxed  { border: 1px solid var(--tb-border-color); }
  &.tb_l_1111 { border: 1px solid var(--tb-border-color); }
  /*     TRBL */
  &.tb_l_0001 { border-left: 1px solid var(--tb-border-color); }
  &.tb_l_0010 { border-bottom: 1px solid var(--tb-border-color); }
  &.tb_l_0011 { border-left: 1px solid var(--tb-border-color); border-bottom: 1px solid var(--tb-border-color); }
  &.tb_l_0100 { border-right: 1px solid var(--tb-border-color); }
  &.tb_l_0101 { border-left: 1px solid var(--tb-border-color); border-right: 1px solid var(--tb-border-color); }
  &.tb_l_0110 { border-right: 1px solid var(--tb-border-color); border-bottom: 1px solid var(--tb-border-color); }
  &.tb_l_0111 { border-right: 1px solid var(--tb-border-color); border-left: 1px solid var(--tb-border-color); border-bottom: 1px solid var(--tb-border-color); }
  &.tb_l_1000 { border-top: 1px solid var(--tb-border-color); }
  &.tb_l_1001 { border-top: 1px solid var(--tb-border-color); border-left: 1px solid var(--tb-border-color); }
  &.tb_l_1010 { border-top: 1px solid var(--tb-border-color); border-bottom: 1px solid var(--tb-border-color); }
  &.tb_l_1011 { border-top: 1px solid var(--tb-border-color); border-left: 1px solid var(--tb-border-color); border-bottom: 1px solid var(--tb-border-color); }
  &.tb_l_1100 { border-top: 1px solid var(--tb-border-color); border-right: 1px solid var(--tb-border-color); }
  &.tb_l_1101 { border-top: 1px solid var(--tb-border-color); border-right: 1px solid var(--tb-border-color); border-left: 1px solid var(--tb-border-color); }
  &.tb_l_1110 { border-top: 1px solid var(--tb-border-color); border-right: 1px solid var(--tb-border-color); border-bottom: 1px solid var(--tb-border-color); }
}
```

Two things beyond the theming changes, both directly in lines already being edited:
- The old `.tableau { --tb-border-color: #bbb; --tb-line-color: #ddd; }` rule (which only ever declared those two variables) is removed — superseded by the new `:root` block, which covers the same variables plus the new ones.
- `&.tb_l_0011`'s content changed from `border-left top: 1px solid var(--tb-border-color);` (an invalid CSS property name, `"border-left top"` is not a real property — a pre-existing typo) to `border-left: 1px solid var(--tb-border-color);`, matching the pattern of every other `tb_l_*` rule and the TRBL bit meaning (`0011` = left + bottom).

- [ ] **Step 2: Verify the build and CLI output**

Run:
```bash
cd /Users/dave/Play/ts-tableau
npm run build
test -f dist/tableau.css && echo "dist/tableau.css exists"
printf 'a|b|c\nd|e|f\n===\n[r1:c1] bg(shade3)\n[r2:c2] fg(shade7) bg(shade1)\nboxed hlines vlines\n' > /tmp/shade_test.tab
npx tsx cli/tab.ts /tmp/shade_test.tab > /tmp/shade_test.html
grep -c "var(--shade3-bg)" /tmp/shade_test.html
grep -c "var(--shade7-fg)" /tmp/shade_test.html
grep -c "prefers-color-scheme" /tmp/shade_test.html
```
Expected: `dist/tableau.css exists` printed, and each `grep -c` prints a number >= 1 (confirms the CSS variables are referenced in the generated HTML's inline styles, and the dark-mode media query is present in the CLI's embedded stylesheet).

Optionally, open `/tmp/shade_test.html` in a browser and toggle OS/browser dark mode to visually confirm shade1 and shade3/shade7 render as actual colors (not blank) in both light and dark mode, and that borders/hlines/vlines are visible in both.

- [ ] **Step 3: Run the full test suite to confirm nothing broke**

Run: `npx jest`
Expected: all 333 tests still pass (this task doesn't add or change any Jest test, since `assets/tableau.css` isn't covered by the JS test suite — this step is purely a regression check that touching the CSS file didn't somehow affect anything else).

- [ ] **Step 4: Commit**

```bash
git add assets/tableau.css
git commit -m "$(cat <<'EOF'
Add complete light/dark theming to assets/tableau.css

Defines all 9 shades' background/foreground CSS custom properties
(the reference implementation only ever shipped a partial 5-of-9 dark
palette, gated on an MkDocs-Material-specific selector rather than
the standard prefers-color-scheme). Also makes header/footer cell
backgrounds and border/line colors themeable, with dark-mode
overrides, and consolidates a dozen hardcoded "#888" occurrences in
the tb_l_* border-line rules to reuse the --tb-border-color variable
already used elsewhere in this file. Fixes a pre-existing invalid CSS
property ("border-left top") found while touching that exact rule.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

# Shade colors and dark-mode theming design

## Purpose

Shade colors (`bg(shade3)`, `fg(shade7)`, etc.) parse correctly but never
render: `do_color()` in `src/generators/html.ts` returns the literal
string `"shade3"` as a CSS value (`background: shade3`), which is not
valid CSS. RGB (`bg(#2a6)`) and recognized CSS color names (`bg(red)`)
already work correctly — they're valid CSS values on their own. Shades are
the only broken case, because `"shade3"` isn't a color, it's a name that
needs to resolve to an actual color via a CSS custom property.

The reference implementation (`../pandoc-tableau/_extensions/tableau_pre/assets/tableau.css`,
394 lines — the real, complete stylesheet the Quarto extension ships;
the guide's own CSS excerpt is illustrative and truncated, not
copy-paste-complete) defines `--shade1-bg` through `--shade9-bg` and
`--shade1-fg` through `--shade9-fg` as CSS custom properties, applies
shade colors via CSS classes (`bg-shade3`, `fg-shade3`) referencing them,
and has a dark-mode variant gated on `[data-md-color-scheme=slate]` (an
MkDocs-Material-specific attribute) that only covers shades 1–5, not 1–9 —
and even references an undefined `--shade-fg` variable. This spec fixes
the rendering gap with a different, simpler mechanism than the reference,
and ports a complete (not partial) theming system using a standard,
consumer-agnostic dark-mode trigger.

## Decisions

- **Mechanism: inline `var()`, not CSS classes.** `do_color()` returns
  `var(--${shade}-${kind})` for a `ShadeColor`, emitted as an inline style
  exactly where RGB/named colors already go
  (`background: var(--shade3-bg)`), rather than switching to a
  class-based system for shades only. This is a one-function change with
  no restructuring of how `do_cell_classes`/`do_cell_styles` split work —
  `RGBColor`/`CssColor` are completely untouched.
- **Dark-mode trigger: `@media (prefers-color-scheme: dark)`**, not the
  reference's `[data-md-color-scheme=slate]`. That selector only fires
  for consumers specifically using the MkDocs Material theme's
  data-attribute convention — not applicable to `remark-tableau`, plain
  HTML output, or the CLI's debug template. `prefers-color-scheme` is the
  standard, works automatically based on OS/browser preference in any
  consumer, no author markup required.
- **Complete dark palette (all 9 shades), not the reference's partial
  1–5.** Derived with a consistent formula rather than porting the
  reference's incomplete, non-uniform partial set: same hue per shade as
  the light-mode value (so "shade3" reads as the same color family in
  both modes), background lightness dropped to 30% (matching the
  reference's own dark shade1–5 pattern), foreground lightness raised to
  75% for contrast against a dark background, saturation held at a
  uniform 61% for both bg and fg across all 9 shades in dark mode
  (light-mode shade1 keeps its reference-verbatim special-cased 66%
  saturation / 84% lightness for bg — only dark mode is normalized,
  which happens to match what the reference's own dark-shade1 already
  did: `hsl(60deg, 61%, 30%)`, 61% not 66%).
- **Full theming pass, not shades-only**, per explicit confirmation:
  `assets/tableau.css`'s other hardcoded colors (header/footer cell
  backgrounds, border/line colors) become CSS custom properties with
  light values unchanged from today and new dark-mode overrides, in the
  same pass. Also fixes a pre-existing inconsistency found while doing
  this: `.tb_l_*` and `.tb-boxed` rules hardcode `#888` in over a dozen
  places even though `--tb-border-color` already exists and is used
  elsewhere in the same file — consolidated to reuse it.
- **`--shade-fg` gets defined** (aliased to `--shade1-fg`, mirroring the
  existing `--shade-bg` → `--shade1-bg` alias) — the reference references
  it in a CSS rule (`.fg-shade { color: var(--shade-fg) }`) but never
  defines it anywhere; a real gap in the reference, fixed here.

## Architecture

**`src/generators/html.ts`**: `do_color` gains a second parameter:

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

`do_cell_styles`'s two call sites change from `do_color(cell.bg)` /
`do_color(cell.fg)` to `do_color(cell.bg, "bg")` / `do_color(cell.fg, "fg")`.
`ShadeColor.shade` already stores the exact name needed (`"shade1"`
through `"shade9"`, or the bare `"shade"` alias — see
`SHADE_NAMES` in `src/formats/format_colors.ts`), so
`var(--${color.shade}-${kind})` produces `var(--shade3-bg)`,
`var(--shade-fg)`, etc. directly, no further mapping needed.

**`assets/tableau.css`**: gains a new `:root` block (matching the
reference and the guide's own documented convention — `:root` rather than
extending the existing `.tableau` rule, so the variables are available
even to content outside a `.tableau`-classed table, e.g. a future
`<caption>` styling pass or author overrides). Exact values:

Light-mode shades (verbatim from the reference):

```
--shade1-bg: hsl(60deg, 66%, 84%);   --shade1-fg: hsl(60deg, 66%, 44%);
--shade2-bg: hsl(95deg, 61%, 79%);   --shade2-fg: hsl(95deg, 61%, 39%);
--shade3-bg: hsl(130deg, 61%, 79%);  --shade3-fg: hsl(130deg, 61%, 39%);
--shade4-bg: hsl(165deg, 61%, 79%);  --shade4-fg: hsl(165deg, 61%, 39%);
--shade5-bg: hsl(200deg, 61%, 79%);  --shade5-fg: hsl(200deg, 61%, 39%);
--shade6-bg: hsl(235deg, 61%, 79%);  --shade6-fg: hsl(235deg, 61%, 39%);
--shade7-bg: hsl(270deg, 61%, 79%);  --shade7-fg: hsl(270deg, 61%, 39%);
--shade8-bg: hsl(305deg, 61%, 79%);  --shade8-fg: hsl(305deg, 61%, 39%);
--shade9-bg: hsl(340deg, 61%, 79%);  --shade9-fg: hsl(340deg, 61%, 39%);
--shade-bg:  var(--shade1-bg);       --shade-fg:  var(--shade1-fg);
```

Dark-mode shades (all 9, derived per the formula above), inside
`@media (prefers-color-scheme: dark)`:

```
--shade1-bg: hsl(60deg, 61%, 30%);   --shade1-fg: hsl(60deg, 61%, 75%);
--shade2-bg: hsl(95deg, 61%, 30%);   --shade2-fg: hsl(95deg, 61%, 75%);
--shade3-bg: hsl(130deg, 61%, 30%);  --shade3-fg: hsl(130deg, 61%, 75%);
--shade4-bg: hsl(165deg, 61%, 30%);  --shade4-fg: hsl(165deg, 61%, 75%);
--shade5-bg: hsl(200deg, 61%, 30%);  --shade5-fg: hsl(200deg, 61%, 75%);
--shade6-bg: hsl(235deg, 61%, 30%);  --shade6-fg: hsl(235deg, 61%, 75%);
--shade7-bg: hsl(270deg, 61%, 30%);  --shade7-fg: hsl(270deg, 61%, 75%);
--shade8-bg: hsl(305deg, 61%, 30%);  --shade8-fg: hsl(305deg, 61%, 75%);
--shade9-bg: hsl(340deg, 61%, 30%);  --shade9-fg: hsl(340deg, 61%, 75%);
--shade-bg:  var(--shade1-bg);       --shade-fg:  var(--shade1-fg);
```

Existing/new non-shade theme variables, light (unchanged values) and dark:

```
--tb-border-color: #bbb;              (dark: #666)
--tb-line-color:   #ddd;              (dark: #444)
--tb-header-bg:    #cef;              (dark: hsl(195, 40%, 20%))
--tb-footer-bg:    #ecf;              (dark: hsl(285, 40%, 20%))
```

`--tb-border-color`/`--tb-line-color` already exist; this just adds their
dark overrides. `--tb-header-bg`/`--tb-footer-bg` are new — the existing
`.tb-header { background: #cef; }` / `.tb-footer { background: #ecf; }`
rules change to reference the variables instead of the literal hex.

The `.tb_l_*` line rules and `.tb-boxed` (currently ~14 occurrences of the
literal `#888`) change to `var(--tb-border-color)`, consolidating with
the rule (`.boxed`) that already correctly uses that variable.

## Testing

New tests in `__tests__/`, since no existing test exercises shade-color
HTML rendering (the existing `format_test.ts` shade tests only assert on
*parsing*, into a `ShadeColor` object — never on generated HTML):

- `bg(shade3)` on a cell renders `style="background: var(--shade3-bg)"`.
- `fg(shade7)` on a cell renders `style="color: var(--shade7-fg)"`.
- `bg(shade)` (the bare alias, no number) renders
  `style="background: var(--shade-bg)"`.
- `bg(shade3) fg(shade7)` combined on one cell renders both correctly in
  one `style` attribute (proving the `kind` parameter is threaded
  correctly to each call site independently, not accidentally shared/
  cross-contaminated between the bg and fg branches).
- `RGBColor`/`CssColor` rendering is unchanged (a quick regression check —
  `bg(red)` still renders `style="background: red"`, `bg(#2a6)` still
  renders the `rgb(...)` form) — confirming the `do_color` signature
  change didn't disturb the other two branches.

No test changes needed for `assets/tableau.css` itself — it's a static
asset, not parsed or asserted on by the Jest suite. Manual verification
(via the CLI, `npx tsx cli/tab.ts <file>`, viewed in a browser with OS
dark mode toggled) is the practical way to confirm the visual result, and
is worth doing once during implementation, though not something to
automate.

## Out of scope

- Any change to how `RGBColor`/`CssColor` are parsed or rendered — both
  already work correctly.
- CSS classes for shades — the inline-`var()` mechanism was chosen
  instead (see Decisions).
- `[data-md-color-scheme=slate]` support — a real MkDocs-Material user
  could layer their own override CSS on top of the `prefers-color-scheme`
  defaults if they specifically need that; not built in here.
- Theming the `<caption>` element specifically (`--caption-bg` etc.) —
  captions have no styling at all yet (a gap noted when captions were
  implemented); adding caption CSS entirely is a separate follow-up, not
  part of this pass.

# remark-tableau design

## Purpose

Tableau (this repo, `ts-tableau`) separates table data from table layout and
renders HTML. It's currently consumable as a Node library and via a Quarto/
Pandoc Lua filter (`../pandoc-tableau`). This spec covers a new integration:
a [remark](https://github.com/remarkjs/remark) plugin, `remark-tableau`, that
lets any remark-based Markdown pipeline (Astro, 11ty, Next MDX, a plain
`unified()` script, etc.) render `​```tableau` fenced code blocks the same
way the Quarto extension does.

`remark-tableau` lives in its own repository, `../remark-tableau`
(`/Users/dave/Play/remark-tableau`), as a sibling to `ts-tableau` — not a
subdirectory of it. It depends on `ts-tableau` as a git dependency, the same
way any other consumer would.

This spec covers two pieces of work:

1. A small change to `ts-tableau`: extract its CSS into a shared, importable
   asset (needed so `remark-tableau` — and the existing CLI — can both use
   one canonical stylesheet).
2. The new `remark-tableau` package itself.

## 1. ts-tableau: extract CSS as a shared asset

Today the tableau stylesheet exists only as a string embedded inside
`cli/tab.ts`'s HTML debug template (`cli/tab.ts:5-125`). Nothing exports it.

Changes:

- Move the CSS into its own file: `assets/tableau.css`.
- `cli/tab.ts` reads that file (`readFileSync`) and inlines it into the debug
  template, instead of embedding the CSS as a template literal.
- Add a package export subpath in `package.json`'s `"exports"` map:
  `"./tableau.css": "./dist/tableau.css"`, so consumers can resolve it (e.g.
  `require.resolve("ts-tableau/tableau.css")` for programmatic reads, or a
  bundler-based `import "ts-tableau/tableau.css"` in a site that handles CSS
  imports).
- Add a copy step to `npm run build` (`tsc` doesn't copy non-`.ts` assets) so
  `dist/tableau.css` exists after every build.
- Fix a real bug found while extracting: the `tb_l_1001` rule
  (`cli/tab.ts:107`, at time of writing) is missing its closing `}`. Fix this
  as part of the move — it's the same file's content, just relocated and
  corrected.

No other behavior of `ts-tableau` changes. The CLI's rendered output should
be visually identical before and after (still embeds a `<style>` tag built
from the same CSS, just sourced from a file instead of a literal).

## 2. remark-tableau: architecture

A standard unified/remark plugin with one responsibility: find `​```tableau`
fenced code blocks in the mdast tree and replace each one with the rendered
HTML `<table>`.

```ts
import { visit } from "unist-util-visit"
import { tableau, generate } from "ts-tableau"
import type { Plugin } from "unified"
import type { Root, Code } from "mdast"

const remarkTableau: Plugin<[], Root> = () => (tree, file) => {
  visit(tree, "code", (node: Code) => {
    if (node.lang !== "tableau") return

    let html: string
    try {
      const table = tableau(node.value.split("\n"))
      html = generate(table).join("\n")
    } catch (err) {
      const line = node.position?.start.line
      throw new Error(`remark-tableau: ${err} (${file.path}:${line})`)
    }

    const htmlNode = node as unknown as { type: string; value: string }
    htmlNode.type = "html"
    htmlNode.value = html
  })
}

export default remarkTableau
```

Key decisions:

- **Block syntax**: fenced code blocks tagged `tableau`, matching the
  existing Quarto/Pandoc extension exactly (`_extensions/tableau_pre/tableau_pre.lua`
  matches `block.classes[1] == "tableau"` on a `CodeBlock`). Same source
  documents work in both pipelines with no syntax changes.
- **Output**: a raw HTML mdast node (`{ type: "html", value: "<table>...</table>" }`),
  not a GFM `table` node. Tableau supports spans, per-cell colors/width/
  borders — none of which plain Markdown tables can express — so raw HTML is
  the only faithful representation. This means consumers must have raw HTML
  passthrough enabled in their pipeline (`remark-rehype({ allowDangerousHtml: true })`
  + `rehype-raw`, or an MDX-style pipeline that already allows embedded
  HTML). This is documented in the package README as a setup requirement,
  not something the plugin itself can paper over.
- **Non-tableau code blocks** (any other `lang`, or no `lang`) are left
  completely untouched.
- **No plugin options for v1** — no config surface, just register the
  plugin. (The fence language `"tableau"` is hardcoded; if a future need for
  a custom tag or a class-prefix option shows up, it can be added then.)
- **Error handling**: `tableau()`/`generate()` currently `throw` plain
  strings on malformed input (e.g. `"Cannot have a format separator..."`).
  The plugin catches these and re-throws a proper `Error`, prefixed
  `remark-tableau:` and annotated with the source file path and the code
  block's starting line, so a build failure is traceable back to the
  offending block. There is no "continue on error" / fallback-rendering mode
  — a malformed block fails the build, which is the same behavior as a
  malformed table today (the Quarto Lua filter throws too via
  `parse(block.text)` failing).

## 3. Package setup

- **ESM-only.** `unist-util-visit`, `remark-parse`, and the rest of the
  current unified/remark/mdast ecosystem are pure ESM; a CommonJS package
  cannot `require()` them. `package.json`: `"type": "module"`.
- TypeScript, compiled with `tsc` to ESM + `.d.ts` output in `dist/`,
  mirroring `ts-tableau`'s build shape (`build` / `clean` / `typecheck`
  scripts, a `prepare` script so `npm install github:pragdave/remark-tableau`
  builds automatically — same reasoning as `ts-tableau`'s existing setup).
- Because the output is ESM, relative imports in the source need explicit
  `.js` extensions (Node's ESM resolution requirement) — `tsconfig.json`
  uses `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`.
- Dependencies: `ts-tableau` (git dependency, `github:pragdave/ts-tableau`),
  `unist-util-visit`. Dev dependencies: `@types/mdast`, `unified` (for
  tests), `typescript`, `vitest`.
- Consumers depend on it the same way: `npm install github:pragdave/remark-tableau`
  (or pinned to a tag/commit).

## 4. Testing plan

**Framework: Vitest**, not Jest. Vitest is ESM-native with no transform
config needed, a better fit here than `ts-tableau`'s `ts-jest` setup (which
exists because that package is CommonJS). Different repos, different needs
— no requirement to match tooling across the two.

Two levels of test:

- **Unit-level** (mdast in → mdast out), using `unified().use(remarkParse).use(remarkTableau)`
  and inspecting the resulting tree:
  - A `​```tableau` block becomes an `html` node containing the expected
    `<table>` markup.
  - A non-`tableau` code block (e.g. `​```js`) is left as a `code` node,
    untouched.
  - Multiple `​```tableau` blocks in one document are all converted.
  - A malformed `​```tableau` block causes the pipeline to throw an `Error`
    whose message starts with `remark-tableau:` and includes the source
    line number.
- **Integration-level**: one test running the full realistic pipeline —
  `remark-parse` → `remark-tableau` → `remark-rehype` (`allowDangerousHtml: true`)
  → `rehype-raw` → `rehype-stringify` — against a sample Markdown document,
  asserting the final HTML string. This is both a correctness check and
  living documentation of the exact wiring consumers need.

## Out of scope for v1

- CSS auto-injection into the consumer's page — the plugin only emits table
  HTML with classes; wiring the stylesheet into a page (via the new
  `ts-tableau/tableau.css` export) is left to the site author.
- Configurable fence language / class-prefix options.
- Publishing to the npm registry — distribution is via git dependency only,
  matching `ts-tableau`.

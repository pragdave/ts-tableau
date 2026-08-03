# remark-tableau Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract ts-tableau's CSS into a shared, importable asset, then build `remark-tableau`, a standalone remark plugin (in its own sibling repo) that renders `​```tableau` fenced code blocks as HTML tables.

**Architecture:** ts-tableau gains one new asset file plus a package export subpath. `remark-tableau` is a new ESM TypeScript package at `/Users/dave/Play/remark-tableau`, depending on `ts-tableau` as a git dependency, exposing a single unified/remark transformer that walks the mdast tree, converts `​```tableau` code nodes into raw `html` nodes via `tableau()`/`generate()`, and leaves everything else untouched.

**Tech Stack:** TypeScript, `tsc` (both repos), Jest/ts-jest (ts-tableau, unchanged), Vitest (remark-tableau), unified/remark-parse/unist-util-visit/@types/mdast, remark-rehype/rehype-raw/rehype-stringify (remark-tableau devDependencies, for the integration test).

## Global Constraints

- Block syntax: fenced code blocks tagged `tableau` (` ```tableau `), matching the existing Quarto/Pandoc extension exactly.
- Output: a raw HTML mdast node (`{ type: "html", value: "<table>...</table>" }`), never a GFM `table` node — Tableau's spans/per-cell styling have no GFM equivalent.
- No plugin configuration options for v1.
- Errors from malformed `​```tableau` blocks must surface as `Error`s whose message starts with `remark-tableau: ` and includes the source file path and the block's starting line.
- `remark-tableau` is ESM-only (`"type": "module"`), TypeScript compiled via `tsc` with `"module": "NodeNext"` / `"moduleResolution": "NodeNext"`.
- Distribution is via git dependency only (`github:pragdave/ts-tableau`, `github:pragdave/remark-tableau`) — no npm registry publish.
- `remark-tableau` tests use Vitest, not Jest.
- ts-tableau's CSS lives in `assets/tableau.css`, exported as `"./tableau.css"` in `package.json`'s `exports` map, and copied into `dist/tableau.css` on build.

---

### Task 1: Extract ts-tableau's CSS into a shared asset

**Files:**
- Create: `/Users/dave/Play/ts-tableau/assets/tableau.css`
- Modify: `/Users/dave/Play/ts-tableau/cli/tab.ts`
- Modify: `/Users/dave/Play/ts-tableau/package.json`

**Interfaces:**
- Produces: `assets/tableau.css` (source), copied to `dist/tableau.css` on build, resolvable by any consumer via `require.resolve("ts-tableau/tableau.css")` or `import "ts-tableau/tableau.css"`.

- [ ] **Step 1: Create `assets/tableau.css`**

Create the directory and file with this exact content (this is the CSS currently embedded in `cli/tab.ts`'s template literal, with one bug fixed: the `tb_l_1001` rule was missing its closing `}`):

```css
.tableau {
  --tb-border-color: #bbb;
  --tb-line-color: #ddd;
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
    background: #cef;
  }
  &.tb-footer {
    background: #ecf;
  }

  &.tb-boxed  { border: 1px solid #888; }
  &.tb_l_1111 { border: 1px solid #888; }
  /*     TRBL */
  &.tb_l_0001 { border-left: 1px solid #888; }
  &.tb_l_0010 { border-bottom: 1px solid #888; }
  &.tb_l_0011 { border-left top: 1px solid #888; border-bottom: 1px solid #888; }
  &.tb_l_0100 { border-right: 1px solid #888; }
  &.tb_l_0101 { border-left: 1px solid #888; border-right: 1px solid #888; }
  &.tb_l_0110 { border-right: 1px solid #888; border-bottom: 1px solid #888; }
  &.tb_l_0111 { border-right: 1px solid #888; border-left: 1px solid #888; border-bottom: 1px solid #888; }
  &.tb_l_1000 { border-top: 1px solid #888; }
  &.tb_l_1001 { border-top: 1px solid #888; border-left: 1px solid #888; }
  &.tb_l_1010 { border-top: 1px solid #888; border-bottom: 1px solid #888; }
  &.tb_l_1011 { border-top: 1px solid #888; border-left: 1px solid #888; border-bottom: 1px solid #888; }
  &.tb_l_1100 { border-top: 1px solid #888; border-right: 1px solid #888; }
  &.tb_l_1101 { border-top: 1px solid #888; border-right: 1px solid #888; border-left: 1px solid #888; }
  &.tb_l_1110 { border-top: 1px solid #888; border-right: 1px solid #888; border-bottom: 1px solid #888; }
}
```

- [ ] **Step 2: Update `cli/tab.ts` to read the CSS from the file**

Replace the current content of `cli/tab.ts` with:

```ts
import { generate } from "../src/generators/html"
import { tableau } from "../src/tableau"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const css = readFileSync(join(__dirname, "..", "assets", "tableau.css"), "utf-8")

const template = `
<html>
<head><style>
!css!
</style></head>
<body>
  !content!
  <br/><br/>
  <pre><code>!original!</code></pre>
  <br/><br/>
  <pre><code>!tableau!</code></pre>
</body>
</html>
`

const name = process.argv[2]
const data = readFileSync(name, 'utf-8')
const lines = data.split("\n")
const table = tableau(lines)
const html = generate(table)
console.log(
	template
		.replace('!css!', css)
		.replace('!original!', data)
		.replace('!tableau!', JSON.stringify(table, null, "    "))
		.replace('!content!', html.join("\n")))
```

- [ ] **Step 3: Add the CSS export subpath and build copy step to `package.json`**

In `/Users/dave/Play/ts-tableau/package.json`, change the `"exports"` block from:

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
```

to:

```json
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./tableau.css": "./dist/tableau.css"
  },
```

And change the `"build"` script from:

```json
    "build": "npm run clean && tsc",
```

to:

```json
    "build": "npm run clean && tsc && cp assets/tableau.css dist/tableau.css",
```

- [ ] **Step 4: Verify the build produces the CSS asset**

Run:
```bash
cd /Users/dave/Play/ts-tableau
npm run build
test -f dist/tableau.css && echo "dist/tableau.css exists"
```
Expected: prints `dist/tableau.css exists`.

- [ ] **Step 5: Verify the CLI still renders correctly with the extracted CSS**

Run:
```bash
printf 'a|b\nc|d\n' > /tmp/sample.tab
npx tsx cli/tab.ts /tmp/sample.tab | grep -c "tb_l_1001"
npx tsx cli/tab.ts /tmp/sample.tab | grep -c "<table"
```
Expected: both commands print a number >= 1 (confirms the CSS file was read and inlined, and the table itself still renders).

- [ ] **Step 6: Run the full ts-tableau test suite to confirm nothing else broke**

Run:
```bash
npx jest
```
Expected: `Tests: 270 passed, 270 total` (same as before this change — this task doesn't touch anything jest covers, this is a regression check).

- [ ] **Step 7: Commit and push**

```bash
cd /Users/dave/Play/ts-tableau
git add assets/tableau.css cli/tab.ts package.json
git commit -m "$(cat <<'EOF'
Extract CSS into a shared, exportable asset

Move the tableau stylesheet out of cli/tab.ts's inline template
literal into assets/tableau.css, and export it via package.json's
"./tableau.css" exports subpath so other consumers (starting with
remark-tableau) can use the same canonical stylesheet the CLI does.
Also fixes a missing closing brace on the tb_l_1001 rule, found while
extracting.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
git push origin main
```

**This push is required before Task 3** — `remark-tableau`'s `package.json` will depend on `github:pragdave/ts-tableau`, which npm resolves from the pushed remote, not the local working copy.

---

### Task 2: Scaffold the remark-tableau package

**Files:**
- Create: `/Users/dave/Play/remark-tableau/package.json`
- Create: `/Users/dave/Play/remark-tableau/tsconfig.json`
- Create: `/Users/dave/Play/remark-tableau/.gitignore`
- Create: `/Users/dave/Play/remark-tableau/src/index.ts` (stub)

**Interfaces:**
- Consumes: `ts-tableau`'s package (pushed in Task 1) via `github:pragdave/ts-tableau`.
- Produces: an installable, typecheckable empty package skeleton that Task 3 fills in.

- [ ] **Step 1: Create the directory and initialize git**

```bash
mkdir -p /Users/dave/Play/remark-tableau/src
cd /Users/dave/Play/remark-tableau
git init
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "remark-tableau",
  "version": "0.1.0",
  "description": "A remark plugin that renders Tableau (ts-tableau) fenced code blocks as HTML tables.",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "npm run clean && tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "prepare": "npm run build",
    "test": "vitest run"
  },
  "keywords": [
    "remark",
    "remark-plugin",
    "markdown",
    "tableau"
  ],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "ts-tableau": "github:pragdave/ts-tableau",
    "unist-util-visit": "^5.0.0"
  },
  "devDependencies": {
    "@types/mdast": "^4.0.4",
    "@types/node": "^22.0.0",
    "rehype-raw": "^7.0.0",
    "rehype-stringify": "^10.0.1",
    "remark-parse": "^11.0.0",
    "remark-rehype": "^11.1.1",
    "typescript": "^5.6.2",
    "unified": "^11.0.5",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "declaration": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "lib": [ "es2020" ],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "strict": true,
    "target": "es2020",
    "types": [ "node" ]
  },
  "include": [ "src/**/*.ts" ]
}
```

- [ ] **Step 4: Write `.gitignore`**

```
node_modules/
dist/
```

- [ ] **Step 5: Write a stub `src/index.ts`**

```ts
export {}
```

- [ ] **Step 6: Install dependencies**

```bash
cd /Users/dave/Play/remark-tableau
npm install
```
Expected: completes without error. (This also runs the `prepare` script, which runs `npm run build` against the stub `src/index.ts` — expect a `dist/index.js` and `dist/index.d.ts` to be created, both essentially empty.)

- [ ] **Step 7: Verify typecheck passes on the stub**

```bash
npx tsc --noEmit
```
Expected: no output, exit code 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Scaffold remark-tableau package

ESM TypeScript package skeleton: package.json (depends on ts-tableau
as a git dependency), tsconfig.json (NodeNext module resolution,
required since the unified/remark ecosystem is ESM-only), and a stub
entry point to be filled in next.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 3: Implement the plugin and its core unit tests

**Files:**
- Create: `/Users/dave/Play/remark-tableau/test/index.test.ts`
- Modify: `/Users/dave/Play/remark-tableau/src/index.ts`

**Interfaces:**
- Consumes: `tableau(lines: string[]): TableData` and `generate(table: TableData): string[]` from `ts-tableau` (both exported from `ts-tableau`'s `src/index.ts`, confirmed working in the ts-tableau repo).
- Produces: `remarkTableau`, the default export of `src/index.ts` — a unified `Plugin<[], Root>` with no options, usable as `.use(remarkTableau)` in any unified/remark pipeline. Later tasks (4) import it as `import remarkTableau from "../src/index.js"`.

- [ ] **Step 1: Write the failing tests**

Create `test/index.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkTableau from "../src/index.js"

function run(markdown: string) {
  const processor = unified().use(remarkParse).use(remarkTableau)
  return processor.runSync(processor.parse(markdown))
}

describe("remark-tableau", () => {
  it("converts a tableau code block into an html node", () => {
    const tree = run("```tableau\na|b\nc|d\n```\n")
    const node = tree.children[0] as any
    expect(node.type).toBe("html")
    expect(node.value).toContain("<table")
    expect(node.value).toContain("<td>a</td>")
    expect(node.value).toContain("<td>d</td>")
  })

  it("leaves non-tableau code blocks untouched", () => {
    const tree = run("```js\nconst x = 1\n```\n")
    const node = tree.children[0] as any
    expect(node.type).toBe("code")
    expect(node.lang).toBe("js")
  })

  it("converts multiple tableau blocks in the same document", () => {
    const tree = run("```tableau\na|b\n```\n\n```tableau\nc|d\n```\n")
    expect((tree.children[0] as any).type).toBe("html")
    expect((tree.children[1] as any).type).toBe("html")
  })

  it("throws a descriptive error on a malformed tableau block", () => {
    const markdown = "```tableau\na|b\n===\n===\n```\n"
    expect(() => run(markdown)).toThrowError(/^remark-tableau: /)
  })
})
```

- [ ] **Step 2: Run the tests and verify they fail**

```bash
cd /Users/dave/Play/remark-tableau
npx vitest run
```
Expected: FAIL — the stub `src/index.ts` has no default export, so every test errors on import/usage.

- [ ] **Step 3: Implement the plugin**

Replace the content of `src/index.ts` with:

```ts
import { visit } from "unist-util-visit"
import { tableau, generate } from "ts-tableau"
import type { Plugin } from "unified"
import type { Root, Html } from "mdast"

const LANGUAGE = "tableau"

const remarkTableau: Plugin<[], Root> = () => {
  return (tree, file) => {
    visit(tree, "code", (node, index, parent) => {
      if (node.lang !== LANGUAGE || !parent || index === null) return

      let value: string
      try {
        const table = tableau(node.value.split("\n"))
        value = generate(table).join("\n")
      } catch (err) {
        const line = node.position?.start.line
        throw new Error(`remark-tableau: ${err} (${file.path}:${line})`)
      }

      const htmlNode: Html = { type: "html", value }
      parent.children[index] = htmlNode
    })
  }
}

export default remarkTableau
```

- [ ] **Step 4: Run the tests and verify they pass**

```bash
npx vitest run
```
Expected: `4 passed`.

- [ ] **Step 5: Run typecheck**

```bash
npx tsc --noEmit
```
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts test/index.test.ts
git commit -m "$(cat <<'EOF'
Implement the core remark-tableau transform

Walk the mdast tree for ```tableau code blocks and replace each with
an html node containing the rendered <table>, via ts-tableau's
tableau()/generate(). Non-tableau code blocks pass through untouched.
Malformed blocks raise an Error prefixed "remark-tableau: " and
annotated with the source file and line, so build failures are
traceable to the offending block.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 4: Add the full-pipeline integration test

**Files:**
- Create: `/Users/dave/Play/remark-tableau/test/integration.test.ts`

**Interfaces:**
- Consumes: `remarkTableau` (default export from Task 3's `src/index.ts`).

- [ ] **Step 1: Write the integration test**

Create `test/integration.test.ts`:

```ts
import { describe, expect, it } from "vitest"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import remarkTableau from "../src/index.js"

describe("remark-tableau integration", () => {
  it("renders a tableau block to HTML through the full remark/rehype pipeline", async () => {
    const markdown = [
      "# Heading",
      "",
      "```tableau",
      "a|b",
      "c|d",
      "```",
      "",
      "Some text after.",
      "",
    ].join("\n")

    const file = await unified()
      .use(remarkParse)
      .use(remarkTableau)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeRaw)
      .use(rehypeStringify)
      .process(markdown)

    const html = String(file)
    expect(html).toContain("<h1>Heading</h1>")
    expect(html).toContain('<table class="tableau')
    expect(html).toContain("<td>a</td>")
    expect(html).toContain("<td>d</td>")
    expect(html).toContain("<p>Some text after.</p>")
  })
})
```

- [ ] **Step 2: Run the tests**

```bash
cd /Users/dave/Play/remark-tableau
npx vitest run
```
Expected: `5 passed` (the 4 from Task 3 plus this one). This test exercises the plugin's behavior in a realistic consumer pipeline rather than driving new implementation, so unlike Task 3 there's no separate "expect it to fail first" step — a pass here on the first run confirms Task 3's implementation is correctly consumable end-to-end.

- [ ] **Step 3: Commit**

```bash
git add test/integration.test.ts
git commit -m "$(cat <<'EOF'
Add full-pipeline integration test

Exercises remark-tableau through the exact wiring a real consumer
needs (remark-rehype with allowDangerousHtml + rehype-raw +
rehype-stringify), asserting the final HTML string. Doubles as living
documentation of the required pipeline setup.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Lq7q2yHKdwk7ZbqhpC5DHh
EOF
)"
```

---

### Task 5: Verify the build output

**Files:** none created or modified — verification only.

**Interfaces:** none.

- [ ] **Step 1: Run a clean build**

```bash
cd /Users/dave/Play/remark-tableau
npm run build
ls dist/index.js dist/index.d.ts
```
Expected: both files listed, no errors.

- [ ] **Step 2: Smoke-test the built output as a real ESM consumer would**

```bash
node --input-type=module -e "
import remarkTableau from './dist/index.js'
console.log(typeof remarkTableau)
"
```
Expected: prints `function`.

- [ ] **Step 3: Run the full test suite one more time**

```bash
npx vitest run
```
Expected: `5 passed`.

- [ ] **Step 4: Commit (if the build step changed anything tracked)**

`dist/` is gitignored, so this step should produce no diff. Run `git status --short` to confirm — expected: empty (nothing to commit). If anything unexpected shows up, stop and investigate before committing.

---

## Not covered by this plan

- Creating a GitHub remote for `remark-tableau` and pushing it there. The plan leaves this repo local-only; creating new remote infrastructure is a separate, explicitly-confirmed action to take once you're ready to depend on it from another project.
- Wiring the `ts-tableau/tableau.css` asset into any actual site — out of scope per the design spec.

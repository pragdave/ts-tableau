# Tableau Playground Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an in-browser playground for ts-tableau's markup language (editor + live-rendered table + error display), deployable as a static page, plus a CLI command that builds and launches it locally.

**Architecture:** A new `playground/` directory at the repo root, independent of the existing `docs/` (Quarto guide sources). `playground/lib.ts` is a thin, pure, testable bridge to the library's existing `tableau()`/`generate()` exports. `playground/index.html` + `playground/main.ts` are a CodeMirror-based editor page (following the same structure as the sibling picjs project's playground at `/Users/dave/Play/picjs/docs/index.html`) that calls `lib.ts` on every edit. `playground/vite.config.ts` bundles the page to `playground/dist`. `playground/serve.mjs` is the CLI entry point: build-if-stale, serve `dist/` with a plain Node HTTP server, open the browser.

**Tech Stack:** TypeScript, Vite (devDependency, build only), CodeMirror 6 and `marked` loaded from `esm.sh` at runtime (no new runtime npm dependency), Jest (existing test runner) for `lib.ts`.

## Global Constraints

- Input is raw tableau markup only — no Markdown-with-fenced-`tableau`-blocks mode. (spec: Non-goals)
- No GitHub Pages workflow / CI wiring in this work. (spec: Non-goals)
- The playground imports the library from `../src/tableau` and `../src/generators/html` directly (source-relative), not from the published `ts-tableau` npm package. (spec: `lib.ts`)
- No new runtime dependency is added to `package.json` for the library itself. CodeMirror and `marked` are loaded from `esm.sh` inside `playground/` only. `vite` is the only new `package.json` entry, as a devDependency. (spec: Dependencies added)
- `playground/` lives at the repo root, separate from `docs/` (which holds Quarto guide sources and spec/plan docs and must not be touched by this work). (spec: Location)

---

### Task 1: `playground/lib.ts` — bridge to ts-tableau, with tests

**Files:**
- Create: `playground/lib.ts`
- Test: `__tests__/playground_lib_test.ts`

**Interfaces:**
- Produces: `run(source: string): PlaygroundResult` where
  `PlaygroundResult = { ok: true; html: string; tableData: TableData } | { ok: false; error: string }`.
  This is the only entry point `main.ts` (Tasks 2–4) will call into the library through.

- [ ] **Step 1: Write the failing tests**

Create `__tests__/playground_lib_test.ts`:

```ts
import { run } from "../playground/lib"

test("run() returns generated HTML and table data for valid input", () => {
  const result = run("a|b\nc|d")
  expect(result.ok).toBe(true)
  if (result.ok) {
    expect(result.html).toContain("<table")
    expect(result.html).toContain("<tableau-md>a</tableau-md>")
    expect(result.tableData.row_count()).toBe(2)
  }
})

test("run() normalizes a thrown string into an error message", () => {
  // src/tableau.ts throws a plain string when '===' appears twice
  const result = run("a|b\n===\nboxed\n===\nboxed")
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error).toBe(
      "Cannot have a format separator ('===') in the format section"
    )
  }
})

test("run() normalizes a thrown Error into its message", () => {
  // src/parser/parse_formats.ts throws `new Error(...)` for unrecognized format text
  const result = run("a|b\n===\ngarbledtext123")
  expect(result.ok).toBe(false)
  if (!result.ok) {
    expect(result.error).toMatch(/unrecognized format/)
  }
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest __tests__/playground_lib_test.ts`
Expected: FAIL — `Cannot find module '../playground/lib'`

- [ ] **Step 3: Write `playground/lib.ts`**

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

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest __tests__/playground_lib_test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: all existing tests still pass, plus the 3 new ones

- [ ] **Step 6: Commit**

```bash
git add playground/lib.ts __tests__/playground_lib_test.ts
git commit -m "Add playground lib.ts bridge to ts-tableau, with tests"
```

---

### Task 2: Playground shell — build config, page, CodeMirror editor

**Files:**
- Create: `playground/vite.config.ts`
- Create: `playground/index.html`
- Create: `playground/main.ts`

**Interfaces:**
- Consumes: `run(source: string): PlaygroundResult` from `playground/lib.ts` (Task 1).
- Produces: a working page reachable via `vite preview`/static serving, editable via CodeMirror, rendering tables or errors on every keystroke. Later tasks (3, 4) extend `main.ts`'s `render()` function and `index.html`'s result-toolbar — both defined here.

- [ ] **Step 1: Write `playground/vite.config.ts`**

```ts
import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: __dirname,
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
})
```

- [ ] **Step 2: Write `playground/index.html`**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tableau Playground</title>
  <style>
    :root {
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      --font-mono: 'SF Mono', 'Fira Code', Consolas, monospace;
      --bg-page: #f5f5f5;
      --bg-panel: #ffffff;
      --bg-header: #f0f0f0;
      --border-color: #e0e0e0;
      --text-primary: #333333;
      --text-secondary: #666666;
      --accent: #1976d2;
      --error-bg: #fff5f5;
      --error-border: #ffcdd2;
      --error-text: #c62828;
    }

    html.dark {
      --bg-page: #1a1a1a;
      --bg-panel: #242424;
      --bg-header: #2a2a2a;
      --border-color: #3a3a3a;
      --text-primary: #e0e0e0;
      --text-secondary: #999999;
      --accent: #5ca0e8;
      --error-bg: #2a1a1a;
      --error-border: #5a2a2a;
      --error-text: #ef5350;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: var(--font-sans);
      background: var(--bg-page);
      color: var(--text-primary);
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }

    header {
      padding: 12px 20px;
      background: var(--bg-panel);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
    }

    header h1 { margin: 0; font-size: 1.25rem; font-weight: 600; }
    header .subtitle { color: var(--text-secondary); font-size: 0.85rem; max-width: 60ch; }

    #theme-toggle {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 4px 8px;
      cursor: pointer;
      font-size: 1rem;
      color: var(--text-primary);
    }

    main { display: flex; flex: 1; min-height: 0; }
    .pane { flex: 1; display: flex; flex-direction: column; min-width: 0; }

    .pane-header {
      padding: 8px 16px;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-shrink: 0;
      gap: 12px;
    }

    .editor-pane { border-right: 1px solid var(--border-color); }

    #source-editor { flex: 1; width: 100%; overflow: auto; background: var(--bg-panel); }
    #source-editor .cm-editor { height: 100%; font-family: var(--font-mono); font-size: 13px; }
    #source-editor .cm-scroller { padding: 16px; line-height: 1.5; }
    #source-editor .cm-focused { outline: none; }

    .editor-toolbar {
      padding: 8px 16px;
      background: var(--bg-header);
      border-top: 1px solid var(--border-color);
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .editor-toolbar label, .result-toolbar label {
      font-size: 0.8rem;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
    }

    .editor-toolbar button {
      padding: 6px 12px;
      font-size: 0.8rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--bg-panel);
      cursor: pointer;
    }

    .editor-toolbar button:hover { background: var(--bg-header); }

    .result-pane { background: var(--bg-panel); overflow: auto; }

    .result-toolbar {
      padding: 8px 16px;
      background: var(--bg-header);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    #result-container { padding: 16px; }
    #result-container.has-error { background: var(--error-bg); }
    #result-container pre {
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.6;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    #result-container.has-error pre {
      padding: 16px;
      background: var(--error-bg);
      border: 1px solid var(--error-border);
      border-radius: 4px;
      color: var(--error-text);
    }

    #example-selector {
      padding: 4px 8px;
      font-size: 0.8rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--bg-panel);
      color: var(--text-primary);
    }

    footer {
      padding: 8px 20px;
      background: var(--bg-panel);
      border-top: 1px solid var(--border-color);
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-align: center;
      flex-shrink: 0;
    }

    @media (max-width: 768px) {
      main { flex-direction: column; }
      .editor-pane { border-right: none; border-bottom: 1px solid var(--border-color); min-height: 40vh; }
      .result-pane { min-height: 40vh; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Tableau Playground</h1>
      <div class="subtitle">Type tableau markup on the left, see the rendered table on the right.</div>
    </div>
    <button id="theme-toggle" title="Toggle dark mode">&#9790;</button>
  </header>

  <main>
    <section class="pane editor-pane">
      <div class="pane-header">
        <span>Source</span>
        <select id="example-selector">
          <option value="">-- Load Example --</option>
          <option value="simple">Simple Table</option>
          <option value="headerfooter">Header Row + Rule Lines</option>
          <option value="spans">Column/Row Spans</option>
          <option value="alignment">Column Alignment</option>
          <option value="blocks">Block Content</option>
          <option value="caption">Caption</option>
          <option value="dynamic">Dynamic Selectors ($tr)</option>
        </select>
      </div>
      <div id="source-editor"></div>
      <div class="editor-toolbar">
        <label><input type="checkbox" id="auto-render" checked> Auto-render</label>
        <button id="render-btn">Render</button>
        <button id="clear-btn">Clear</button>
      </div>
    </section>

    <section class="pane result-pane">
      <div class="pane-header">
        <span>Result</span>
        <span id="render-status"></span>
      </div>
      <div class="result-toolbar"></div>
      <div id="result-container">
        <div id="table-output"></div>
      </div>
    </section>
  </main>

  <footer>tableau &mdash; table layout, separated from data</footer>

  <script type="module" src="./main.ts"></script>
</body>
</html>
```

(The empty `<div class="result-toolbar">` is populated with checkboxes in Tasks 3 and 4.)

- [ ] **Step 3: Write `playground/main.ts`**

```ts
import { run } from "./lib"

import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter } from "https://esm.sh/@codemirror/view@6"
import { Compartment } from "https://esm.sh/@codemirror/state@6"
import { StreamLanguage, syntaxHighlighting, HighlightStyle } from "https://esm.sh/@codemirror/language@6"
import { tags } from "https://esm.sh/@lezer/highlight@1"
import { history, defaultKeymap, historyKeymap } from "https://esm.sh/@codemirror/commands@6"

// --- tableau syntax highlighting ------------------------------------------

const FORMAT_KEYWORDS = /\b(align|bg|fg|width|lines|style|header|footer|small|hlines|vlines|boxed|span|caption|class)\b/

const tableauLanguage = StreamLanguage.define({
  token(stream) {
    if (stream.sol() && stream.match(/^\s*===\s*$/)) return "separatorToken"
    if (stream.eatSpace()) return null

    if (stream.match(/^--.*/)) return "comment"

    if (stream.sol() && stream.match(/^\s*(col(?:umn)?\s*\w+\s*\{\{|\}\})/)) return "keyword"

    if (stream.match(/^\[[^\]]*\]/)) return "atom"

    if (stream.match(FORMAT_KEYWORDS)) return "keyword"

    if (stream.match(/^\$[a-zA-Z_][a-zA-Z0-9_]*/)) return "variableName.special"

    if (stream.match(/^\d+(\.\d+)?/)) return "number"

    if (stream.sol() && stream.match(/^[#:].*/)) return "string"

    if (stream.match(/^\|/)) return "punctuation"

    stream.next()
    return null
  },
})

const highlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#6a737d" },
  { tag: tags.string, color: "#032f62" },
  { tag: tags.number, color: "#005cc5" },
  { tag: tags.keyword, color: "#d73a49" },
  { tag: tags.atom, color: "#6f42c1" },
  { tag: tags.special(tags.variableName), color: "#e36209" },
])

const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.comment, color: "#8b949e" },
  { tag: tags.string, color: "#a5d6ff" },
  { tag: tags.number, color: "#79c0ff" },
  { tag: tags.keyword, color: "#ff7b72" },
  { tag: tags.atom, color: "#d2a8ff" },
  { tag: tags.special(tags.variableName), color: "#ffa657" },
])

// --- examples --------------------------------------------------------------

const examples: Record<string, string> = {
  simple: `Aardvark|Bear
Cat|Dog`,

  headerfooter: `Name|Score|Grade
Alice|92|A
Bob|81|B
Carol|74|C
===
[r1] header
hlines`,

  spans: `a|b
c|d
===
[r1:c1-2] span`,

  alignment: `Name|Score
Alice|92
Bob|81
===
[c2] align(r)`,

  blocks: `Cicero|||
col2 {{
  paragraph one

  paragraph two
}}`,

  caption: `a|b
===
# My Caption`,

  dynamic: `a|b|c
d|e|f
g|h|i
===
[c$tr] bg(red)`,
}

// --- DOM elements ------------------------------------------------------------

const editorContainer = document.getElementById("source-editor")!
const tableOutput = document.getElementById("table-output")!
const resultContainer = document.getElementById("result-container")!
const autoRenderCheckbox = document.getElementById("auto-render") as HTMLInputElement
const renderBtn = document.getElementById("render-btn")!
const clearBtn = document.getElementById("clear-btn")!
const exampleSelector = document.getElementById("example-selector") as HTMLSelectElement
const renderStatus = document.getElementById("render-status")!

let editor: EditorView

// --- render ------------------------------------------------------------------

function render() {
  const source = editor.state.doc.toString()
  const startTime = performance.now()
  const result = run(source)
  const elapsed = (performance.now() - startTime).toFixed(1)

  if (!result.ok) {
    resultContainer.classList.add("has-error")
    tableOutput.innerHTML = ""
    const pre = document.createElement("pre")
    pre.textContent = result.error
    tableOutput.appendChild(pre)
    renderStatus.textContent = "Error"
    renderStatus.style.color = "var(--error-text)"
  } else {
    resultContainer.classList.remove("has-error")
    tableOutput.innerHTML = result.html
    renderStatus.textContent = `${elapsed}ms`
    renderStatus.style.color = ""
  }

  try {
    localStorage.setItem("tableau-playground-source", source)
  } catch (e) {
    // localStorage unavailable (private browsing etc.) -- ignore
  }
}

function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout>
  return ((...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

const debouncedRender = debounce(render, 300)

// --- URL / example handling --------------------------------------------------

function getExampleFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get("example")
}

function setExampleInUrl(name: string | null) {
  const url = new URL(window.location.href)
  if (name) {
    url.searchParams.set("example", name)
  } else {
    url.searchParams.delete("example")
  }
  window.history.replaceState(null, "", url)
}

function setEditorContent(content: string) {
  editor.dispatch({
    changes: { from: 0, to: editor.state.doc.length, insert: content },
  })
}

function getInitialContent(): string {
  const urlExample = getExampleFromUrl()
  if (urlExample && examples[urlExample]) {
    return examples[urlExample]
  }
  try {
    const saved = localStorage.getItem("tableau-playground-source")
    if (saved) return saved
  } catch (e) {
    // ignore
  }
  return examples.simple
}

// --- events --------------------------------------------------------------

renderBtn.addEventListener("click", render)

clearBtn.addEventListener("click", () => {
  setEditorContent("")
  setExampleInUrl(null)
  render()
})

exampleSelector.addEventListener("change", (e) => {
  const key = (e.target as HTMLSelectElement).value
  if (key && examples[key]) {
    setEditorContent(examples[key])
    setExampleInUrl(key)
    render()
  }
  ;(e.target as HTMLSelectElement).value = ""
})

// --- theme -----------------------------------------------------------------

const themeCompartment = new Compartment()

function isDark(): boolean {
  return document.documentElement.classList.contains("dark")
}

function getHighlightExtension() {
  return syntaxHighlighting(isDark() ? darkHighlightStyle : highlightStyle)
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark)
  try {
    localStorage.setItem("tableau-playground-theme", dark ? "dark" : "light")
  } catch (e) {
    // ignore
  }
  if (editor) {
    editor.dispatch({ effects: themeCompartment.reconfigure(getHighlightExtension()) })
  }
  const btn = document.getElementById("theme-toggle")!
  btn.textContent = dark ? "☀" : "☾"
  btn.title = dark ? "Switch to light mode" : "Switch to dark mode"
}

const storedTheme = (() => {
  try {
    return localStorage.getItem("tableau-playground-theme")
  } catch (e) {
    return null
  }
})()
if (storedTheme === "dark" || (!storedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add("dark")
}

document.getElementById("theme-toggle")!.addEventListener("click", () => applyTheme(!isDark()))

// --- init --------------------------------------------------------------------

const tableauKeymap = keymap.of([
  { key: "Mod-Enter", run: () => { render(); return true } },
])

const updateListener = EditorView.updateListener.of((update) => {
  if (update.docChanged) {
    if (getExampleFromUrl()) setExampleInUrl(null)
    if (autoRenderCheckbox.checked) debouncedRender()
  }
})

editor = new EditorView({
  doc: getInitialContent(),
  extensions: [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    tableauKeymap,
    tableauLanguage,
    themeCompartment.of(getHighlightExtension()),
    updateListener,
    EditorView.lineWrapping,
  ],
  parent: editorContainer,
})

applyTheme(isDark())
render()
```

- [ ] **Step 4: Add the `vite` devDependency and a build script**

Edit `package.json`: add `"vite": "^6.0.0"` to `devDependencies`, and add to `scripts`:

```json
"playground:build": "vite build --config playground/vite.config.ts",
```

Run: `npm install`

- [ ] **Step 5: Build and smoke-test the page**

Run: `npm run playground:build`
Expected: exits 0, creates `playground/dist/index.html` and a bundled JS asset.

Run: `grep -q "Tableau Playground" playground/dist/index.html && echo OK`
Expected: prints `OK`

- [ ] **Step 6: Manually verify in a browser**

Serve `playground/dist` with any static server (e.g. `npx serve playground/dist` or Python's `http.server`) and open it. Confirm:
- The `simple` example renders as a two-row table on load.
- Typing in the editor re-renders the table after a short pause.
- `Cmd/Ctrl+Enter` forces an immediate render.
- Loading each example from the dropdown renders without a JS console error.
- Typing deliberately broken input (e.g. two `===` lines) shows the error pane with the message, not a crash.
- The theme toggle switches light/dark and persists across a reload.

- [ ] **Step 7: Commit**

```bash
git add playground/vite.config.ts playground/index.html playground/main.ts package.json package-lock.json
git commit -m "Add tableau playground shell with CodeMirror editor and examples"
```

---

### Task 3: Result pane — "Show generated HTML" and "Show parsed JSON" toggles

**Files:**
- Modify: `playground/index.html`
- Modify: `playground/main.ts`

**Interfaces:**
- Consumes: the `render()` function, `PlaygroundResult` shape, and `<div class="result-toolbar">` / `<div id="result-container">` structure from Task 2.
- Produces: no new exports; extends `render()` in place so Task 4 can add its own toggle alongside these.

- [ ] **Step 1: Add the toggle checkboxes and debug panels to `playground/index.html`**

Replace:

```html
      <div class="result-toolbar"></div>
      <div id="result-container">
        <div id="table-output"></div>
      </div>
```

with:

```html
      <div class="result-toolbar">
        <label><input type="checkbox" id="html-toggle"> Show generated HTML</label>
        <label><input type="checkbox" id="json-toggle"> Show parsed JSON</label>
      </div>
      <div id="result-container">
        <div id="table-output"></div>
        <div id="html-output" class="debug-panel" hidden><pre></pre></div>
        <div id="json-output" class="debug-panel" hidden><pre></pre></div>
      </div>
```

Also add this rule inside the `<style>` block, next to the other `#result-container` rules:

```css
    .debug-panel { margin-top: 16px; }
    .debug-panel pre {
      background: var(--bg-header);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      padding: 12px;
      overflow: auto;
    }
```

- [ ] **Step 2: Wire the toggles up in `playground/main.ts`**

Add these two lines next to the other DOM-element lookups (after `const exampleSelector = ...`):

```ts
const htmlOutput = document.getElementById("html-output") as HTMLElement
const jsonOutput = document.getElementById("json-output") as HTMLElement
const htmlToggle = document.getElementById("html-toggle") as HTMLInputElement
const jsonToggle = document.getElementById("json-toggle") as HTMLInputElement
```

Replace the body of `render()`'s error branch:

```ts
  if (!result.ok) {
    resultContainer.classList.add("has-error")
    tableOutput.innerHTML = ""
    const pre = document.createElement("pre")
    pre.textContent = result.error
    tableOutput.appendChild(pre)
    renderStatus.textContent = "Error"
    renderStatus.style.color = "var(--error-text)"
  } else {
    resultContainer.classList.remove("has-error")
    tableOutput.innerHTML = result.html
    renderStatus.textContent = `${elapsed}ms`
    renderStatus.style.color = ""
  }
```

with:

```ts
  if (!result.ok) {
    resultContainer.classList.add("has-error")
    tableOutput.innerHTML = ""
    const pre = document.createElement("pre")
    pre.textContent = result.error
    tableOutput.appendChild(pre)
    htmlOutput.hidden = true
    jsonOutput.hidden = true
    renderStatus.textContent = "Error"
    renderStatus.style.color = "var(--error-text)"
  } else {
    resultContainer.classList.remove("has-error")
    tableOutput.innerHTML = result.html
    htmlOutput.hidden = !htmlToggle.checked
    htmlOutput.querySelector("pre")!.textContent = result.html
    jsonOutput.hidden = !jsonToggle.checked
    jsonOutput.querySelector("pre")!.textContent = JSON.stringify(result.tableData, null, 2)
    renderStatus.textContent = `${elapsed}ms`
    renderStatus.style.color = ""
  }
```

Add these two event listeners next to the other `addEventListener` calls (after the `exampleSelector.addEventListener(...)` block):

```ts
htmlToggle.addEventListener("change", render)
jsonToggle.addEventListener("change", render)
```

- [ ] **Step 3: Rebuild and verify**

Run: `npm run playground:build`
Expected: exits 0

Serve `playground/dist` and confirm in the browser:
- With both toggles off, only the table shows.
- Checking "Show generated HTML" reveals a `<pre>` with the raw HTML (including `<tableau-md>` markers).
- Checking "Show parsed JSON" reveals a `<pre>` with the `TableData` JSON.
- Both panels are visible together when both are checked.
- Triggering an error hides both panels even if their checkboxes are checked.

- [ ] **Step 4: Commit**

```bash
git add playground/index.html playground/main.ts
git commit -m "Add generated-HTML and parsed-JSON debug toggles to playground"
```

---

### Task 4: "Render Markdown in cells" toggle

**Files:**
- Modify: `playground/index.html`
- Modify: `playground/main.ts`

**Interfaces:**
- Consumes: `render()` and the result-toolbar structure from Tasks 2–3.
- Produces: no new exports.

- [ ] **Step 1: Add the checkbox to `playground/index.html`**

Replace:

```html
      <div class="result-toolbar">
        <label><input type="checkbox" id="html-toggle"> Show generated HTML</label>
        <label><input type="checkbox" id="json-toggle"> Show parsed JSON</label>
      </div>
```

with:

```html
      <div class="result-toolbar">
        <label><input type="checkbox" id="markdown-toggle"> Render Markdown in cells</label>
        <label><input type="checkbox" id="html-toggle"> Show generated HTML</label>
        <label><input type="checkbox" id="json-toggle"> Show parsed JSON</label>
      </div>
```

- [ ] **Step 2: Import `marked` and wire up the toggle in `playground/main.ts`**

Add to the top import block, after the `@codemirror/commands` import:

```ts
import { marked } from "https://esm.sh/marked@13"
```

Add next to the other DOM-element lookups:

```ts
const markdownToggle = document.getElementById("markdown-toggle") as HTMLInputElement
```

In `render()`'s success branch, insert a call right after `tableOutput.innerHTML = result.html`:

```ts
    tableOutput.innerHTML = result.html
    if (markdownToggle.checked) {
      renderMarkdownInCells(tableOutput)
    }
```

Add this function near `debounce()`:

```ts
function renderMarkdownInCells(root: HTMLElement) {
  root.querySelectorAll("tableau-md").forEach((el) => {
    const text = el.textContent ?? ""
    el.innerHTML = marked.parse(text) as string
  })
}
```

Add the event listener next to the other toggle listeners:

```ts
markdownToggle.addEventListener("change", render)
```

- [ ] **Step 3: Rebuild and verify**

Run: `npm run playground:build`
Expected: exits 0

Serve `playground/dist`, load the `blocks` example (which has multi-paragraph cell content), and confirm:
- With the toggle off, cell content shows as plain text including the blank line between paragraphs.
- With the toggle on, the two paragraphs render as separate `<p>` elements (inspect via browser devtools).
- Toggling on/off updates immediately.

- [ ] **Step 4: Commit**

```bash
git add playground/index.html playground/main.ts
git commit -m "Add Markdown-in-cells rendering toggle to playground"
```

---

### Task 5: CLI launcher (`npm run playground`)

**Files:**
- Create: `playground/serve.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `playground/vite.config.ts` (Task 2) to trigger a build, and `playground/dist` (its output) to serve.
- Produces: `npm run playground` — a working local URL opened in the default browser.

- [ ] **Step 1: Write `playground/serve.mjs`**

```js
#!/usr/bin/env node
import { existsSync, readdirSync, statSync, createReadStream } from "node:fs"
import { createServer } from "node:http"
import { extname, join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, "dist")
const repoRoot = join(__dirname, "..")

function newestMtimeMs(dir, skip = []) {
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeMs(path, skip))
    } else {
      newest = Math.max(newest, statSync(path).mtimeMs)
    }
  }
  return newest
}

function buildIsStale() {
  if (!existsSync(distDir)) return true
  const distMtime = newestMtimeMs(distDir)
  const playgroundMtime = newestMtimeMs(__dirname, ["dist", "node_modules"])
  const srcMtime = newestMtimeMs(join(repoRoot, "src"))
  return playgroundMtime > distMtime || srcMtime > distMtime
}

function build() {
  console.log("Building playground...")
  const viteBin = join(repoRoot, "node_modules", "vite", "bin", "vite.js")
  const result = spawnSync(
    process.execPath,
    [viteBin, "build", "--config", join(__dirname, "vite.config.ts")],
    { stdio: "inherit" }
  )
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function openBrowser(url) {
  const platform = process.platform
  if (platform === "darwin") {
    spawnSync("open", [url])
  } else if (platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { shell: true })
  } else {
    spawnSync("xdg-open", [url])
  }
}

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".map": "application/json",
}

function serve() {
  const port = 4173
  const server = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0]
    const filePath = join(distDir, urlPath)
    if (!filePath.startsWith(distDir) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404)
      res.end("Not found")
      return
    }
    const mime = MIME_TYPES[extname(filePath)] ?? "application/octet-stream"
    res.writeHead(200, { "Content-Type": mime })
    createReadStream(filePath).pipe(res)
  })

  server.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log(`Serving playground at ${url}`)
    openBrowser(url)
  })
}

if (buildIsStale()) {
  build()
}
serve()
```

- [ ] **Step 2: Add the npm script**

Edit `package.json`, add to `scripts`:

```json
"playground": "node playground/serve.mjs",
```

- [ ] **Step 3: Verify the build-staleness check**

Run: `rm -rf playground/dist && node -e "console.log('no dist yet')"`

Run: `node --input-type=module -e "
import { existsSync } from 'node:fs'
console.log(existsSync('playground/dist') ? 'unexpected: exists' : 'OK: dist absent')
"`
Expected: `OK: dist absent`

- [ ] **Step 4: Run the CLI and verify it builds, serves, and opens the browser**

Run: `npm run playground &` (background it so the terminal isn't blocked), then:

Run: `sleep 2 && curl -s http://localhost:4173/ | grep -q "Tableau Playground" && echo OK`
Expected: prints `OK` (confirms the server is up and serving the built page)

Then manually confirm a browser tab opened automatically to `http://localhost:4173/` and the playground works exactly as verified in Tasks 2–4 (simple example renders, editing re-renders, error pane works, all three toggles work, theme toggle works).

Stop the server: `kill %1` (or find and kill the `node playground/serve.mjs` process).

- [ ] **Step 5: Verify the CLI skips rebuilding when nothing changed**

With `playground/dist` already present and no source changes since Step 4, run: `npm run playground`
Expected: console output does NOT include "Building playground..." (only "Serving playground at ...")

Stop the server.

- [ ] **Step 6: Commit**

```bash
git add playground/serve.mjs package.json
git commit -m "Add CLI launcher for the tableau playground"
```

---

## Post-plan note

At this point `playground/` contains a fully working, self-contained static page (`playground/dist` after a build) and a one-command local launcher (`npm run playground`). Slotting it into GitHub Pages later just means pointing Pages at `playground/dist` (or copying its build output into wherever the docs site ends up living) — no further plumbing is expected to be needed per this plan's scope.

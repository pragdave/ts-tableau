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
const htmlOutput = document.getElementById("html-output") as HTMLElement
const jsonOutput = document.getElementById("json-output") as HTMLElement
const htmlToggle = document.getElementById("html-toggle") as HTMLInputElement
const jsonToggle = document.getElementById("json-toggle") as HTMLInputElement
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

htmlToggle.addEventListener("change", render)
jsonToggle.addEventListener("change", render)

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

import { visit } from "unist-util-visit"
import type { Root, Element } from "hast"
import { toString } from "hast-util-to-string"

export type Heading = { depth: number; id: string; text: string }

const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4"])

/** Rehype plugin: collects h1-h4 headings (with their rehype-slug ids) into `out`. */
export function rehypeCollectHeadings(out: Heading[]) {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (!HEADING_TAGS.has(node.tagName)) return
      const id = typeof node.properties?.id === "string" ? node.properties.id : undefined
      if (!id) return
      const depth = Number(node.tagName.slice(1))
      out.push({ depth, id, text: toString(node) })
    })
  }
}

type TocNode = Heading & { children: TocNode[] }

function buildTree(headings: Heading[]): TocNode[] {
  const roots: TocNode[] = []
  const stack: TocNode[] = []

  for (const heading of headings) {
    const node: TocNode = { ...heading, children: [] }
    while (stack.length > 0 && stack[stack.length - 1].depth >= node.depth) {
      stack.pop()
    }
    const parent = stack[stack.length - 1]
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
    stack.push(node)
  }

  return roots
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

function renderNodes(nodes: TocNode[]): string {
  const items = nodes
    .map((node) => {
      const children = node.children.length > 0 ? renderNodes(node.children) : ""
      return `<li><a href="#${node.id}">${escapeHtml(node.text)}</a>${children}</li>`
    })
    .join("")
  return `<ul>${items}</ul>`
}

/** Renders a flat heading list into a nested <nav> table of contents. */
export function renderToc(headings: Heading[]): string {
  if (headings.length === 0) return ""
  const tree = buildTree(headings)
  return `<nav class="tb-toc" aria-label="Table of contents"><h2>On this page</h2>${renderNodes(tree)}</nav>`
}

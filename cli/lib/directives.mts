import { visit } from "unist-util-visit"
import { toString } from "mdast-util-to-string"
import type { Root, Paragraph } from "mdast"

/**
 * Maps the small vocabulary of `:::name{...}` directives used by our docs
 * onto HTML via mdast-to-hast's hName/hProperties escape hatch:
 *
 *   :::columns            -> <div class="tb-columns">
 *   :::column              -> <div class="tb-column">
 *   :::callout-note        -> <div class="tb-callout tb-callout-note">
 *   :::callout-note{collapse} -> <details class="tb-callout tb-callout-note"><summary>Note</summary>...
 */
export function remarkTableauDirectives() {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return
      }

      const data = node.data || (node.data = {})
      const attributes = node.attributes || {}

      if (node.name === "columns") {
        data.hName = "div"
        data.hProperties = { className: ["tb-columns"] }
        return
      }

      if (node.name === "column") {
        data.hName = "div"
        data.hProperties = { className: ["tb-column"] }
        return
      }

      if (node.name.startsWith("callout-")) {
        const kind = node.name.slice("callout-".length)
        const label = kind.charAt(0).toUpperCase() + kind.slice(1)
        const collapse = attributes.collapse === "true" || attributes.collapse === ""

        if (collapse) {
          data.hName = "details"
          data.hProperties = { className: ["tb-callout", `tb-callout-${kind}`] }
          // A leading heading becomes the summary text (matching Quarto's
          // collapsible-callout convention); otherwise fall back to the
          // callout kind ("Note").
          let summaryLabel = label
          const firstChild = node.children[0]
          if (firstChild?.type === "heading") {
            summaryLabel = toString(firstChild)
            node.children.shift()
          }
          const summary: Paragraph = {
            type: "paragraph",
            data: { hName: "summary", hProperties: {} },
            children: [{ type: "text", value: summaryLabel }],
          }
          node.children.unshift(summary)
        } else {
          data.hName = "div"
          data.hProperties = { className: ["tb-callout", `tb-callout-${kind}`] }
          const title: Paragraph = {
            type: "paragraph",
            data: { hName: "p", hProperties: { className: ["tb-callout-title"] } },
            children: [{ type: "text", value: label }],
          }
          node.children.unshift(title)
        }
        return
      }

      // Unknown directive: pass it through as a plain div so the pipeline
      // doesn't crash; content is preserved even if unstyled.
      data.hName = "div"
      data.hProperties = { className: [`tb-directive-${node.name}`] }
    })
  }
}

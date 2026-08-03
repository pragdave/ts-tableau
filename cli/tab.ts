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

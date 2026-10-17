export interface Example {
  key: string
  label: string
  group: "Showcase" | "Features"
  source: string
}

export const DEFAULT_EXAMPLE = "times"

export const examples: Example[] = [
  {
    key: "times",
    label: "Times table",
    group: "Showcase",
    source: `|  x |  1 |  2 |  3 |  4 |  5 |
|  1 |  1 |  2 |  3 |  4 |  5 |
|  2 |  2 |  4 |  6 |  8 | 10 |
|  3 |  3 |  6 |  9 | 12 | 15 |
|  4 |  4 |  8 | 12 | 16 | 20 |
|  5 |  5 | 10 | 15 | 20 | 25 |
===
# Times table
[r1;c1] header

-- $tr is the row being matched, so c$tr is the diagonal
[r2-$r:c$tr] line(lb)

-- everything left of the diagonal: the repeated products
[r2-$r:c2-$tr~1] small bg(shade6)`,
  },

  {
    key: "schedule",
    label: "Conference schedule",
    group: "Showcase",
    source: `|       | Main Hall | Room A | Room B
| 09:00 | Keynote: _The Shape of Data_ | |
| 10:00 | Tables Are Interfaces | Parsing Pipes | Workshop: Build a Renderer
| 11:00 | Spans in Practice | Layout Algebra |
| 12:00 | Lunch | |
| 13:00 | Lightning Talks | Accessible Tables | Print & PDF
| 14:00 | Panel: Is Markdown Enough? | | Hallway Track
===
# DataDocs Conf · Day 1
align(cm)
[r1;c1] header

-- one session across every room
[r2:c2-$c] span bg(shade4)
[r5:c2-$c] span bg(shade1)

-- the workshop runs for two slots
[r3-4:c4] span bg(shade7)

[r7:c2-3] span`,
  },

  {
    key: "financials",
    label: "Financial results",
    group: "Showcase",
    source: `| $ thousands       | 2025 |     | 2026 (forecast) |
|                   | H1   | H2  | H1  | H2
| Product revenue   | 412  | 455 | 498 | 531
| Services          | 128  | 134 | 141 | 150
| **Total revenue** | 540  | 589 | 639 | 681
| Cost of sales     | 210  | 224 | 238 | 249
| Operating costs   | 190  | 197 | 205 | 214
| **Operating profit** | 140 | 168 | 196 | 218
===
# Half-yearly results
[r1-2] header
[r1-2:c1] span
[r1:c2-3;r1:c4-5] span

[c1] align(l)
[r2-$r:c2-$c] align(r)
[r3-$r:c4-5] fg(shade8)

-- rules above the subtotals, and a double rule under the bottom line
[r5;r$r] line(t)
[r$r] line(b, double, xthick)`,
  },

  {
    key: "plans",
    label: "Pricing comparison",
    group: "Showcase",
    source: `|                       | Free   | Pro       | Team
| Price per month       | €0     | €8        | €20 / seat
| **Storage**           |        |           |
| Projects              | 3      | Unlimited | Unlimited
| File size limit       | 10 MB  | 1 GB      | 5 GB
| Version history       | 7 days | 1 year    | Forever
| **Collaboration**     |        |           |
| Shared workspaces     | ✗      | ✓         | ✓
| Comments              | ✗      | ✓         | ✓
| Admin controls        | ✗      | ✗         | ✓
| **Support**           |        |           |
| Community forum       | ✓      | ✓         | ✓
| Email support         | ✗      | ✓         | ✓
| Account manager       | ✗      | ✗         | ✓
===
# Choose a plan
[r1] header
[c1] align(l)
[c2-$c] align(c)
[r2] line(b)

-- the plan we want you to pick
[r2-$r:c3] bg(shade3)

-- group headings span the whole row
[r3;r7;r11] span bg(shade5) align(l)`,
  },

  {
    key: "api",
    label: "API reference (block content)",
    group: "Showcase",
    source: `| Function | Description | Example
| \`tableau(lines)\` | | |
col 2 {{
Parses tableau source into a \`TableData\`.

- \`lines\` is an array of strings
- throws on an unrecognized format
}}
col 3 {{
\`\`\`js
const data = tableau(src.split("\\n"))
\`\`\`
}}
| \`generate(data)\` | | |
col 2 {{
Renders a \`TableData\` as HTML.

Cell content is wrapped in \`<tableau-md>\`
for your Markdown renderer to fill in.
}}
col 3 {{
\`\`\`js
const html = generate(data).join("\\n")
\`\`\`
}}
===
# The public API
align(lt)
hlines
[r1] header
[c2] width(36)`,
  },

  {
    key: "calendar",
    label: "Month calendar",
    group: "Showcase",
    source: `| Mon | Tue | Wed | Thu | Fri | Sat | Sun
|     |     |     |  1  |  2  |  3  |  4
|  5  |  6  |  7  |  8  |  9  | 10  | 11
| 12  | 13  | 14  | 15  | 16  | 17  | 18
| 19  | 20  | 21  | 22  | 23  | 24  | 25
| 26  | 27  | 28  | 29  | 30  | 31  |
===
# October 2026
large
align(rt)
[r1] header align(c)

-- weekends
[r2-$r:c6-7] bg(shade1)

-- a deadline
[r4:c5] lines(x) bg(shade9)`,
  },

  {
    key: "apa",
    label: "APA-style results",
    group: "Showcase",
    source: `| Logistic parameter                  | 9-year-olds| | 16-year-olds| | t(40) | _p_ | _d_
|                                     |   M  |  SD   |   M    | SD   |
Maximum asymptote, proportion         | .843 | .135  | .877   | .082 | 0.951 | .347 | 0.302
Crossover, in ms                      | 759  |   87  |  694   |   42 | 2.877 | .006 | 0.840
Slope, as change in proportion per ms | .001 | .0002 | .002   |.0002 | 2.635 | .012 | 2.078
===
# Results of Curve-Fitting Analysis Examining the Time Course of Fixations to the Target
small
[c1] align(l)
[r3-$r:c2-$c] align(r)

-- grouped column headings
[r1:c2-3;r1:c4-5] span
[r1-2:c1;r1-2:c6,7,8] span

-- rules only where they mean something
[r1;r3] line(t)
[r$r] line(b)
[r1:c2-5] line(b)`,
  },

  {
    key: "nutrition",
    label: "Nutrition label",
    group: "Showcase",
    source: `| **Nutrition Information**
| Serving Size 1/2 cup (about 82g)         |
| Servings Per Container 8                 |
| Amount Per Serving:                      |
| Calories 200 • Calories from Fat 130     |
|   % Daily Value  |                      |
| Total Fat |                        | 22% |
|           | Saturated Fat 9g       | 22% |
|           | Trans Fat 9g           |  0% |
| Cholesterol 55mg |                 | 18% |
| Sodium 40mg |                      |  2% |
| Total Carbohydrate 17g |           |  6% |
|            | Dietary Fiber 1g      |  4% |
|            | Sugars 14g            |  0% |
| Protein 3g                               |
===
# Nutrition Facts for Yummy Treats
width(.75)
align(l)

-- column 1 is just an indent for the sub-items
[c1] width(0.1)
[c3] align(r)

[r1] large align(c) span
[r1-3] bg(shade4)
[r4-$r] bg(shade1)

[r2;r3;r15] span
[r4] span xsmall line(t)
[r5] span line(b)
[r6] span align(r)
[r7:c1-2;r10:c1-2;r11:c1-2;r12:c1-2] span`,
  },

  {
    key: "counties",
    label: "Long listing (rule every 4 rows)",
    group: "Showcase",
    source: ` | County | FIPS Code | Health Region | Service Region
1 | Anderson | 48001 | 4 | 4/5N
2 | Andrews | 48003 | 9 | 9/10
3 | Angelina | 48005 | 5 | 4/5N
4 | Aransas | 48007 | 11 | 11
5 | Archer | 48009 | 2 | 2/3
6 | Armstrong | 48011 | 1 | 1
7 | Atascosa | 48013 | 8 | 8
8 | Austin | 48015 | 6 | 6/5S
9 | Bailey | 48017 | 1 | 1
10 | Bandera | 48019 | 8 | 8
11 | Bastrop | 48021 | 7 | 7
12 | Baylor | 48023 | 2 | 2/3
13 | Bee | 48025 | 11 | 11
14 | Bell | 48027 | 7 | 7
15 | Bexar | 48029 | 8 | 8
===
[r1] header
[c1;c3-$c] align(r)
[c2] align(l)

-- %% counts from the start of the range: rows 1, 5, 9, 13
[r1-$r%%4] line(b)`,
  },

  {
    key: "chess",
    label: "Chessboard",
    group: "Showcase",
    source: `| ♜ | ♞ | ♝ | ♛ | ♚ | ♝ | ♞ | ♜ |
| ♟ | ♟ | ♟ | ♟ | ♟ | ♟ | ♟ | ♟ |
=empty
=empty
=empty
=empty
| ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ | ♙ |
| ♖ | ♘ | ♗ | ♕ | ♔ | ♗ | ♘ | ♖ |
===
xxlarge
align(c)
boxed

-- odd columns on even rows, and even columns on odd rows
[r1-8%even:c1-8%odd] bg(shade6)
[r1-8%odd:c1-8%even] bg(shade6)`,
  },

  {
    key: "flexspans",
    label: "Flexible spans",
    group: "Showcase",
    source: `| 1  | 2  | 3  |  4 |  5
| 6  | 7  | 8  |  9 | 10
| 11 | 12 | 13 | 14 | 15
| 16 | 17 | 18 | 19 | 20
| 21 | 22 | 23 | 24 | 25
===
align(cm)
large

-- a span shows its top-left cell; style it there too
[r1-3:c1] span bg(shade1)
[r2-4:c2-3] span bg(shade3) line(x, thick, shade9)
[r3:c4-5] span bg(shade2)  line(x, dashed, thick)`,
  },

  {
    key: "simple",
    label: "Plain table",
    group: "Features",
    source: `Animal   | Legs | Habitat
Aardvark | 4    | Savanna
Penguin  | 2    | Antarctic
Octopus  | 8    | Ocean`,
  },

  {
    key: "headerfooter",
    label: "Header, footer and lines",
    group: "Features",
    source: `Name  | Score | Grade
Alice | 92    | A
Bob   | 81    | B
Carol | 74    | C
Average | 82  |
===
[r1] header
[r$r] footer
hlines`,
  },

  {
    key: "spans",
    label: "Column and row spans",
    group: "Features",
    source: `| Region | Sales  |
|        | Online | In store
| North  | 120    | 340
| South  | 95     | 410
===
[r1-2] header
[r1:c2-3] span
[r1-2:c1] span`,
  },

  {
    key: "alignment",
    label: "Alignment",
    group: "Features",
    source: `Item        | Qty | Price
Notebook    | 3   | 4.50
Fountain pen | 1  | 32.00
Ink         | 12  | 0.80
===
[r1] header
[c1] align(l)
[c2-3] align(r)`,
  },

  {
    key: "blocks",
    label: "Block content",
    group: "Features",
    source: `| Author | Excerpt
| Cicero | |
col 2 {{
At vero eos et accusamus et iusto odio dignissimos ducimus.

- a second paragraph
- and a list
}}
===
[r1] header
align(lt)`,
  },

  {
    key: "caption",
    label: "Caption",
    group: "Features",
    source: `Planet | Moons
Earth  | 1
Mars   | 2
===
# Moons of the inner planets`,
  },

  {
    key: "zebra",
    label: "Zebra striping (%%)",
    group: "Features",
    source: `Day | High | Low
Mon | 18 | 9
Tue | 21 | 11
Wed | 17 | 8
Thu | 15 | 7
Fri | 19 | 10
===
[r1] header
[r2-$r%%2] bg(shade5)`,
  },

  {
    key: "dynamic",
    label: "Dynamic selectors ($tr)",
    group: "Features",
    source: `a | b | c | d
e | f | g | h
i | j | k | l
m | n | o | p
===
align(c)
[r1-$r:c$tr] bg(shade6)
[r1-$r:c$tr+1-$c] bg(shade2)`,
  },
]

export function findExample(key: string | null): Example | undefined {
  return examples.find((example) => example.key === key)
}

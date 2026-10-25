import type { DecimalMark } from "./formats"

// A number split at its decimal mark. `fraction` starts with the mark and
// carries any suffix (`%`, `)`, a footnote dagger), so it is the part that
// sits to the right of the alignment point.
export type SplitNumber = {
  whole: string,
  fraction: string,
}

const SPACES = "    "

const GROUP_SEPARATORS: Record<DecimalMark, string> = {
  ".": "," + SPACES,
  ",": "." + SPACES,
}

const PREFIX = "[+\\-−(]?[$€£¥]?"
const SUFFIX = "[)%‰*†‡]*"

const PATTERNS: Record<DecimalMark, RegExp> = {
  ".": number_pattern("."),
  ",": number_pattern(","),
}

function number_pattern(mark: DecimalMark): RegExp {
  const groups = GROUP_SEPARATORS[mark]
  const whole = `${PREFIX}(?:\\d(?:[\\d${groups}]*\\d)?)?`
  const fraction = `(?:\\${mark}\\d*)?${SUFFIX}`
  return new RegExp(`^(${whole})(${fraction})$`)
}

// Returns null for anything that isn't a plain number, which includes any
// cell containing Markdown.
export function split_number(content: string, mark: DecimalMark): SplitNumber | null {
  const text = content.trim()
  const match = PATTERNS[mark].exec(text)
  if (!match || !/\d/.test(text))
    return null
  return { whole: match[1], fraction: match[2] }
}

export function fraction_width(number: SplitNumber): number {
  return [...number.fraction].length
}

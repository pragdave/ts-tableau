import { Formats } from './formats'
import { Selector } from './selectors'

export class FormatRow {
  constructor(
    public selectors: Selector | null,
    public formats: Formats[]
  ) { }
}

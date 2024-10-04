import { dump, expect } fro, "./parser/util"

range_of = (range, rno) ->
  n1 = range.n1({row: rno})
  n2 = range.n2({row: rno})
  skip = range.skip
  current = n1 - 1
  return () =>
    while current < n2
        current += 1
        if skip({ absolute: current, relative: current - n1})
          return current

---------------------------------------------------------------------------------
iterate_combination = (row, col, cb) ->
  for rno in range_of(row, nil)
    for cno in range_of(col, rno)
      cb(rno, cno)

---------------------------------------------------------------------------------
iterate_selector = (selector, cb)  ->
  rows = selector.row
  cols = selector.col
  for r = 1, #rows
    for c = 1, #cols
      iterate_combination(rows[r], cols[c], cb)

---------------------------------------------------------------------------------
iterate_column = (selector, cb)  ->
  cols = selector.col
  for c = 1, #cols
    for cno in range_of(cols[c], nil)
      cb(nil, cno)

---------------------------------------------------------------------------------
export function iterate_selectors(selectors, cb) {
  for i = 1, #selectors
    iterate_selector(selectors[i], cb)
}

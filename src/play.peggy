
selector
  = "[" _ cell_range|1.., ( _ ";" _ )|  "]"

cell_range "r...:c..., or r..., or c..."
  = row ":" col
  / row
  / col

row
  = "r" numbers

col
  = "c" numbers

numbers
  = number_or_range|1.., ( _ "," _)|

number_or_range  "number or range"
  = adjusted_number "-" adjusted_number skip?
  / adjusted_number

adjusted_number
  = number ( [~+] integer )?

skip
  = ("%%" / "%") ( integer / "odd" / "even" )

number "integer, or lastrow, lastcol, thisrow"
  = integer
  / "lastrow"
  / "lastcol"
  / "thisrow"

integer
  = [1-9][0-9]


_ = [ \t]*


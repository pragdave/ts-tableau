{{
  import { Cell } from "./cell.js"
  import { Row, EmptyRow } from "./row.js"
}}

/********
Overall
********/

/********
Data rows
********/

data_row
  = content_row
  / unknown_table_row

unknown_table_row
  = row:.|1..| { return `unknown: ${row.join("")}` }


content_row
  = _ "=empty" { return EmptyRow }
  / _ "|"? cells:cell|.., (_ "|" )| _ ("|" _)? {
    return new Row(cells)
    }

//  / _ first:non_empty_cell "|" rest:cell|1.., (_ "|" _)| _ "|" _ {
//      return new Row([first, ...rest])
//    }

//non_empty_cell
//  = content:cell_content { return new Cell(content) }

cell
  = _ cell:cell_content { return new Cell(cell) }
  / _ & "|" { return new Cell("") }

// we need to escape potential uses of a pipe inside (eg) inline code, so...

cell_content
  = content:cell_fragment|1..| { return content.join("") }

cell_fragment
  = fragment:
  ( "\\" ch:. { return [ch] }
  /  "`" $[^`]+ "`"      // inline code
  / "$" $[^\$]+ "$"    // math
  / [^`$|\\]+           // regular markdown
  ) { return fragment.join("") }


 _ = [ \t]*

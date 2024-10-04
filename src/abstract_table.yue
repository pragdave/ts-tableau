import {dump } from "./parser/util"
import { iterate_colspec, iterate_selectors } from "./iterators"

//local Cell
//
//--------------------------------------------------------------------------------
//normalize_colspecs = (colspecs) ->
//  width = 0
//  for i = 1, #colspecs
//    width = width + colspecs[i][2]
//
//  -- if the total width is less than 60 characters, then
//  -- just lay it out naturally
//  if width < 60
//    for i = 1, #colspecs
//      colspecs[i][2] = "ColWidthDefault"
//    return colspecs
//
//  -- if we have 5 or fewer columns, make sure no column is less
//  -- that 10% of the total wide
//  if #colspecs <= 5
//    min_width = width / 10.0
//    width = 0
//    for i = 1, #colspecs
//      colspecs[i][2] = math.max(min_width, colspecs[i][2])
//      width = width + colspecs[i][2]
//
//  -- now convert to fractions
//  for i = 1, #colspecs
//    colspecs[i][2] = colspecs[i][2] / width
//
//  colspecs
//
//--------------------------------------------------------------------------------
//most_common_alignment = (rows) ->
//  result = { "c" for i = 1, #rows[1] }
//  return result
//
//
//--------------------------------------------------------------------------------
//remove_colspec_alignments_from = (rows, alignments) =>
//  nil
//
//--------------------------------------------------------------------------------
//column_widths = (rows) ->
//  row_count = #rows
//  col_count = #rows[1]
//  percent_widths = { }
//  absolute_widths = { }
//
//  for c = 1, col_count
//    percent_widths[c] = absolute_widths[c] = 0
//    for r = 1, row_count
//      cell = rows[r][c]
//      width = cell\calculated_width()
//      if width and width != "ColWidthDefault"
//        if width < 1 -- percentage
//          if percent_widths[c] < width
//            percent_widths[c] = width
//        else
//          if absolute_widths[c] < width
//            absolute_widths[c] = width
//
//  -- calculate the total width of all nonpercentage columns,
//  -- and the total percent used of the rest
//
//  total_absolute = 0
//  total_percent = 0
//
//  for c = 1, col_count
//    if percent_widths[c] > 0
//      total_percent  += percent_widths[c]
//    else
//      total_absolute += absolute_widths[c]
//
//  -- if we have any absolute columns, convert them to percentages
//  if total_absolute > 0
//    space_left = 1 - total_percent
//    for c = 1, col_count
//      if absolute_widths[c] > 0
//        percent_widths[c] = absolute_widths[c]/total_absolute * space_left
//
//  percent_widths
//
//--------------------------------------------------------------------------------
//
//--------------------------------------------------------------------------------
//derive_colspecs = (rows) ->
//  col_count = #rows[1]
//  alignments = most_common_alignment(rows)
//  remove_colspec_alignments_from(rows, alignments)
//  widths = column_widths(rows)
//  result = [ { alignments[i], widths[i] } for i = 1, col_count ]
//  result
//
//--------------------------------------------------------------------------------
//
//--color_style = (fmt) ->
//--  "#{fmt.name}#{fmt.suffix or ''}"
//
//----------------------------------------------------------------------------------
//split_align = (spec) ->
//  spec\match("[lcrj]"), spec\match("[tmb]")
//
//--------------------------------------------------------------------------------
//convert_cell = (cell) ->
//  Cell(if cell then cell.content else {""})
//
//--------------------------------------------------------------------------------
//convert_row = (row, col_count) ->
//  return [ convert_cell(row[col]) for col = 1, col_count ]
//
//--------------------------------------------------------------------------------
//adjust_to_max = (current_max, row) ->
//  for i = 1, #row
//    current_width = current_max[i][2]
//    incoming_width = row[i].width
//
//
//    if incoming_width > current_width
//      current_max[i][2] = incoming_width
//
//
//--------------------------------------------------------------------------------
//add_line_classes = (cell, spec) ->
//  for i = 1, spec\len()
//    side = spec\sub(i, i)
//    cell\add_style("line-#{side}")
//
//--------------------------------------------------------------------------------
//xs = (amount) ->
//  if x > 0
//    string.rep("x", amount)
//
//extract_styles = (selector_no, style_list, cell) ->
//  for format in *style_list
//    switch format.type
//      when "style"
//        cell\add_style(format.spec)
//      when "bg"
//        cell\set_bg(format)
//      when "fg"
//        cell\set_fg(format)
//      when "align"
//        h, v = split_align(format.spec)
//        cell\set_align(h, v)
//      when "header"
//        cell\add_style("tableau-th")
//      when "footer"
//        cell\add_style("tableau-tf")
//      when "large", "small"
//        cell\set_font_size(format.type, format.amount)
//      when "normal"
//        cell\set_font_size("medium", 0)
//      when "lines"
//        add_line_classes(cell, format.spec)
//      when "span"
//        cell\add_span(selector_no)
//      when "width"
//        cell\set_width(format.spec)
//      else
//        error("Unsupported global table option: #{format.type}")
//
//--------------------------------------------------------------------------------
//class Cell
//  new: (content) =>
//    @content = content
//    @styles = {}
//    @font_size = nil
//    @width = nil
//
//  merge_styles: (selector_no, styles) =>
//    extract_styles(selector_no, styles, @)
//
//  calculated_width: () =>
//    @width or @text_width()
//
//  text_width: () =>
//    20
//
//  -- callbacks from extract_styles
//  add_style: (style) => @styles[] = style
//  add_span:  (selector_no) => @span_group = selector_no
//  set_fg:    (color) => @fg = color
//  set_bg:    (color) => @bg = color
//  set_align: (h, v)  =>
//    @h_align = h if h
//    @v_align = v if v
//  set_font_size: (size, amount) =>
//    @font_size = { type: size, :amount }
//  set_width: (width) =>
//    @width = width
//
//--------------------------------------------------------------------------------
//
//export class VirtualTable
//
//  new: (ast) =>
//    @styles = {}
//    @caption = ast.caption
//    @import_content(ast)
//  --------------------
//  import_content: (ast) =>
//    @import_global_options(ast)
//    @table, @colspecs = @setup_rows_and_columns(ast)
//    @merge_table_level_options_into_cells()
//    @merge_styles_from_selectors(ast)
//    @colspecs = derive_colspecs(@table)
//
//  --------------------
//  import_global_options: (ast) =>
//    for k, v in pairs(ast.table_flags)
//      @styles[] = "tbl-#{k}" if v
//    extract_styles(0, ast.table_formats, @)
//
//  --------------------
//  setup_rows_and_columns: (ast) =>
//    table = {}
//    colspecs = [ {"c", 1} for i = 1, ast.col_count ]
//
//    for row in *ast.rows
//      table[] = convert_row(row, ast.col_count)
//      adjust_to_max(colspecs, row)
//    colspecs = normalize_colspecs(colspecs)
//    table, colspecs
//
//  --------------------
//  merge_table_level_options_into_cells: () =>
//    for row in *@table
//      for col = 1, #row
//        local cell = row[col]
//        cell\set_align(@h_align, @v_align)
//        cell\add_style(@font_size) if @font_size
//        cell\add_style(@font_size_amount) if @font_size_amount
//        cell\set_fg(@fg) if @fg
//        cell\set_bg(@bg) if @bg
//        cell\set_width(@colspecs[col][2])
//
//  --------------------
//  merge_styles_from_selectors: (ast)  =>
//    for selector_no, {:selector, :formats} in pairs(ast.selector_formats)
//      iterate_selectors(selector,
//        (row, col) ->
//          -- need these tests because computed row and column numbers
//          -- (such as c@r+6) can go out of bounds
//          if row >= 1 and row <= ast.row_count
//            if col >= 1 and col <= ast.col_count
//              @table[row][col]\merge_styles(selector_no, formats))
//      -- iterate_colspecs(selector,
//      --   (col) ->
//      --     dump "Column only selector col")
//  --------------------
//  -- callbacks from extract_styles
//  add_style: (style) => @styles[] = style
//  set_fg:    (color) => @fg = color
//  set_bg:    (color) => @bg = color
//  set_align: (h, v)  =>
//    @h_align = h
//    @v_align = v
//  set_font_size: (size, amount) =>
//    @font_size = "tableau-#{size}"
//    if amount > 0
//      @font_size_amount = string.rep("x", amount)
//
//  set_width: (width) => @width = width
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//
//  --------------------
//

src/parser.mjs: src/parser.peggy
	pnpm peggy $< -o $@ --format es

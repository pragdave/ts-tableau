import * as esbuild from 'esbuild';
import fs from 'node:fs';
import peggy from 'peggy'
//import tspegjs from 'ts-pegjs'

import { createBuildSettings } from './settings.js';

const parser_input = "./src/parser.peggy"
const parser_js    = "./src/parser.ts"

function mtime(path) {
  try {
    const stats = fs.statSync(path)
    return stats.mtimeMs
  } catch (err) {
    return 0
  }
}

function build_parser() {
  console.info("Building parser")
  const src = fs.readFileSync(parser_input, 'utf8')
  const parser_src = peggy.generate(src, {
    output: "source",
    format: "es",
//    plugins: [tspegjs],
//    tspegjs: {
//      // customHeader = "",
//    }
  })
  fs.writeFileSync(parser_js, parser_src, 'utf8')
}

function maybe_build_parser() {
  const input_time = mtime(parser_input)
  if (input_time === 0)
    throw new Error(`grammar "${parser_inout}" not found`)
  const js_time = mtime(parser_js)
  if (js_time < input_time)
    build_parser()
}

maybe_build_parser()

const settings = createBuildSettings({ minify: false });
await esbuild.build(settings);

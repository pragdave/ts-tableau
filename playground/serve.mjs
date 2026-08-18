#!/usr/bin/env node
import { existsSync, readdirSync, statSync, createReadStream } from "node:fs"
import { createServer } from "node:http"
import { extname, join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, "dist")
const repoRoot = join(__dirname, "..")

function newestMtimeMs(dir, skip = []) {
  let newest = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(entry.name)) continue
    const path = join(dir, entry.name)
    if (entry.isDirectory()) {
      newest = Math.max(newest, newestMtimeMs(path, skip))
    } else {
      newest = Math.max(newest, statSync(path).mtimeMs)
    }
  }
  return newest
}

function buildIsStale() {
  if (!existsSync(distDir)) return true
  const distMtime = newestMtimeMs(distDir)
  const playgroundMtime = newestMtimeMs(__dirname, ["dist", "node_modules"])
  const srcMtime = newestMtimeMs(join(repoRoot, "src"))
  return playgroundMtime > distMtime || srcMtime > distMtime
}

function build() {
  console.log("Building playground...")
  const viteBin = join(repoRoot, "node_modules", "vite", "bin", "vite.js")
  const result = spawnSync(
    process.execPath,
    [viteBin, "build", "--config", join(__dirname, "vite.config.ts")],
    { stdio: "inherit" }
  )
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

function openBrowser(url) {
  const platform = process.platform
  if (platform === "darwin") {
    spawnSync("open", [url])
  } else if (platform === "win32") {
    spawnSync("cmd", ["/c", "start", "", url], { shell: true })
  } else {
    spawnSync("xdg-open", [url])
  }
}

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".map": "application/json",
}

function serve() {
  const port = 4173
  const server = createServer((req, res) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url.split("?")[0]
    const filePath = join(distDir, urlPath)
    if (!filePath.startsWith(distDir) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
      res.writeHead(404)
      res.end("Not found")
      return
    }
    const mime = MIME_TYPES[extname(filePath)] ?? "application/octet-stream"
    res.writeHead(200, { "Content-Type": mime })
    createReadStream(filePath).pipe(res)
  })

  server.listen(port, () => {
    const url = `http://localhost:${port}`
    console.log(`Serving playground at ${url}`)
    openBrowser(url)
  })
}

if (buildIsStale()) {
  build()
}
serve()

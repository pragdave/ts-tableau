import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: __dirname,
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
})

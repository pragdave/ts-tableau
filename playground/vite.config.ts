import { defineConfig } from "vite"
import { resolve } from "path"

export default defineConfig({
  root: __dirname,
  // Relative asset URLs, so the build works under any path -- including
  // GitHub Pages, where it is served from /<repo>/playground/.
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
})

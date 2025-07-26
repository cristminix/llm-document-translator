import { defineConfig } from "vite"
import { node } from "./vite-plugins/node"

export default defineConfig({
  plugins: [node()],
})

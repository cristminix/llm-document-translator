import { nodeExternals } from "rollup-plugin-node-externals"
import { Plugin } from "vite"

export function externals(): Plugin {
  return {
    ...nodeExternals({
      // Options here if needed
    }),
    name: "node-externals",
    enforce: "pre", // The key is to run it before Vite's default dependency resolution plugin
    apply: "build",
  }
}

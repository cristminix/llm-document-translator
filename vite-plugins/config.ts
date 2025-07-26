import path from "path"
import { Plugin } from "vite"

export function config(options?: { entry?: string }): Plugin {
  const entry = options?.entry ?? "src/main.ts"
  return {
    name: "node-config",
    config() {
      return {
        build: {
          lib: {
            entry: path.resolve(entry),
            formats: ["es"],
            fileName: (format) =>
              `${path.basename(entry, path.extname(entry))}.${format}.js`,
          },
          rollupOptions: {
            external: [
              //'dependencies-to-exclude'
            ],
            // Additional Rollup options here
          },
        },
        resolve: {
          // Change default resolution to node rather than browser
          mainFields: ["module", "jsnext:main", "jsnext"],
          conditions: ["node"],
        },
      }
    },
    apply: "build",
  }
}

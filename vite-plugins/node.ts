import { Plugin } from "vite"
import { shims } from "./shims"
import { externals } from "./externals"
import { config } from "./config"

export function node(): Plugin[] {
  return [shims(), externals(), config()]
}

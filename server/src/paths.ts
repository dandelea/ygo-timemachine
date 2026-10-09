import { readFileSync } from 'node:fs'
import path from 'node:path'

/** The `server/` directory, from both `src/` (sources) and `dist/` (build). */
export const packageRoot = path.resolve(import.meta.dirname, '..')
export const dataDir = path.join(packageRoot, 'data')

export const appVersion = (
  JSON.parse(readFileSync(path.join(packageRoot, 'package.json'), 'utf8')) as { version: string }
).version

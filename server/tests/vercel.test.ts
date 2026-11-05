import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { packageRoot } from '../src/paths.ts'

// The Vercel function only ships the files listed in `includeFiles`; a data
// file read at runtime but missing there makes every request fail.
const sourceDir = path.join(packageRoot, 'src')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? sourceFiles(file) : entry.name.endsWith('.ts') ? [file] : []
  })
}

describe('Vercel function', () => {
  it('includes every data file the API reads at runtime', () => {
    const vercel = JSON.parse(readFileSync(path.join(packageRoot, '../vercel.json'), 'utf8')) as {
      services: { api: { functions: Record<string, { includeFiles: string }> } }
    }
    const included = Object.values(vercel.services.api.functions)[0]?.includeFiles ?? ''

    // Scripts run on a developer machine, not in the function.
    const runtimeFiles = sourceFiles(sourceDir).filter(
      (file) => !file.includes(`${path.sep}scripts${path.sep}`),
    )
    const dataFiles = new Set(
      runtimeFiles.flatMap((file) =>
        [
          ...readFileSync(file, 'utf8').matchAll(/readFileSync\(path\.join\(dataDir, '([^']+)'\)/g),
        ].map((match) => `data/${match[1] ?? ''}`),
      ),
    )
    expect([...dataFiles].sort()).toEqual(['data/card-types.json', 'data/formats.json'])
    for (const file of dataFiles) expect(included).toContain(file)
  })
})

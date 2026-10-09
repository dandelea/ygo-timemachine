import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import en from '@/locales/en.json'
import es from '@/locales/es.json'

function flatten(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]: [string, unknown]) => {
    const name = prefix ? `${prefix}.${key}` : key
    return child && typeof child === 'object' ? flatten(child, name) : [name]
  })
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(file)
    return /\.(vue|ts)$/.test(entry.name) ? [file] : []
  })
}

const srcDir = path.resolve(import.meta.dirname, '../../src')
const enKeys = flatten(en)

describe('translations', () => {
  it('has the same keys in English and Spanish', () => {
    expect(flatten(es).sort()).toEqual([...enKeys].sort())
  })

  it('defines every literal key used in the source', () => {
    const pattern = /\bt\(\s*'([^']+)'|keypath="([^"]+)"/g
    const missing: string[] = []
    for (const file of sourceFiles(srcDir)) {
      for (const match of readFileSync(file, 'utf8').matchAll(pattern)) {
        const key = match[1] ?? match[2] ?? ''
        if (!enKeys.includes(key)) missing.push(`${path.relative(srcDir, file)}: ${key}`)
      }
    }
    expect(missing).toEqual([])
  })
})

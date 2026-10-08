import { readFileSync } from 'node:fs'
import path from 'node:path'
import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { packageRoot } from '../src/paths.ts'
import { IDS, resetDatabase, testApp } from './helpers.ts'

// The client keeps its own copy of the API types and tests them against
// fixtures captured from this API (client/tests/fixtures/api). This test makes
// sure those fixtures still have the shape the server actually returns.
const fixturesDir = path.resolve(packageRoot, '../client/tests/fixtures/api')
const fixture = (name: string): unknown =>
  JSON.parse(readFileSync(path.join(fixturesDir, `${name}.json`), 'utf8'))

type Shape = string | { [key: string]: Shape } | Shape[]

/** Structure of a JSON value: object keys and array items, primitives collapsed. */
function shape(value: unknown): Shape {
  if (Array.isArray(value)) {
    const items = value.map(shape)
    const first = items.find((item) => typeof item !== 'string') ?? items[0]
    return first === undefined ? [] : [first]
  }
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, shape((value as Record<string, unknown>)[key])]),
    )
  }
  return 'value'
}

const app = testApp()
beforeAll(resetDatabase)

describe('client API fixtures', () => {
  it.each([
    ['stats', () => request(app).get('/stats')],
    ['archetypes', () => request(app).get('/archetypes')],
    ['decks', () => request(app).get('/decks')],
    ['cards', () => request(app).post('/cards').send({})],
    [
      'saved-deck',
      () =>
        request(app)
          .post('/decks')
          .send({ name: 'Contract', cards: [IDS.kuriboh] }),
    ],
  ])('%s matches the server response shape', async (name, call) => {
    const res = await call().expect(200)
    expect(shape(fixture(name))).toEqual(shape(res.body))
  })

  it('deck matches the server response shape', async () => {
    const decks = await request(app).get('/decks').expect(200)
    const [deck] = decks.body as { id: string }[]
    const res = await request(app)
      .get(`/decks/${deck?.id ?? ''}`)
      .expect(200)
    expect(shape(fixture('deck'))).toEqual(shape(res.body))
  })
})

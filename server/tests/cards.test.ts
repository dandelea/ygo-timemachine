import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import type { Cache } from '../src/cache.ts'
import { IDS, SEEDED_CARDS, memoryCache, resetDatabase, testApp } from './helpers.ts'

interface CardBody {
  id: number
  name: string
  type: string | null
  first_release: string | null
  images: { image: string; image_small: string }[]
}

const app = testApp()

async function search(body: object): Promise<{ total: number; names: string[] }> {
  const res = await request(app).post('/cards').send(body).expect(200)
  const result = res.body as { total: number; data: CardBody[] }
  return { total: result.total, names: result.data.map((card) => card.name) }
}

beforeAll(resetDatabase)

describe('GET /stats and /archetypes', () => {
  it('returns the page size and the number of seeded cards', async () => {
    const res = await request(app).get('/stats').expect(200)
    expect(res.body).toEqual({ pageSize: 36, cards: SEEDED_CARDS })
  })

  it('lists archetype names sorted', async () => {
    const res = await request(app).get('/archetypes').expect(200)
    expect(res.body).toEqual(['Blue-Eyes', 'Dark Magician'])
  })
})

describe('POST /cards', () => {
  it('returns every released card when no filter is given', async () => {
    const { total, names } = await search({})
    expect(total).toBe(SEEDED_CARDS)
    expect(names).not.toContain('Skill')
    expect(names).not.toContain('Unreleased')
  })

  it('serves card ids as numbers and images from the current host', async () => {
    const res = await request(app).post('/cards').send({ search: 'blue-eyes' }).expect(200)
    const [card] = (res.body as { data: CardBody[] }).data
    expect(card).toMatchObject({
      id: IDS.blueEyes,
      type: 'MONSTER',
      first_release: '2002-03-08',
      images: [
        {
          image: `https://images.ygoprodeck.com/images/cards/${IDS.blueEyes}.jpg`,
          image_small: `https://images.ygoprodeck.com/images/cards_small/${IDS.blueEyes}.jpg`,
        },
      ],
    })
  })

  it('filters by card type', async () => {
    expect((await search({ checks: ['TRAP'] })).names).toEqual(['Mirror Force'])
    expect((await search({ checks: ['EXTRA'] })).names).toEqual([
      'Firewall Dragon',
      'Thousand Dragon',
    ])
  })

  it('searches names and descriptions case-insensitively', async () => {
    expect((await search({ search: 'DRAW 2' })).names).toEqual(['Pot of Greed'])
  })

  it('applies monster filters without excluding spells and traps', async () => {
    const { names } = await search({ attributes: ['DARK'], levels: [1] })
    expect(names).toEqual(['Kuriboh', 'Mirror Force', 'Monster Reborn', 'Pot of Greed'])
  })

  it('keeps monsters without level or DEF when filtering by ranges', async () => {
    const { names } = await search({
      checks: ['EXTRA'],
      levels: ['7'],
      defense: { min: 1500, max: 5000 },
    })
    expect(names).toEqual(['Firewall Dragon', 'Thousand Dragon'])
  })

  it('filters by monster type and spell family per card type', async () => {
    const { names } = await search({
      checks: ['MONSTER', 'SPELL'],
      monsterTypes: ['Spellcaster'],
    })
    expect(names).toEqual(['Dark Magician', 'Monster Reborn', 'Pot of Greed'])
  })

  it('filters by archetype and release date', async () => {
    expect((await search({ archetypes: ['Blue-Eyes'] })).names).toEqual(['Blue-Eyes White Dragon'])
    expect((await search({ epoch: '2010-01-01' })).names).not.toContain('Firewall Dragon')
  })

  it('orders by every advertised field without failing', async () => {
    for (const field of ['name', 'type', 'race', 'archetype', 'level', 'attribute', 'atk', 'def']) {
      await request(app)
        .post('/cards')
        .send({ order: { field, inverse: true, options: [] } })
        .expect(200)
    }
    const { names } = await search({ checks: ['MONSTER'], order: { field: 'atk', inverse: true } })
    expect(names[0]).toBe('Blue-Eyes White Dragon')
  })

  it('accepts the form sent by the original client', async () => {
    const { total } = await search({
      epoch: '2026-10-08',
      search: '',
      checks: ['MONSTER', 'SPELL', 'TRAP', 'EXTRA'],
      attributes: ['EARTH', 'WATER', 'WIND', 'FIRE', 'DARK', 'LIGHT'],
      levels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      attack: { min: 0, max: 5000 },
      defense: { min: 0, max: 5000 },
      monsterTypes: ['Dragon', 'Spellcaster', 'Fiend', 'Cyberse'],
      archetypes: [],
      spellFamilies: ['Normal'],
      trapFamilies: ['Normal'],
      order: { inverse: false, field: 'name', options: [{ id: 'name', label: 'Name' }] },
    })
    expect(total).toBe(SEEDED_CARDS)
  })

  it.each([
    [{ checks: ['NOPE'] }, 'checks.0'],
    [{ attack: { min: 3000, max: 100 } }, 'attack'],
    [{ order: { field: 'password' } }, 'order.field'],
    [{ epoch: 'yesterday' }, 'epoch'],
    [{ search: 'x'.repeat(101) }, 'search'],
  ])('rejects invalid filters with 400 (%j)', async (body, path) => {
    const res = await request(app).post('/cards').send(body).expect(400)
    expect(res.body).toMatchObject({ error: 'Invalid request', issues: [{ path }] })
  })

  it('serves repeated searches from the cache', async () => {
    const cache = memoryCache()
    const cachedApp = testApp(cache)
    const first = await request(cachedApp)
      .post('/cards')
      .send({ checks: ['TRAP'] })
      .expect(200)
    expect(cache.store.size).toBe(1)
    const [key] = cache.store.keys()
    cache.store.set(key ?? '', { total: 99, data: [] })
    const second = await request(cachedApp)
      .post('/cards')
      .send({ checks: ['TRAP'] })
      .expect(200)
    expect(first.body).toMatchObject({ total: 1 })
    expect(second.body).toEqual({ total: 99, data: [] })
  })

  it('answers 500 without internal details when a dependency fails', async () => {
    const broken: Cache = {
      get: () => Promise.reject(new Error('secret connection string')),
      set: () => Promise.resolve(),
      close: () => Promise.resolve(),
    }
    const res = await request(testApp(broken)).post('/cards').send({}).expect(500)
    expect(res.body).toEqual({ error: 'Internal server error' })
  })
})

describe('GET /cards/:id', () => {
  it('returns the card with its archetype and images', async () => {
    const res = await request(app).get(`/cards/${IDS.darkMagician}`).expect(200)
    expect(res.body).toMatchObject({
      id: IDS.darkMagician,
      name: 'Dark Magician',
      archetype: { id: 'Dark Magician' },
      images: [{ image_small: expect.stringContaining('images.ygoprodeck.com') as string }],
    })
  })

  it.each(['123', 'abc', '-1'])('answers 404 for unknown or invalid id %s', async (id) => {
    await request(app).get(`/cards/${id}`).expect(404)
  })
})

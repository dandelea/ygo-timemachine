import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { buildFormat } from '../src/scripts/fetch-formats.ts'
import { IDS, resetDatabase, testApp } from './helpers.ts'

const app = testApp()

async function search(body: object): Promise<string[]> {
  const res = await request(app).post('/cards').send(body).expect(200)
  return (res.body as { data: { name: string }[] }).data.map((card) => card.name)
}

beforeAll(resetDatabase)

describe('GET /cards/:id/printings', () => {
  it('groups language variants and orders printings by date', async () => {
    const res = await request(app).get(`/cards/${IDS.blueEyes}/printings`).expect(200)
    expect(res.body).toEqual({
      total: 2,
      printings: [
        {
          set: 'Legend of Blue Eyes White Dragon',
          code: 'LOB-EN001',
          rarity: 'Ultra Rare',
          date: '2002-03-08',
        },
        { set: 'Metal Raiders', code: 'MRD-EN000', rarity: 'Secret Rare', date: '2002-06-26' },
      ],
    })
  })

  it('keeps only the printings up to a date, with the total of every date', async () => {
    const res = await request(app)
      .get(`/cards/${IDS.blueEyes}/printings?until=2002-04-01`)
      .expect(200)
    expect(res.body).toMatchObject({ total: 2, printings: [{ code: 'LOB-EN001' }] })
  })

  it('answers 404 for unknown cards and 400 for invalid dates', async () => {
    await request(app).get('/cards/123/printings').expect(404)
    await request(app).get(`/cards/${IDS.blueEyes}/printings?until=yesterday`).expect(400)
  })
})

describe('Link and Pendulum', () => {
  it('returns Link values and markers, and Pendulum scales', async () => {
    const link = await request(app).get(`/cards/${IDS.firewall}`).expect(200)
    expect(link.body).toMatchObject({
      link_value: 4,
      link_markers: ['Top', 'Left', 'Right', 'Bottom'],
      pendulum_scale: null,
    })
    const pendulum = await request(app).get(`/cards/${IDS.oddEyes}`).expect(200)
    expect(pendulum.body).toMatchObject({ link_value: null, link_markers: null, pendulum_scale: 4 })
  })

  it('filters by Link value, by any of the markers and by Pendulum scale', async () => {
    const monsters = { checks: ['MONSTER', 'EXTRA'] }
    expect(await search({ ...monsters, linkValues: [4] })).toEqual(['Firewall Dragon'])
    expect(await search({ ...monsters, linkValues: [2] })).toEqual([])
    expect(await search({ ...monsters, linkMarkers: ['Top-Left', 'Bottom'] })).toEqual([
      'Firewall Dragon',
    ])
    // "Top" must not match "Top-Left".
    expect(await search({ ...monsters, linkMarkers: ['Top-Left'] })).toEqual([])
    expect(await search({ ...monsters, scale: { min: 3, max: 5 } })).toEqual([
      'Odd-Eyes Pendulum Dragon',
    ])
    expect(await search({ ...monsters, scale: { min: 5, max: 13 } })).toEqual([])
  })

  it('orders by Link value and Pendulum scale', async () => {
    const names = await search({
      checks: ['MONSTER', 'EXTRA'],
      order: { field: 'link', inverse: true },
    })
    expect(names.indexOf('Firewall Dragon')).toBeGreaterThanOrEqual(0)
    await request(app)
      .post('/cards')
      .send({ order: { field: 'scale' } })
      .expect(200)
  })

  it('rejects unknown markers', async () => {
    await request(app)
      .post('/cards')
      .send({ linkMarkers: ['Up'] })
      .expect(400)
  })
})

describe('formats', () => {
  it('lists the formats with their number of cards and restricted cards', async () => {
    const res = await request(app).get('/formats').expect(200)
    expect(res.body).toEqual([
      {
        id: 'goat',
        name: 'GOAT',
        banlistDate: '2005-08-17',
        cards: 6,
        limits: { [IDS.monsterReborn]: 1, [IDS.mirrorForce]: 2, [IDS.potOfGreed]: 0 },
      },
      { id: 'edison', name: 'Edison', banlistDate: '2010-03-01', cards: 0, limits: {} },
    ])
  })

  it('searches only the cards legal in the format, whatever the date', async () => {
    const names = await search({ format: 'goat', epoch: '2002-01-01' })
    expect(names).toEqual([
      'Blue-Eyes White Dragon',
      'Dark Magician',
      'Kuriboh',
      'Mirror Force',
      'Monster Reborn',
      'Pot of Greed',
    ])
  })

  it('saves the format with the deck and enforces its limits', async () => {
    const deck = (cards: number[]) => ({ name: 'Goat', color: 'red-500', format: 'goat', cards })
    const saved = await request(app)
      .post('/decks')
      .send(deck([IDS.blueEyes, IDS.blueEyes, IDS.mirrorForce, IDS.mirrorForce, IDS.monsterReborn]))
      .expect(200)
    const id = (saved.body as { id: string }).id
    const res = await request(app).get(`/decks/${id}`).expect(200)
    expect(res.body).toMatchObject({ format: 'goat' })

    await request(app)
      .post('/decks')
      .send(deck([IDS.potOfGreed]))
      .expect(400)
    await request(app)
      .post('/decks')
      .send(deck([IDS.monsterReborn, IDS.monsterReborn]))
      .expect(400)
    // Firewall Dragon is not a GOAT card.
    await request(app)
      .post('/decks')
      .send(deck([IDS.firewall]))
      .expect(400)
    await request(app)
      .post('/decks')
      .send({ ...deck([]), format: 'speed' })
      .expect(400)
  })

  it('keeps decks without a format', async () => {
    const saved = await request(app)
      .post('/decks')
      .send({ name: 'Free', cards: [IDS.potOfGreed] })
      .expect(200)
    const res = await request(app)
      .get(`/decks/${(saved.body as { id: string }).id}`)
      .expect(200)
    expect(res.body).toMatchObject({ format: null })
  })
})

describe('format data download', () => {
  it('turns the banlist into copies per card and sorts the legal cards', () => {
    expect(
      buildFormat(
        { id: 'goat', name: 'GOAT' },
        '2005-08-17',
        [3, 1, 2, 1],
        [
          { id: 2, status_text: 'Semi-Limited' },
          { id: 1, status_text: 'Forbidden' },
          { id: 3, status_text: 'Limited' },
        ],
      ),
    ).toEqual({
      id: 'goat',
      name: 'GOAT',
      banlistDate: '2005-08-17',
      cards: [1, 2, 3],
      limits: { '1': 0, '2': 2, '3': 1 },
    })
    expect(() =>
      buildFormat({ id: 'x', name: 'X' }, '2020-01-01', [], [{ id: 1, status_text: 'Unlimited' }]),
    ).toThrow('Unknown banlist status')
  })
})

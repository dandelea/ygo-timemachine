import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import { Card, DeckCard } from '../src/db/models.ts'
import { IDS, resetDatabase, testApp } from './helpers.ts'

interface DeckDetailBody {
  id: string
  name: string
  color: string
  main: { id: number; name: string; type: string }[]
  extra: { id: number; name: string }[]
}

const app = testApp()

async function firstDeckId(): Promise<string> {
  const res = await request(app).get('/decks').expect(200)
  return (res.body as { id: string }[])[0]?.id ?? ''
}

beforeAll(resetDatabase)

describe('GET /decks', () => {
  it('lists decks with the id and images of their cards', async () => {
    const res = await request(app).get('/decks').expect(200)
    expect(res.body).toHaveLength(1)
    expect(res.body).toMatchObject([
      {
        name: 'Kaiba',
        color: 'blue-500',
        cards: expect.arrayContaining([
          {
            id: IDS.blueEyes,
            images: [
              {
                image: expect.stringContaining('images.ygoprodeck.com') as string,
                image_small: expect.stringContaining('cards_small') as string,
              },
            ],
          },
        ]) as unknown,
      },
    ])
  })
})

describe('GET /decks/:id', () => {
  it('splits cards into main and extra deck, keeping duplicates', async () => {
    const res = await request(app)
      .get(`/decks/${await firstDeckId()}`)
      .expect(200)
    const deck = res.body as DeckDetailBody
    // The seed skips cards that were never released.
    expect(deck.main.map((card) => card.name)).toEqual([
      'Blue-Eyes White Dragon',
      'Blue-Eyes White Dragon',
      'Pot of Greed',
    ])
    expect(deck.extra.map((card) => card.name)).toEqual(['Thousand Dragon'])
  })

  it.each(['not-a-uuid', '6f1c1d1e-0000-4000-8000-000000000000'])(
    'answers 404 for %s',
    async (id) => {
      const res = await request(app).get(`/decks/${id}`).expect(404)
      expect(res.body).toEqual({ error: 'Deck not found' })
    },
  )
})

describe('saving decks', () => {
  const payload = {
    name: '  Yugi  ',
    color: 'purple-500',
    cards: [IDS.darkMagician, String(IDS.potOfGreed), IDS.firewall],
  }

  it.each(['/decks', '/decks/null', '/decks/new'])('creates a deck via POST %s', async (url) => {
    const res = await request(app).post(url).send(payload).expect(200)
    const created = res.body as { id: string; name: string }
    expect(created.name).toBe('Yugi')

    const detail = await request(app).get(`/decks/${created.id}`).expect(200)
    const deck = detail.body as DeckDetailBody
    expect(deck.main.map((card) => card.id)).toEqual([IDS.darkMagician, IDS.potOfGreed])
    expect(deck.extra.map((card) => card.id)).toEqual([IDS.firewall])
  })

  it('replaces name, color and cards of an existing deck', async () => {
    const id = await firstDeckId()
    await request(app)
      .post(`/decks/${id}`)
      .send({ name: 'Kaiba v2', color: 'red-500', cards: [IDS.kuriboh] })
      .expect(200)
    const deck = (await request(app).get(`/decks/${id}`).expect(200)).body as DeckDetailBody
    expect(deck).toMatchObject({ id, name: 'Kaiba v2', color: 'red-500', extra: [] })
    expect(deck.main.map((card) => card.id)).toEqual([IDS.kuriboh])
  })

  it.each([
    [{ ...payload, name: '   ' }, 'Invalid request'],
    [{ ...payload, cards: ['abc'] }, 'Invalid request'],
    [{ name: 'x', color: 'red-500' }, 'Invalid request'],
    [{ ...payload, cards: [999] }, 'One or more cards do not exist'],
    [{ ...payload, cards: Array<number>(4).fill(IDS.kuriboh) }, 'more than 3 copies'],
  ])('rejects invalid decks with 400 (%j)', async (body, message) => {
    const res = await request(app).post('/decks').send(body).expect(400)
    expect((res.body as { error: string }).error).toContain(message)
  })

  it('enforces main and extra deck sizes', async () => {
    const fusion = (id: number) => ({ id, name: `Fusion ${id}`, subtype: 'Fusion Monster' })
    const normal = (id: number) => ({ id, name: `Normal ${id}`, subtype: 'Normal Monster' })
    await Card.bulkCreate([
      ...Array.from({ length: 16 }, (_, i) => fusion(900_000 + i)),
      ...Array.from({ length: 21 }, (_, i) => normal(910_000 + i)),
    ])
    const extraIds = Array.from({ length: 16 }, (_, i) => 900_000 + i)
    const mainIds = Array.from({ length: 21 }, (_, i) => 910_000 + i).flatMap((id) => [id, id, id])

    const extra = await request(app)
      .post('/decks')
      .send({ name: 'Too much extra', cards: extraIds })
      .expect(400)
    expect((extra.body as { error: string }).error).toContain('extra deck')
    await request(app)
      .post('/decks')
      .send({ name: 'Full extra', cards: extraIds.slice(0, 15) })
      .expect(200)

    const main = await request(app)
      .post('/decks')
      .send({ name: 'Too much main', cards: mainIds })
      .expect(400)
    expect((main.body as { error: string }).error).toContain('main deck')
    await request(app)
      .post('/decks')
      .send({ name: 'Full main', cards: mainIds.slice(0, 60) })
      .expect(200)
  })

  it('does not change the deck when validation fails', async () => {
    const id = await firstDeckId()
    const before = await DeckCard.count({ where: { deck_id: id } })
    await request(app)
      .post(`/decks/${id}`)
      .send({ name: 'Broken', cards: [999] })
      .expect(400)
    expect(await DeckCard.count({ where: { deck_id: id } })).toBe(before)
  })

  it('answers 404 when updating a malformed deck id', async () => {
    await request(app).post('/decks/abc').send(payload).expect(404)
  })
})

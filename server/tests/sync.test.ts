import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import request from 'supertest'
import { beforeEach, describe, expect, it } from 'vitest'
import { Card, CardPrinting, DeckCard, FormatCard } from '../src/db/models.ts'
import {
  refreshData,
  trimCard,
  unknownSubtypes,
  type ApiCard,
} from '../src/scripts/refresh-data.ts'
import type { GetJson } from '../src/scripts/ygoprodeck.ts'
import { syncCards, type SourceCard } from '../src/seed/seed.ts'
import { CARDS, FORMATS, IDS, SETS, resetDatabase, testApp } from './helpers.ts'

const app = testApp()

describe('syncCards', () => {
  beforeEach(resetDatabase)

  const newer = (): SourceCard[] => [
    ...CARDS.map((card) =>
      card.id === IDS.kuriboh ? { ...card, desc: 'Updated text.', atk: 350 } : card,
    ),
    {
      id: 900000001,
      name: 'Brand New Dragon',
      type: 'Normal Monster',
      race: 'Dragon',
      atk: 1000,
      def: 1000,
      level: 4,
      attribute: 'LIGHT',
      card_sets: [{ set_name: 'Brand New Set', set_code: 'BNS-EN001', set_rarity: 'Common' }],
      card_images: [
        { image_url: 'https://x/900000001.jpg', image_url_small: 'https://x/s/900000001.jpg' },
      ],
    },
  ]
  const newerSets = [...SETS, { set_name: 'Brand New Set', tcg_date: '2026-10-01' }]

  it('updates existing cards, adds new ones and keeps saved decks', async () => {
    const deckCards = await DeckCard.count()
    const result = await syncCards(newer(), newerSets, FORMATS)
    expect(result).toMatchObject({ added: 1, removed: 0 })

    const kuriboh = await Card.findByPk(IDS.kuriboh)
    expect(kuriboh).toMatchObject({ description: 'Updated text.', atk: 350 })
    expect(await DeckCard.count()).toBe(deckCards)
    const stats = await request(app).get('/stats').expect(200)
    expect(stats.body).toMatchObject({ latestRelease: '2026-10-01' })
    const printings = await request(app).get('/cards/900000001/printings').expect(200)
    expect(printings.body).toMatchObject({ total: 1, printings: [{ code: 'BNS-EN001' }] })
  })

  it('removes cards missing from the new data unless a deck uses them', async () => {
    // Blue-Eyes is in the sample deck; Dark Magician and Kuriboh are in no deck.
    const without = newer().filter(
      (card) => ![IDS.blueEyes, IDS.darkMagician, IDS.kuriboh].includes(card.id as never),
    )
    const result = await syncCards(without, newerSets, FORMATS)
    expect(result.removed).toBe(2)
    expect(await Card.findByPk(IDS.blueEyes)).not.toBeNull()
    expect(await Card.findByPk(IDS.darkMagician)).toBeNull()
  })

  it('replaces printings and formats instead of duplicating them', async () => {
    await syncCards(newer(), newerSets, FORMATS)
    const printings = await CardPrinting.count()
    const formatCards = await FormatCard.count()
    const again = await syncCards(newer(), newerSets, FORMATS)
    expect(again.added).toBe(0)
    expect(await CardPrinting.count()).toBe(printings)
    expect(await FormatCard.count()).toBe(formatCards)
  })
})

describe('refreshData', () => {
  const apiCard = (id: number, type: string): ApiCard => ({
    id,
    name: `Card ${id}`,
    type,
    desc: 'Text',
    atk: null as unknown as number,
    frameType: 'normal',
    ygoprodeck_url: 'https://ygoprodeck.com/card/x',
    card_images: [
      {
        id,
        image_url: `https://images.ygoprodeck.com/images/cards/${id}.jpg`,
        image_url_small: `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`,
        image_url_cropped: 'cropped',
      } as ApiCard['card_images'][number],
    ],
    card_sets: [
      {
        set_name: 'Set',
        set_code: 'SET-EN001',
        set_rarity: 'Common',
        set_rarity_code: '(C)',
      } as never,
    ],
  })

  /** Answers like the API, keyed by URL, and records the requests. */
  function fakeApi(version: string) {
    const urls: string[] = []
    const responses: [RegExp, unknown][] = [
      [/checkDBVer/, [{ database_version: version, last_update: '2026-11-01 10:00:00' }]],
      [
        /getBanListDates/,
        [
          { date: '2005-08-17', type: 'Goat' },
          { date: '2010-03-01', type: 'Edison' },
        ],
      ],
      [/getBanList\.php/, [{ id: 1, status_text: 'Limited' }]],
      [/cardinfo\.php\?format=/, { data: [{ id: 1 }, { id: 2 }] }],
      [/cardinfo\.php$/, { data: [apiCard(2, 'Spell Card'), apiCard(1, 'Mystery Monster')] }],
      [
        /cardsets\.php/,
        [{ set_name: 'Set', set_code: 'SET', num_of_cards: 1, tcg_date: '2026-10-01' }],
      ],
    ]
    const getJson = (<T>(url: string) => {
      urls.push(url)
      const match = responses.find(([pattern]) => pattern.test(url))
      if (!match) throw new Error(`Unexpected request: ${url}`)
      return Promise.resolve(structuredClone(match[1]) as T)
    }) as GetJson
    return { getJson, urls }
  }

  it('downloads cards, sets and formats in 8 requests, trimmed to the fields the app uses', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ygo-data-'))
    const api = fakeApi('1.5')
    const result = await refreshData(api.getJson, { dir })
    expect(api.urls).toHaveLength(8)
    expect(result).toMatchObject({ cards: 2, sets: 1, unknown: ['Mystery Monster'] })

    const cards = JSON.parse(await readFile(path.join(dir, 'cards.json'), 'utf8')) as ApiCard[]
    expect(cards.map((card) => card.id)).toEqual([1, 2])
    expect(cards[0]).toEqual({
      id: 1,
      name: 'Card 1',
      type: 'Mystery Monster',
      desc: 'Text',
      card_images: [
        {
          id: 1,
          image_url: 'https://images.ygoprodeck.com/images/cards/1.jpg',
          image_url_small: 'https://images.ygoprodeck.com/images/cards_small/1.jpg',
        },
      ],
      card_sets: [{ set_name: 'Set', set_code: 'SET-EN001', set_rarity: 'Common' }],
    })
    const version = JSON.parse(await readFile(path.join(dir, 'version.json'), 'utf8')) as object
    expect(version).toMatchObject({ database_version: '1.5' })
    const formats = JSON.parse(await readFile(path.join(dir, 'formats.json'), 'utf8')) as {
      formats: { id: string; limits: object }[]
    }
    expect(formats.formats.map((format) => format.id)).toEqual(['goat', 'edison'])
  })

  it('stops after the version check when the data is up to date', async () => {
    const dir = await mkdtemp(path.join(tmpdir(), 'ygo-data-'))
    await writeFile(path.join(dir, 'version.json'), JSON.stringify({ database_version: '1.5' }))
    const api = fakeApi('1.5')
    expect(await refreshData(api.getJson, { dir })).toBeNull()
    expect(api.urls).toHaveLength(1)

    const forced = fakeApi('1.5')
    expect(await refreshData(forced.getJson, { dir, force: true })).not.toBeNull()
    expect(forced.urls).toHaveLength(8)
  })

  it('reports subtypes missing from the card types file', () => {
    expect(
      unknownSubtypes([{ type: 'Effect Monster' }, { type: 'Token' }, { type: 'New Kind' }]),
    ).toEqual(['New Kind'])
    expect(trimCard(apiCard(5, 'Spell Card'))).not.toHaveProperty('frameType')
  })
})

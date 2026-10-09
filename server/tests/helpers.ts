import type { Express } from 'express'
import { createApp } from '../src/app.ts'
import { noopCache, type Cache } from '../src/cache.ts'
import { migrateDatabase } from '../src/db/migrate.ts'
import { sequelize } from '../src/db/sequelize.ts'
import { seedCards, seedDecks, type SourceCard, type SourceSet } from '../src/seed/seed.ts'

// Importing the models registers them on the shared Sequelize instance.
import '../src/db/models.ts'

const legacyImage = (id: number) => ({
  image_url: `https://storage.googleapis.com/ygoprodeck.com/pics/${id}.jpg`,
  image_url_small: `https://storage.googleapis.com/ygoprodeck.com/pics_small/${id}.jpg`,
})

function source(card: Partial<SourceCard> & Pick<SourceCard, 'id' | 'name' | 'type'>): SourceCard {
  return {
    card_sets: [{ set_name: 'Legend of Blue Eyes White Dragon' }],
    card_images: [legacyImage(card.id)],
    card_prices: [{ cardmarket_price: '0.10', tcgplayer_price: '0.20' }],
    ...card,
  }
}

export const IDS = {
  blueEyes: 89631139,
  darkMagician: 46986414,
  kuriboh: 40640057,
  potOfGreed: 55144522,
  monsterReborn: 83764718,
  mirrorForce: 44095762,
  firewall: 5043010,
  thousandDragon: 41462083,
  skill: 300000001,
  unreleased: 300000002,
} as const

export const SETS: SourceSet[] = [
  { set_name: 'Legend of Blue Eyes White Dragon', tcg_date: '2002-03-08' },
  { set_name: 'Metal Raiders', tcg_date: '2002-06-26' },
  { set_name: 'Code of the Duelist', tcg_date: '2018-08-03' },
]

export const CARDS: SourceCard[] = [
  source({
    id: IDS.blueEyes,
    name: 'Blue-Eyes White Dragon',
    type: 'Normal Monster',
    desc: 'This legendary dragon is a powerful engine of destruction.',
    race: 'Dragon',
    atk: 3000,
    def: 2500,
    level: 8,
    attribute: 'LIGHT',
    archetype: 'Blue-Eyes',
    card_sets: [{ set_name: 'Metal Raiders' }, { set_name: 'Legend of Blue Eyes White Dragon' }],
  }),
  source({
    id: IDS.darkMagician,
    name: 'Dark Magician',
    type: 'Normal Monster',
    desc: 'The ultimate wizard in terms of attack and defense.',
    race: 'Spellcaster',
    atk: 2500,
    def: 2100,
    level: 7,
    attribute: 'DARK',
    archetype: 'Dark Magician',
  }),
  source({
    id: IDS.kuriboh,
    name: 'Kuriboh',
    type: 'Effect Monster',
    desc: 'Discard this card to make the battle damage 0.',
    race: 'Fiend',
    atk: 300,
    def: 200,
    level: 1,
    attribute: 'DARK',
  }),
  source({
    id: IDS.potOfGreed,
    name: 'Pot of Greed',
    type: 'Spell Card',
    desc: 'Draw 2 cards.',
    race: 'Normal',
  }),
  source({
    id: IDS.monsterReborn,
    name: 'Monster Reborn',
    type: 'Spell Card',
    desc: 'Target 1 monster in either GY; Special Summon it.',
    race: 'Normal',
  }),
  source({
    id: IDS.mirrorForce,
    name: 'Mirror Force',
    type: 'Trap Card',
    desc: "Destroy all your opponent's Attack Position monsters.",
    race: 'Normal',
  }),
  source({
    id: IDS.firewall,
    name: 'Firewall Dragon',
    type: 'Link Monster',
    desc: 'Link effect monster without level or DEF.',
    race: 'Cyberse',
    atk: 2500,
    attribute: 'LIGHT',
    card_sets: [{ set_name: 'Code of the Duelist' }],
  }),
  source({
    id: IDS.thousandDragon,
    name: 'Thousand Dragon',
    type: 'Fusion Monster',
    desc: '"Time Wizard" + "Baby Dragon"',
    race: 'Dragon',
    atk: 2400,
    def: 2000,
    level: 7,
    attribute: 'WIND',
  }),
  source({ id: IDS.skill, name: 'Skill', type: 'Skill Card' }),
  source({ id: IDS.unreleased, name: 'Unreleased', type: 'Spell Card', card_sets: [] }),
]

export const SEEDED_CARDS = CARDS.length - 2

/** Recreates the schema and loads the fixtures into the in-memory database. */
export async function resetDatabase(): Promise<void> {
  await sequelize.getQueryInterface().dropAllTables()
  await migrateDatabase()
  await seedCards(CARDS, SETS, new Date('2026-01-01T00:00:00Z'))
  await seedDecks([
    {
      name: 'Kaiba',
      color: 'blue-500',
      cards: [IDS.blueEyes, IDS.blueEyes, IDS.potOfGreed, IDS.thousandDragon, IDS.unreleased],
    },
  ])
}

export function testApp(cache: Cache = noopCache, corsOrigins: string[] = []): Express {
  return createApp({ cache, corsOrigins })
}

/** In-memory cache that records calls, for asserting cache usage. */
export function memoryCache(): Cache & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>()
  return {
    store,
    get: <T>(key: string) => Promise.resolve((store.get(key) as T | undefined) ?? null),
    set: (key, value) => {
      store.set(key, value)
      return Promise.resolve()
    },
    close: () => Promise.resolve(),
  }
}

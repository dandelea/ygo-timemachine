import { describe, expect, it } from 'vitest'
import type { Card, CardImage, DeckDetail, DeckSummary, SavedDeck } from '@/types/api'
import { fixtures } from './helpers'

// Key lists that must cover the client types exactly; the `Exact` checks fail
// to compile when a type gains or loses a property without updating the list.
type Exact<T, K extends readonly PropertyKey[]> = [Exclude<keyof T, K[number]>] extends [never]
  ? K
  : never

const cardKeys = [
  'id',
  'name',
  'description',
  'type',
  'subtype',
  'race',
  'atk',
  'def',
  'level',
  'attribute',
  'first_release',
  'archetype_id',
  'images',
] as const satisfies Exact<Card, readonly (keyof Card)[]>
const imageKeys = ['id', 'card_id', 'image', 'image_small'] as const satisfies Exact<
  CardImage,
  readonly (keyof CardImage)[]
>
const deckDetailKeys = [
  'id',
  'name',
  'color',
  'createdAt',
  'updatedAt',
  'main',
  'extra',
] as const satisfies Exact<DeckDetail, readonly (keyof DeckDetail)[]>
const deckSummaryKeys = [
  'id',
  'name',
  'color',
  'createdAt',
  'updatedAt',
  'cards',
] as const satisfies Exact<DeckSummary, readonly (keyof DeckSummary)[]>
const savedDeckKeys = ['id', 'name', 'color', 'createdAt', 'updatedAt'] as const satisfies Exact<
  SavedDeck,
  readonly (keyof SavedDeck)[]
>

const keysOf = (value: object) => Object.keys(value).sort()
const sorted = (keys: readonly string[]) => [...keys].sort()

function expectCard(card: Card) {
  expect(keysOf(card)).toEqual(sorted(cardKeys))
  expect(['MONSTER', 'SPELL', 'TRAP', 'EXTRA', null]).toContain(card.type)
  expect(typeof card.id).toBe('number')
  for (const image of card.images) expect(keysOf(image)).toEqual(sorted(imageKeys))
}

describe('API fixtures match the client types', () => {
  it('card search result', () => {
    const result = fixtures.cards()
    expect(keysOf(result)).toEqual(['data', 'total'])
    result.data.forEach(expectCard)
  })

  it('deck detail', () => {
    const deck = fixtures.deck()
    expect(keysOf(deck)).toEqual(sorted(deckDetailKeys))
    ;[...deck.main, ...deck.extra].forEach(expectCard)
    expect(deck.extra.every((card) => card.type === 'EXTRA')).toBe(true)
  })

  it('deck list', () => {
    for (const deck of fixtures.decks()) {
      expect(keysOf(deck)).toEqual(sorted(deckSummaryKeys))
      for (const card of deck.cards) {
        expect(keysOf(card)).toEqual(['id', 'images'])
        for (const image of card.images) expect(keysOf(image)).toEqual(['image', 'image_small'])
      }
    }
  })

  it('saved deck, stats and archetypes', () => {
    expect(keysOf(fixtures.savedDeck())).toEqual(sorted(savedDeckKeys))
    expect(keysOf(fixtures.stats())).toEqual(['cards', 'pageSize'])
    expect(fixtures.archetypes().every((name) => typeof name === 'string')).toBe(true)
  })
})

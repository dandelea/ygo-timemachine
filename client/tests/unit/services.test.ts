import { describe, expect, it, vi } from 'vitest'
import {
  addCard,
  canAddCard,
  mainDeckSlots,
  removeCard,
  sortExtraDeck,
  sortMainDeck,
  toPayload,
  type EditableDeck,
} from '@/services/deck'
import { HISTORY_SIZE, pushHistory } from '@/services/history'
import { createSearchForm, toSearchRequest } from '@/services/search-form'
import { attributes, levels, monsterTypes } from '@/services/values'
import type { Card } from '@/types/api'
import { formatCalendarDate } from '@/utils/date'
import { fixtures } from './helpers'

const cards = fixtures.cards().data
const byType = (type: Card['type']) => cards.find((card) => card.type === type) as Card
const monster = byType('MONSTER')
const spell = byType('SPELL')
const extra = byType('EXTRA')

const card = (id: number, type: Card['type'], name = `Card ${id}`): Card => ({
  ...monster,
  id,
  type,
  name,
})

const emptyDeck = (): EditableDeck => ({ id: null, name: '', color: '', main: [], extra: [] })

describe('deck rules', () => {
  it('adds main deck cards to main and extra deck cards to extra', () => {
    const deck = addCard(addCard(emptyDeck(), monster), extra)
    expect(deck.main).toEqual([monster])
    expect(deck.extra).toEqual([extra])
  })

  it('does not mutate the original deck', () => {
    const deck = emptyDeck()
    addCard(deck, spell)
    expect(deck.main).toEqual([])
  })

  it('allows at most three copies of a card', () => {
    let deck = emptyDeck()
    for (let i = 0; i < 4; i++) deck = addCard(deck, spell)
    expect(deck.main).toHaveLength(3)
    expect(canAddCard(deck, spell)).toBe(false)
  })

  it('caps the main deck at 60 and the extra deck at 15 cards', () => {
    const main = Array.from({ length: 60 }, (_, i) => card(i + 1, 'SPELL'))
    const extraCards = Array.from({ length: 15 }, (_, i) => card(i + 100, 'EXTRA'))
    const full = { ...emptyDeck(), main, extra: extraCards }
    expect(addCard(full, card(999, 'MONSTER'))).toBe(full)
    expect(addCard(full, card(998, 'EXTRA'))).toBe(full)
  })

  it('removes a single copy', () => {
    const deck = { ...emptyDeck(), main: [spell, spell] }
    expect(removeCard(deck, spell).main).toEqual([spell])
    expect(removeCard(deck, monster).main).toEqual([spell, spell])
  })

  it('sorts the main deck by type then name, and the extra deck by name', () => {
    const sorted = sortMainDeck([
      card(1, 'TRAP', 'A trap'),
      card(2, 'SPELL', 'B spell'),
      card(3, 'MONSTER', 'Z monster'),
      card(4, 'MONSTER', 'A monster'),
    ])
    expect(sorted.map((item) => item.name)).toEqual(['A monster', 'Z monster', 'B spell', 'A trap'])
    expect(
      sortExtraDeck([card(5, 'EXTRA', 'b'), card(6, 'EXTRA', 'a')]).map((c) => c.name),
    ).toEqual(['a', 'b'])
  })

  it('draws 40 main deck slots, growing in rows of ten', () => {
    expect(mainDeckSlots(0)).toBe(40)
    expect(mainDeckSlots(39)).toBe(40)
    expect(mainDeckSlots(40)).toBe(50)
    expect(mainDeckSlots(55)).toBe(60)
  })

  it('builds the API payload with trimmed name and every card id', () => {
    const deck = {
      ...emptyDeck(),
      name: ' Kaiba ',
      color: 'red-500',
      main: [spell, spell],
      extra: [extra],
    }
    expect(toPayload(deck)).toEqual({
      name: 'Kaiba',
      color: 'red-500',
      cards: [spell.id, spell.id, extra.id],
    })
  })
})

describe('card history', () => {
  it('moves revisited cards to the front without duplicates', () => {
    const history = pushHistory(pushHistory(pushHistory([], monster), spell), monster)
    expect(history.map((item) => item.id)).toEqual([monster.id, spell.id])
  })

  it(`keeps at most ${HISTORY_SIZE} cards`, () => {
    let history: Card[] = []
    for (let i = 0; i < HISTORY_SIZE + 5; i++) history = pushHistory(history, card(i, 'SPELL'))
    expect(history).toHaveLength(HISTORY_SIZE)
    expect(history[0]?.id).toBe(HISTORY_SIZE + 4)
  })
})

describe('search form', () => {
  it('starts with no restrictions and today as the epoch', () => {
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'))
    expect(toSearchRequest(createSearchForm())).toEqual({
      epoch: '2026-10-08',
      search: '',
      checks: [],
      attributes: [],
      levels: [],
      attack: { min: 0, max: 5000 },
      defense: { min: 0, max: 5000 },
      monsterTypes: [],
      archetypes: [],
      spellFamilies: [],
      trapFamilies: [],
      order: { field: 'name', inverse: false },
    })
    vi.useRealTimers()
  })

  it('sends the selected options with the values the API filters on', () => {
    const form = createSearchForm()
    form.search = '  dragon '
    form.checks.MONSTER = true
    form.attributes.LIGHT = true
    form.levels[8] = true
    form.monsterTypes['sea-serpent'] = true
    form.spellFamilies['quick-play'] = true
    form.trapFamilies.counter = true
    form.epoch = ''
    expect(toSearchRequest(form)).toMatchObject({
      epoch: null,
      search: 'dragon',
      checks: ['MONSTER'],
      attributes: ['LIGHT'],
      levels: [8],
      monsterTypes: ['Sea Serpent'],
      spellFamilies: ['Quick-Play'],
      trapFamilies: ['Counter'],
    })
  })

  it('returns independent forms', () => {
    const a = createSearchForm()
    a.attack.min = 1000
    expect(createSearchForm().attack.min).toBe(0)
  })
})

describe('filter options', () => {
  it('resolves every bundled icon', () => {
    const urls = [
      ...attributes.map((item) => item.image),
      ...levels.flatMap((item) => [item.images.active, item.images.inactive]),
      ...monsterTypes.flatMap((item) => (item.image ? [item.image] : [])),
    ]
    expect(urls.length).toBeGreaterThan(40)
    for (const url of urls) expect(url).toMatch(/\.(png|jpg|svg)/)
  })
})

describe('formatCalendarDate', () => {
  it('formats old dates as a localized short date', () => {
    expect(formatCalendarDate('2014-11-06', 'en')).toBe('11/06/2014')
    expect(formatCalendarDate('2014-11-06', 'es')).toBe('06/11/2014')
  })

  it('handles missing and invalid values', () => {
    expect(formatCalendarDate(null, 'en')).toBe('')
    expect(formatCalendarDate('not a date', 'en')).toBe('not a date')
  })
})

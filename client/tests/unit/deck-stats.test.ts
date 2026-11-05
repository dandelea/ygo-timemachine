import { afterEach, describe, expect, it, vi } from 'vitest'
import { deckStats } from '@/services/deck-stats'
import { createSearchForm, latestPickableDate } from '@/services/search-form'
import type { Card } from '@/types/api'
import { fixtures } from './helpers'

const base = fixtures.cards().data[0] as Card
const card = (overrides: Partial<Card>): Card => ({
  ...base,
  attribute: null,
  level: null,
  archetype_id: null,
  ...overrides,
})

afterEach(() => {
  vi.useRealTimers()
})

describe('deckStats', () => {
  it('counts an empty deck', () => {
    const stats = deckStats({ main: [], extra: [] })
    expect(stats).toMatchObject({ main: 0, extra: 0, monsters: 0, attributes: [], archetypes: [] })
    expect(stats.levels).toEqual(Array.from({ length: 12 }, () => 0))
  })

  it('splits the Main deck by kind and counts Extra deck monsters', () => {
    const stats = deckStats({
      main: [
        card({ id: 1, type: 'MONSTER', attribute: 'WIND', level: 4 }),
        card({ id: 2, type: 'MONSTER', attribute: 'WIND', level: 4 }),
        card({ id: 3, type: 'SPELL' }),
        card({ id: 4, type: 'TRAP' }),
        card({ id: 5, type: 'TRAP' }),
      ],
      extra: [card({ id: 6, type: 'EXTRA', attribute: 'DARK', level: 10 })],
    })
    expect(stats.composition).toEqual({ monsters: 2, spells: 1, traps: 2 })
    expect(stats.main).toBe(5)
    expect(stats.extra).toBe(1)
    expect(stats.monsters).toBe(3)
    expect(stats.attributes).toEqual([
      { id: 'WIND', count: 2 },
      { id: 'DARK', count: 1 },
    ])
    expect(stats.levels[3]).toBe(2)
    expect(stats.levels[9]).toBe(1)
  })

  it('orders ties like the filters and ignores levels out of range', () => {
    const stats = deckStats({
      main: [
        card({ id: 1, type: 'MONSTER', attribute: 'LIGHT', level: 0 }),
        card({ id: 2, type: 'MONSTER', attribute: 'EARTH', level: 13 }),
        card({ id: 3, type: 'MONSTER', attribute: 'DIVINE' }),
      ],
      extra: [],
    })
    expect(stats.attributes.map((attribute) => attribute.id)).toEqual(['EARTH', 'LIGHT', 'DIVINE'])
    expect(stats.levels.every((count) => count === 0)).toBe(true)
  })

  it('keeps the four archetypes with most cards', () => {
    const archetype = (id: number, name: string) => card({ id, type: 'SPELL', archetype_id: name })
    const stats = deckStats({
      main: [
        archetype(1, 'Yosenju'),
        archetype(2, 'Yosenju'),
        archetype(3, 'Yosenju'),
        archetype(4, 'Greed'),
        archetype(5, 'Greed'),
        archetype(6, 'Solemn'),
        archetype(7, 'Raidraptor'),
        archetype(8, 'Ancient'),
      ],
      extra: [],
    })
    expect(stats.archetypes).toEqual([
      { name: 'Yosenju', count: 3 },
      { name: 'Greed', count: 2 },
      { name: 'Ancient', count: 1 },
      { name: 'Raidraptor', count: 1 },
    ])
  })
})

describe('latest pickable date', () => {
  it('stops at the end of the data, or today when the data is newer', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-05T12:00:00'))
    expect(latestPickableDate('2020-06-02')).toBe('2020-06-02')
    expect(latestPickableDate('2027-01-01')).toBe('2026-11-05')
    expect(latestPickableDate(null)).toBe('2026-11-05')
    expect(createSearchForm('2020-06-02').epoch).toBe('2020-06-02')
  })
})

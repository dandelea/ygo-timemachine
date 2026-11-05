import type { Card } from '@/types/api'
import type { EditableDeck } from './deck'
import { attributes as attributeOptions } from './values'

export const MAX_LEVEL = 12
const TOP_ARCHETYPES = 4

export interface DeckStats {
  main: number
  extra: number
  /** Main deck cards by kind; the Extra deck is all monsters. */
  composition: { monsters: number; spells: number; traps: number }
  /** Monsters in the Main and Extra deck. */
  monsters: number
  /** Monsters by attribute, most common first. */
  attributes: { id: string; count: number }[]
  /** Monsters by level or rank: `levels[0]` is level 1, `levels[11]` level 12. */
  levels: number[]
  /** Archetypes with the most cards, most common first. */
  archetypes: { name: string; count: number }[]
}

const attributeOrder = attributeOptions.map((option) => option.id)

function countBy<T>(items: T[], key: (item: T) => string | null): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const value = key(item)
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1)
  }
  return counts
}

const isMonster = (card: Card) => card.type === 'MONSTER' || card.type === 'EXTRA'

export function deckStats(deck: Pick<EditableDeck, 'main' | 'extra'>): DeckStats {
  const all = [...deck.main, ...deck.extra]
  const monsters = all.filter(isMonster)

  const levels = Array.from({ length: MAX_LEVEL }, () => 0)
  for (const card of monsters) {
    const index = (card.level ?? 0) - 1
    if (index >= 0 && index < MAX_LEVEL) levels[index] = (levels[index] ?? 0) + 1
  }

  // Ties keep the order of the filters (attributes) or the alphabet (archetypes).
  const attributeRank = (id: string) => {
    const index = attributeOrder.indexOf(id)
    return index === -1 ? attributeOrder.length : index
  }
  const attributes = [...countBy(monsters, (card) => card.attribute)]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || attributeRank(a.id) - attributeRank(b.id))

  const archetypes = [...countBy(all, (card) => card.archetype_id)]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, TOP_ARCHETYPES)

  return {
    main: deck.main.length,
    extra: deck.extra.length,
    composition: {
      monsters: deck.main.filter(isMonster).length,
      spells: deck.main.filter((card) => card.type === 'SPELL').length,
      traps: deck.main.filter((card) => card.type === 'TRAP').length,
    },
    monsters: monsters.length,
    attributes,
    levels,
    archetypes,
  }
}

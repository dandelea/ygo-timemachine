import { DECK_LIMITS, type Card, type CardType } from '@/types/api'

/** Colors a deck can be tagged with (Tailwind color names). */
export const DECK_COLORS = [
  'red-500',
  'orange-500',
  'yellow-500',
  'green-500',
  'teal-500',
  'blue-500',
  'indigo-500',
  'purple-500',
  'pink-500',
] as const

export interface EditableDeck {
  id: string | null
  name: string
  color: string
  main: Card[]
  extra: Card[]
}

export const isExtraDeckCard = (card: Pick<Card, 'type'>) => card.type === 'EXTRA'

const copiesOf = (cards: Card[], card: Card) => cards.filter((item) => item.id === card.id).length

/** Whether `card` can be added without breaking the copy or deck-size limits. */
export function canAddCard(deck: EditableDeck, card: Card): boolean {
  const all = [...deck.main, ...deck.extra]
  if (copiesOf(all, card) >= DECK_LIMITS.copies) return false
  return isExtraDeckCard(card)
    ? deck.extra.length < DECK_LIMITS.extra
    : deck.main.length < DECK_LIMITS.main
}

/** Returns a new deck with the card added to the right section, or the same deck. */
export function addCard(deck: EditableDeck, card: Card): EditableDeck {
  if (!canAddCard(deck, card)) return deck
  return isExtraDeckCard(card)
    ? { ...deck, extra: [...deck.extra, card] }
    : { ...deck, main: [...deck.main, card] }
}

/** Removes one copy of the card. */
export function removeCard(deck: EditableDeck, card: Card): EditableDeck {
  const without = (cards: Card[]) => {
    const index = cards.findIndex((item) => item.id === card.id)
    return index === -1 ? cards : cards.toSpliced(index, 1)
  }
  return isExtraDeckCard(card)
    ? { ...deck, extra: without(deck.extra) }
    : { ...deck, main: without(deck.main) }
}

const typeOrder: Record<CardType, number> = { MONSTER: 0, SPELL: 1, TRAP: 2, EXTRA: 3 }
const byName = (a: Card, b: Card) => a.name.localeCompare(b.name)

/** Main deck order shown in the editor: monsters, spells, traps; then by name. */
export const sortMainDeck = (cards: Card[]) =>
  cards.toSorted(
    (a, b) => (a.type ? typeOrder[a.type] : 4) - (b.type ? typeOrder[b.type] : 4) || byName(a, b),
  )

export const sortExtraDeck = (cards: Card[]) => cards.toSorted(byName)

/** Number of slots to draw: 40 minimum, growing in rows of 10 as the deck grows. */
export function mainDeckSlots(size: number): number {
  return size >= 40 ? Math.floor(size / 10) * 10 + 10 : 40
}

export const EXTRA_DECK_SLOTS = DECK_LIMITS.extra

export function toPayload(deck: EditableDeck) {
  return {
    name: deck.name.trim(),
    color: deck.color,
    cards: [...deck.main, ...deck.extra].map((card) => card.id),
  }
}

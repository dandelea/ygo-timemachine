import { DECK_LIMITS, type Card, type CardType, type FormatId } from '@/types/api'

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
  format: FormatId | null
  main: Card[]
  extra: Card[]
}

/** Copies allowed of each restricted card (0 = forbidden) in the deck's format. */
export type FormatLimits = Record<string, number>

export const isExtraDeckCard = (card: Pick<Card, 'type'>) => card.type === 'EXTRA'

const copiesOf = (cards: Card[], card: Card) => cards.filter((item) => item.id === card.id).length

export type AddBlockReason = 'copies' | 'main-full' | 'extra-full' | 'forbidden' | 'format-copies'

/** Copies the format allows of a card: 0 = forbidden, null = not restricted. */
export const formatLimitOf = (card: Card, limits: FormatLimits = {}): number | null =>
  limits[String(card.id)] ?? null

/** Why `card` cannot be added to the deck, or null when it can. */
export function addBlockReason(
  deck: Pick<EditableDeck, 'main' | 'extra'>,
  card: Card,
  limits: FormatLimits = {},
): AddBlockReason | null {
  const limit = formatLimitOf(card, limits)
  if (limit === 0) return 'forbidden'
  const copies = copiesOf([...deck.main, ...deck.extra], card)
  if (limit !== null && copies >= limit) return 'format-copies'
  if (copies >= DECK_LIMITS.copies) return 'copies'
  if (isExtraDeckCard(card)) return deck.extra.length < DECK_LIMITS.extra ? null : 'extra-full'
  return deck.main.length < DECK_LIMITS.main ? null : 'main-full'
}

/** Whether `card` can be added without breaking the copy, deck-size or format limits. */
export const canAddCard = (
  deck: Pick<EditableDeck, 'main' | 'extra'>,
  card: Card,
  limits: FormatLimits = {},
) => addBlockReason(deck, card, limits) === null

/** Returns a new deck with the card added to the right section, or the same deck. */
export function addCard(deck: EditableDeck, card: Card, limits: FormatLimits = {}): EditableDeck {
  if (!canAddCard(deck, card, limits)) return deck
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

/** Smallest legal Main deck. */
export const MAIN_DECK_MIN = 40

/** Number of slots to draw: 40 minimum, growing in rows of 10 as the deck grows. */
export function mainDeckSlots(size: number): number {
  return size >= MAIN_DECK_MIN ? Math.floor(size / 10) * 10 + 10 : MAIN_DECK_MIN
}

export const EXTRA_DECK_SLOTS = DECK_LIMITS.extra

export function toPayload(deck: EditableDeck) {
  return {
    name: deck.name.trim(),
    color: deck.color,
    format: deck.format,
    cards: [...deck.main, ...deck.extra].map((card) => card.id),
  }
}

import type { Card } from '@/types/api'

export const HISTORY_SIZE = 18

/** Moves the card to the front of the recently viewed list, keeping it bounded. */
export function pushHistory(history: Card[], card: Card): Card[] {
  const rest = history.filter((item) => item.id !== card.id)
  return [card, ...rest].slice(0, HISTORY_SIZE)
}

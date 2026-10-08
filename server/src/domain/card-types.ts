import { readFileSync } from 'node:fs'
import path from 'node:path'
import { dataDir } from '../paths.ts'

export const CARD_TYPES = ['MONSTER', 'SPELL', 'TRAP', 'EXTRA'] as const
export type CardType = (typeof CARD_TYPES)[number]

/** Maps each card type to the YGOPRODeck subtypes (e.g. "Effect Monster") it groups. */
export const subtypesByType = JSON.parse(
  readFileSync(path.join(dataDir, 'card-types.json'), 'utf8'),
) as Record<CardType, string[]>

export function cardTypeOf(subtype: string | null): CardType | null {
  if (subtype === null) return null
  return CARD_TYPES.find((type) => subtypesByType[type].includes(subtype)) ?? null
}

/** Main deck holds monsters, spells and traps; the extra deck holds EXTRA monsters. */
export function isExtraDeckType(type: CardType | null): boolean {
  return type === 'EXTRA'
}

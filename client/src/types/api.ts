// Response and request shapes of the ygo-timemachine API. They mirror the
// server types in server/src; keep both sides in sync.

export type CardType = 'MONSTER' | 'SPELL' | 'TRAP' | 'EXTRA'

export interface CardImage {
  id?: number
  image: string
  image_small: string
}

export interface Card {
  id: number
  name: string
  description: string | null
  type: CardType | null
  subtype: string | null
  race: string | null
  atk: number | null
  def: number | null
  level: number | null
  attribute: string | null
  first_release: string | null
  archetype_id: string | null
  images: CardImage[]
}

/** `GET /decks` item: only the id and images of each card. */
export interface DeckSummary {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  cards: Pick<Card, 'id' | 'images'>[]
}

/** `GET /decks/:id`: cards split into main and extra deck, duplicates included. */
export interface DeckDetail {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
  main: Card[]
  extra: Card[]
}

export interface SavedDeck {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface DeckPayload {
  name: string
  color: string
  cards: number[]
}

export interface CardSearchResult {
  total: number
  data: Card[]
}

export interface DbStats {
  pageSize: number
  cards: number
}

export type OrderField =
  'name' | 'type' | 'race' | 'archetype' | 'level' | 'attribute' | 'atk' | 'def'

export interface PointsRange {
  min: number
  max: number
}

/** Body of `POST /cards`. Empty lists mean "no restriction". */
export interface CardSearchRequest {
  epoch: string | null
  search: string
  checks: CardType[]
  attributes: string[]
  levels: number[]
  attack: PointsRange
  defense: PointsRange
  monsterTypes: string[]
  archetypes: string[]
  spellFamilies: string[]
  trapFamilies: string[]
  order: { field: OrderField; inverse: boolean }
}

export const DECK_LIMITS = { copies: 3, main: 60, extra: 15 } as const

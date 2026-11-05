// Response and request shapes of the ygo-timemachine API. They mirror the
// server types in server/src; keep both sides in sync.

export type CardType = 'MONSTER' | 'SPELL' | 'TRAP' | 'EXTRA'

export const FORMAT_IDS = ['goat', 'edison'] as const
export type FormatId = (typeof FORMAT_IDS)[number]

/** Link arrows, in reading order (top row, middle row, bottom row). */
export const LINK_MARKERS = [
  'Top-Left',
  'Top',
  'Top-Right',
  'Left',
  'Right',
  'Bottom-Left',
  'Bottom',
  'Bottom-Right',
] as const
export type LinkMarker = (typeof LINK_MARKERS)[number]

/** `GET /formats` item. */
export interface Format {
  id: FormatId
  name: string
  banlistDate: string
  cards: number
  /** Copies allowed of each restricted card (0 = forbidden), keyed by card id. */
  limits: Record<string, number>
}

/** `GET /cards/:id/printings`. */
export interface CardPrintings {
  total: number
  printings: { set: string; code: string | null; rarity: string | null; date: string | null }[]
}

export interface CardImage {
  id: number
  card_id: number
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
  link_value: number | null
  /** Link arrows, e.g. ['Top', 'Bottom-Left']. */
  link_markers: LinkMarker[] | null
  pendulum_scale: number | null
  archetype_id: string | null
  images: CardImage[]
}

/** `GET /decks` item: only the id and images of each card. */
export interface DeckSummary {
  id: string
  name: string
  color: string
  format: FormatId | null
  createdAt: string
  updatedAt: string
  cards: { id: number; images: Pick<CardImage, 'image' | 'image_small'>[] }[]
}

/** `GET /decks/:id`: cards split into main and extra deck, duplicates included. */
export interface DeckDetail {
  id: string
  name: string
  color: string
  format: FormatId | null
  createdAt: string
  updatedAt: string
  main: Card[]
  extra: Card[]
}

export interface SavedDeck {
  id: string
  name: string
  color: string
  format: FormatId | null
  createdAt: string
  updatedAt: string
}

export interface DeckPayload {
  name: string
  color: string
  format: FormatId | null
  cards: number[]
}

export interface CardSearchResult {
  total: number
  data: Card[]
}

export interface DbStats {
  pageSize: number
  cards: number
  /** Release date of the newest card (YYYY-MM-DD): the data covers up to that day. */
  latestRelease: string | null
}

export type OrderField =
  'name' | 'type' | 'race' | 'archetype' | 'level' | 'attribute' | 'atk' | 'def' | 'link' | 'scale'

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
  linkValues: number[]
  /** Cards with any of these arrows. */
  linkMarkers: LinkMarker[]
  /** Only sent when narrowed: restricts the search to Pendulum monsters. */
  scale?: PointsRange
  /** Restricts the search to the cards legal in the format; the date is then ignored. */
  format: FormatId | null
  monsterTypes: string[]
  archetypes: string[]
  spellFamilies: string[]
  trapFamilies: string[]
  order: { field: OrderField; inverse: boolean }
}

export const DECK_LIMITS = { copies: 3, main: 60, extra: 15 } as const

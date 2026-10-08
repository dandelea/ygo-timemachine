// Trimmed responses captured from the real API (see server/tests/contract.test.ts,
// which checks they still match what the server returns).
import archetypes from './api/archetypes.json' with { type: 'json' }
import cards from './api/cards.json' with { type: 'json' }
import deck from './api/deck.json' with { type: 'json' }
import decks from './api/decks.json' with { type: 'json' }
import savedDeck from './api/saved-deck.json' with { type: 'json' }
import stats from './api/stats.json' with { type: 'json' }
import type { CardSearchResult, DbStats, DeckDetail, DeckSummary, SavedDeck } from '@/types/api'

/** Fresh copies on every call so tests cannot leak mutations into each other. */
export const fixtures = {
  stats: () => structuredClone<DbStats>(stats),
  archetypes: () => structuredClone<string[]>(archetypes),
  decks: () => structuredClone(decks) as DeckSummary[],
  deck: () => structuredClone(deck) as DeckDetail,
  cards: () => structuredClone(cards) as CardSearchResult,
  savedDeck: () => structuredClone<SavedDeck>(savedDeck),
}

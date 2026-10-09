import axios from 'axios'
import type {
  Card,
  CardSearchRequest,
  CardSearchResult,
  DbStats,
  DeckDetail,
  DeckPayload,
  DeckSummary,
  SavedDeck,
} from '@/types/api'

export const http = axios.create({ baseURL: '/api', timeout: 15_000 })

export async function getStats(): Promise<DbStats> {
  return (await http.get<DbStats>('/stats')).data
}

export async function getArchetypes(): Promise<string[]> {
  return (await http.get<string[]>('/archetypes')).data
}

export async function getCard(id: number): Promise<Card> {
  return (await http.get<Card>(`/cards/${id}`)).data
}

export async function searchCards(
  request: CardSearchRequest,
  signal?: AbortSignal,
): Promise<CardSearchResult> {
  return (await http.post<CardSearchResult>('/cards', request, { signal })).data
}

export async function getDecks(): Promise<DeckSummary[]> {
  return (await http.get<DeckSummary[]>('/decks')).data
}

export async function getDeck(id: string): Promise<DeckDetail> {
  return (await http.get<DeckDetail>(`/decks/${id}`)).data
}

/** Creates the deck when `id` is null, otherwise replaces it. */
export async function saveDeck(id: string | null, payload: DeckPayload): Promise<SavedDeck> {
  const url = id === null ? '/decks' : `/decks/${id}`
  return (await http.post<SavedDeck>(url, payload)).data
}

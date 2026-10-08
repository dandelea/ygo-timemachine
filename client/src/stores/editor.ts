import { isCancel } from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from '@/services/api'
import {
  addCard as addToDeck,
  canAddCard,
  DECK_COLORS,
  removeCard as removeFromDeck,
  toPayload,
  type EditableDeck,
} from '@/services/deck'
import { pushHistory } from '@/services/history'
import { createSearchForm, toSearchRequest, type SearchForm } from '@/services/search-form'
import type { Card, CardSearchResult, DbStats } from '@/types/api'
import type { LoadStatus } from './decks'

export type EditorTab = 'form' | 'cards'
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const randomColor = () => DECK_COLORS[Math.floor(Math.random() * DECK_COLORS.length)] ?? 'blue-500'

// New decks get a random color; the original UI showed one but never saved it.
const emptyDeck = (): EditableDeck => ({
  id: null,
  name: '',
  color: randomColor(),
  main: [],
  extra: [],
})

export const useEditorStore = defineStore('editor', () => {
  const deck = ref<EditableDeck>(emptyDeck())
  const deckStatus = ref<LoadStatus>('idle')
  const saveStatus = ref<SaveStatus>('idle')

  const form = ref<SearchForm>(createSearchForm())
  const results = ref<CardSearchResult>({ total: 0, data: [] })
  const searchStatus = ref<LoadStatus>('idle')
  const stats = ref<DbStats | null>(null)
  const archetypes = ref<string[]>([])

  const history = ref<Card[]>([])
  const selectedCard = ref<Card | null>(null)
  const activeTab = ref<EditorTab>('cards')

  let searchController: AbortController | null = null

  /** Loads the deck (unless it is new) plus the stats and archetype list. */
  async function open(id: string) {
    deck.value = emptyDeck()
    saveStatus.value = 'idle'
    deckStatus.value = 'loading'
    try {
      const [loadedStats, loadedArchetypes, loadedDeck] = await Promise.all([
        api.getStats(),
        api.getArchetypes(),
        id === 'new' ? Promise.resolve(null) : api.getDeck(id),
      ])
      stats.value = loadedStats
      archetypes.value = loadedArchetypes
      if (loadedDeck) {
        const { id: deckId, name, color, main, extra } = loadedDeck
        deck.value = { id: deckId, name, color, main, extra }
      }
      deckStatus.value = 'ready'
    } catch {
      deckStatus.value = 'error'
    }
  }

  /** Runs the current search; a newer search cancels the previous one. */
  async function search() {
    searchController?.abort()
    const controller = new AbortController()
    searchController = controller
    searchStatus.value = 'loading'
    try {
      results.value = await api.searchCards(toSearchRequest(form.value), controller.signal)
      searchStatus.value = 'ready'
    } catch (error) {
      if (!isCancel(error)) searchStatus.value = 'error'
    }
  }

  function resetFilters() {
    form.value = createSearchForm()
  }

  function selectCard(card: Card) {
    selectedCard.value = card
    history.value = pushHistory(history.value, card)
  }

  function clearHistory() {
    history.value = []
  }

  const canAdd = (card: Card) => canAddCard(deck.value, card)

  function addCard(card: Card) {
    deck.value = addToDeck(deck.value, card)
  }

  function removeCard(card: Card) {
    deck.value = removeFromDeck(deck.value, card)
  }

  function clearDeck() {
    deck.value = { ...deck.value, main: [], extra: [] }
  }

  const canSave = computed(() => deck.value.name.trim().length > 0 && saveStatus.value !== 'saving')

  /** Saves the deck; returns its id (new decks get one from the API). */
  async function save(): Promise<string | null> {
    saveStatus.value = 'saving'
    try {
      const saved = await api.saveDeck(deck.value.id, toPayload(deck.value))
      deck.value = { ...deck.value, id: saved.id }
      saveStatus.value = 'saved'
      return saved.id
    } catch {
      saveStatus.value = 'error'
      return null
    }
  }

  return {
    deck,
    deckStatus,
    saveStatus,
    form,
    results,
    searchStatus,
    stats,
    archetypes,
    history,
    selectedCard,
    activeTab,
    canSave,
    open,
    search,
    resetFilters,
    selectCard,
    clearHistory,
    canAdd,
    addCard,
    removeCard,
    clearDeck,
    save,
  }
})

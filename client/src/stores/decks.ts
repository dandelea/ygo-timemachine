import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDecks, getStats } from '@/services/api'
import type { DeckSummary } from '@/types/api'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export const useDecksStore = defineStore('decks', () => {
  const decks = ref<DeckSummary[]>([])
  const status = ref<LoadStatus>('idle')

  async function load() {
    status.value = 'loading'
    try {
      decks.value = await getDecks()
      status.value = 'ready'
    } catch {
      status.value = 'error'
    }
  }

  /** Last day the card data covers, for the home page intro. */
  const dataEnd = ref<string | null>(null)

  async function loadDataEnd() {
    try {
      dataEnd.value = (await getStats()).latestRelease
    } catch {
      // The intro falls back to a text without the date.
    }
  }

  return { decks, status, dataEnd, load, loadDataEnd }
})

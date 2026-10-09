import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDecks } from '@/services/api'
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

  return { decks, status, load }
})

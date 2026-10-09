import { AxiosError, CanceledError, type AxiosResponse } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/services/api'
import { useDecksStore } from '@/stores/decks'
import { useEditorStore } from '@/stores/editor'
import type { CardSearchResult } from '@/types/api'
import { fixtures } from './helpers'

vi.mock('@/services/api')
const mocked = vi.mocked(api)

function httpError(status: number) {
  return new AxiosError('failed', String(status), undefined, undefined, {
    status,
  } as AxiosResponse)
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => (resolve = done))
  return { promise, resolve }
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
  mocked.getStats.mockResolvedValue(fixtures.stats())
  mocked.getArchetypes.mockResolvedValue(fixtures.archetypes())
  mocked.getDeck.mockResolvedValue(fixtures.deck())
  mocked.searchCards.mockResolvedValue(fixtures.cards())
  mocked.saveDeck.mockResolvedValue(fixtures.savedDeck())
})

describe('decks store', () => {
  it('loads the deck list', async () => {
    mocked.getDecks.mockResolvedValue(fixtures.decks())
    const store = useDecksStore()
    const loading = store.load()
    expect(store.status).toBe('loading')
    await loading
    expect(store.status).toBe('ready')
    expect(store.decks).toHaveLength(2)
  })

  it('reports load errors', async () => {
    mocked.getDecks.mockRejectedValue(httpError(500))
    const store = useDecksStore()
    await store.load()
    expect(store.status).toBe('error')
  })
})

describe('editor store', () => {
  it('opens an existing deck with stats and archetypes', async () => {
    const store = useEditorStore()
    await store.open('deck-id')
    expect(mocked.getDeck).toHaveBeenCalledWith('deck-id')
    expect(store.deckStatus).toBe('ready')
    expect(store.deck.name).toBe(fixtures.deck().name)
    expect(store.deck.main).toHaveLength(fixtures.deck().main.length)
    expect(store.stats).toEqual(fixtures.stats())
  })

  it('opens new decks without fetching and with a color', async () => {
    const store = useEditorStore()
    await store.open('new')
    expect(mocked.getDeck).not.toHaveBeenCalled()
    expect(store.deck).toMatchObject({ id: null, name: '', main: [], extra: [] })
    expect(store.deck.color).toMatch(/-500$/)
  })

  it.each([
    [httpError(404), 'not-found'],
    [httpError(500), 'failed'],
    [new Error('offline'), 'failed'],
  ])('tells missing decks apart from failures (%s)', async (error, kind) => {
    mocked.getDeck.mockRejectedValue(error)
    const store = useEditorStore()
    await store.open('deck-id')
    expect(store.deckStatus).toBe('error')
    expect(store.deckError).toBe(kind)
  })

  it('ignores a slow deck response after opening another deck', async () => {
    const slow = deferred<ReturnType<typeof fixtures.deck>>()
    mocked.getDeck.mockReturnValueOnce(slow.promise)
    const store = useEditorStore()
    const first = store.open('slow')
    await store.open('new')
    slow.resolve(fixtures.deck())
    await first
    expect(store.deck.id).toBeNull()
  })

  it('keeps only the latest search result', async () => {
    const stale = deferred<CardSearchResult>()
    mocked.searchCards.mockImplementationOnce(async (_request, signal) => {
      const result = await stale.promise
      if (signal?.aborted) throw new CanceledError()
      return result
    })
    const store = useEditorStore()
    const first = store.search()
    const latest = { total: 1, data: fixtures.cards().data.slice(0, 1) }
    mocked.searchCards.mockResolvedValueOnce(latest)
    await store.search()
    stale.resolve(fixtures.cards())
    await first
    expect(store.results).toEqual(latest)
    expect(store.searchStatus).toBe('ready')
  })

  it('reports search errors', async () => {
    mocked.searchCards.mockRejectedValue(httpError(500))
    const store = useEditorStore()
    await store.search()
    expect(store.searchStatus).toBe('error')
  })

  it('saves new decks and keeps the returned id', async () => {
    const store = useEditorStore()
    await store.open('new')
    store.deck.name = 'Fixture deck'
    store.addCard(fixtures.cards().data[0]!)
    const saving = store.save()
    expect(store.saveStatus).toBe('saving')
    expect(store.canSave).toBe(false)
    await expect(saving).resolves.toBe(fixtures.savedDeck().id)
    expect(mocked.saveDeck).toHaveBeenCalledWith(null, {
      name: 'Fixture deck',
      color: store.deck.color,
      cards: [fixtures.cards().data[0]!.id],
    })
    expect(store.deck.id).toBe(fixtures.savedDeck().id)
    expect(store.saveStatus).toBe('saved')
  })

  it('reports save errors and can dismiss them', async () => {
    mocked.saveDeck.mockRejectedValue(httpError(400))
    const store = useEditorStore()
    await store.open('deck-id')
    await expect(store.save()).resolves.toBeNull()
    expect(store.saveStatus).toBe('error')
    store.dismissSaveStatus()
    expect(store.saveStatus).toBe('idle')
  })

  it('requires a name to save', async () => {
    const store = useEditorStore()
    await store.open('new')
    expect(store.canSave).toBe(false)
    store.deck.name = '   '
    expect(store.canSave).toBe(false)
    store.deck.name = 'Yugi'
    expect(store.canSave).toBe(true)
  })

  it('tracks selected cards in the history', () => {
    const store = useEditorStore()
    const [first, second] = fixtures.cards().data
    store.selectCard(first!)
    store.selectCard(second!)
    expect(store.selectedCard).toEqual(second)
    expect(store.history.map((card) => card.id)).toEqual([second!.id, first!.id])
    store.clearHistory()
    expect(store.history).toEqual([])
  })
})

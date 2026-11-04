import type { Page, Route } from '@playwright/test'
import { fixtures } from '../tests/fixtures/api'

/** `useDefault` answers with the fixture response for the same request. */
type Handler = (route: Route, useDefault: () => Promise<void>) => Promise<void> | void
export interface ApiCall {
  method: string
  path: string
  body: unknown
}

/**
 * Serves every `/api` request from the captured fixtures; nothing reaches a
 * real backend. `overrides` maps "METHOD /path" to a custom handler. Returns
 * the list of calls made.
 */
export async function mockApi(page: Page, overrides: Record<string, Handler> = {}) {
  const calls: ApiCall[] = []
  const deck = fixtures.deck()
  const defaults: Record<string, Handler> = {
    'GET /stats': (route) => route.fulfill({ json: fixtures.stats() }),
    'GET /archetypes': (route) => route.fulfill({ json: fixtures.archetypes() }),
    'GET /decks': (route) => route.fulfill({ json: fixtures.decks() }),
    [`GET /decks/${deck.id}`]: (route) => route.fulfill({ json: deck }),
    'POST /cards': (route) => route.fulfill({ json: fixtures.cards() }),
    'POST /decks': (route) => route.fulfill({ json: fixtures.savedDeck() }),
    [`POST /decks/${deck.id}`]: (route) => route.fulfill({ json: fixtures.savedDeck() }),
  }
  await page.route('**/api/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname.replace(/^\/api/, '')
    const key = `${request.method()} ${path}`
    calls.push({ method: request.method(), path, body: request.postDataJSON() as unknown })
    const notFound = () => route.fulfill({ status: 404, json: { error: 'Not found' } })
    const useDefault = async () => {
      const fallback = defaults[key]
      await (fallback ? fallback(route, notFound) : notFound())
    }
    const override = overrides[key]
    await (override ? override(route, useDefault) : useDefault())
  })
  return calls
}

export const deckFixture = fixtures.deck()
export const cardsFixture = fixtures.cards()
export const savedDeckFixture = fixtures.savedDeck()

import type { Locator, Page, Route } from '@playwright/test'
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

/** Drags with real pointer moves; vue-easy-dnd ignores synthetic HTML5 drag events. */
export async function dragTo(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox()
  const to = await target.boundingBox()
  if (!from || !to) throw new Error('Drag source or target is not visible')
  await page.mouse.move(from.x + from.width / 2, from.y + 10)
  await page.mouse.down()
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + 30, { steps: 5 })
  await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 3, 60), { steps: 20 })
  await page.mouse.up()
}

export const deckFixture = fixtures.deck()
export const cardsFixture = fixtures.cards()
export const savedDeckFixture = fixtures.savedDeck()

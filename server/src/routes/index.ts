import { Router } from 'express'
import type { Cache } from '../cache.ts'
import { notFound } from '../http/errors.ts'
import { cardIdSchema, cardSearchSchema, deckIdSchema, deckPayloadSchema } from '../http/schemas.ts'
import { listArchetypeIds } from '../services/archetypes.ts'
import { PAGE_SIZE, countCards, findCard, searchCards } from '../services/cards.ts'
import { getDeck, listDecks, saveDeck } from '../services/decks.ts'
import { appVersion } from '../paths.ts'

// The original client posts new decks to `/decks/null`; `new` is accepted too.
const NEW_DECK_IDS = new Set(['new', 'null'])

export function createRouter(cache: Cache): Router {
  const router = Router()

  router.get('/ping', (_req, res) => {
    res.send('pong')
  })

  router.get('/version', (_req, res) => {
    res.send(appVersion)
  })

  router.get('/stats', async (_req, res) => {
    res.json({ pageSize: PAGE_SIZE, cards: await countCards() })
  })

  router.get('/archetypes', async (_req, res) => {
    res.json(await listArchetypeIds())
  })

  router.post('/cards', async (req, res) => {
    const form = cardSearchSchema.parse(req.body)
    res.json(await searchCards(form, cache))
  })

  router.get('/cards/:id', async (req, res) => {
    const id = cardIdSchema.safeParse(req.params.id)
    const card = id.success ? await findCard(id.data) : null
    if (!card) throw notFound('Card not found')
    res.json(card)
  })

  router.get('/decks', async (_req, res) => {
    res.json(await listDecks())
  })

  router.get('/decks/:id', async (req, res) => {
    const id = deckIdSchema.safeParse(req.params.id)
    const deck = id.success ? await getDeck(id.data) : null
    if (!deck) throw notFound('Deck not found')
    res.json(deck)
  })

  router.post('/decks', async (req, res) => {
    const payload = deckPayloadSchema.parse(req.body)
    res.json(await saveDeck(null, payload))
  })

  router.post('/decks/:id', async (req, res) => {
    const payload = deckPayloadSchema.parse(req.body)
    if (NEW_DECK_IDS.has(req.params.id)) {
      res.json(await saveDeck(null, payload))
      return
    }
    const id = deckIdSchema.safeParse(req.params.id)
    if (!id.success) throw notFound('Deck not found')
    res.json(await saveDeck(id.data, payload))
  })

  return router
}

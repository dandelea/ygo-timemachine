import { Card, CardImage, Deck, DeckCard } from '../db/models.ts'
import { sequelize } from '../db/sequelize.ts'
import { cardTypeOf, isExtraDeckType, type CardType } from '../domain/card-types.ts'
import { badRequest } from '../http/errors.ts'
import type { DeckPayload } from '../http/schemas.ts'

export const DECK_LIMITS = { copies: 3, main: 60, extra: 15 } as const

export interface DeckDetail {
  id: string
  name: string
  color: string
  createdAt: Date
  updatedAt: Date
  main: Card[]
  extra: Card[]
}

export function listDecks(): Promise<Deck[]> {
  return Deck.findAll({
    order: [['createdAt', 'ASC']],
    include: [
      {
        model: Card,
        as: 'cards',
        attributes: ['id'],
        through: { attributes: [] },
        include: [{ model: CardImage, as: 'images', attributes: ['image', 'image_small'] }],
      },
    ],
  })
}

const typeOrder: Record<CardType, number> = { MONSTER: 0, SPELL: 1, TRAP: 2, EXTRA: 3 }
const typeRank = (type: CardType | null) => (type ? typeOrder[type] : 4)

export async function getDeck(id: string): Promise<DeckDetail | null> {
  const deck = await Deck.findByPk(id, {
    include: [
      {
        model: DeckCard,
        as: 'decks_cards',
        attributes: ['id'],
        include: [{ model: Card, as: 'card', include: [{ model: CardImage, as: 'images' }] }],
      },
    ],
    order: [[{ model: DeckCard, as: 'decks_cards' }, 'id', 'ASC']],
  })
  if (!deck) return null

  const cards = (deck.decks_cards ?? []).flatMap((entry) => (entry.card ? [entry.card] : []))
  return {
    id: deck.id,
    name: deck.name,
    color: deck.color,
    createdAt: deck.createdAt,
    updatedAt: deck.updatedAt,
    main: cards
      .filter((card) => !isExtraDeckType(card.type))
      .sort((a, b) => typeRank(a.type) - typeRank(b.type)),
    extra: cards.filter((card) => isExtraDeckType(card.type)),
  }
}

/** Rejects unknown cards and decks that break the Yu-Gi-Oh! deck-building limits. */
async function validateCards(cardIds: number[]): Promise<void> {
  const uniqueIds = [...new Set(cardIds)]
  const cards = await Card.findAll({ where: { id: uniqueIds }, attributes: ['id', 'subtype'] })
  if (cards.length !== uniqueIds.length) throw badRequest('One or more cards do not exist')

  const copies = new Map<number, number>()
  for (const id of cardIds) copies.set(id, (copies.get(id) ?? 0) + 1)
  if ([...copies.values()].some((count) => count > DECK_LIMITS.copies)) {
    throw badRequest(`A deck cannot contain more than ${DECK_LIMITS.copies} copies of a card`)
  }

  const extraIds = new Set(
    cards.filter((card) => isExtraDeckType(cardTypeOf(card.subtype))).map((card) => card.id),
  )
  const extraCount = cardIds.filter((id) => extraIds.has(id)).length
  if (extraCount > DECK_LIMITS.extra) {
    throw badRequest(`The extra deck cannot contain more than ${DECK_LIMITS.extra} cards`)
  }
  if (cardIds.length - extraCount > DECK_LIMITS.main) {
    throw badRequest(`The main deck cannot contain more than ${DECK_LIMITS.main} cards`)
  }
}

/**
 * Creates the deck when `id` is null or unknown, otherwise replaces its name,
 * color and cards. Runs in a transaction so a failure never leaves a deck
 * without its cards.
 */
export async function saveDeck(id: string | null, payload: DeckPayload): Promise<Deck> {
  await validateCards(payload.cards)
  return sequelize.transaction(async (transaction) => {
    const existing = id ? await Deck.findByPk(id, { transaction }) : null
    const deck = existing
      ? await existing.update({ name: payload.name, color: payload.color }, { transaction })
      : await Deck.create({ name: payload.name, color: payload.color }, { transaction })
    await DeckCard.destroy({ where: { deck_id: deck.id }, transaction })
    await DeckCard.bulkCreate(
      payload.cards.map((cardId) => ({ deck_id: deck.id, card_id: cardId })),
      { transaction },
    )
    return deck
  })
}

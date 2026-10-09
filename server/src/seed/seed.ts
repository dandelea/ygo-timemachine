import { Archetype, Card, CardImage, CardPrice, Deck, DeckCard } from '../db/models.ts'
import { sequelize } from '../db/sequelize.ts'

/** Shape of a card in `data/cards.json` (YGOPRODeck API dump). */
export interface SourceCard {
  id: number
  name: string
  type: string
  desc?: string
  race?: string
  atk?: number
  def?: number
  level?: number
  attribute?: string
  archetype?: string
  card_sets?: { set_name: string }[]
  card_images: { image_url: string; image_url_small: string }[]
  card_prices?: Record<string, string>[]
}

export interface SourceSet {
  set_name: string
  tcg_date?: string
}

export interface SourceDeck {
  name: string
  color: string
  cards: number[]
}

const BATCH_SIZE = 500

/** Cards without sets were never released in the TCG; Skill Cards are not playable. */
function isSeedable(card: SourceCard): boolean {
  return Boolean(card.card_sets?.length) && card.type !== 'Skill Card'
}

/** Inserts archetypes and cards (with images and prices). Returns the number of cards. */
export async function seedCards(
  sourceCards: SourceCard[],
  sets: SourceSet[],
  now = new Date(),
): Promise<number> {
  const releaseDates = new Map(
    sets.filter((set) => set.tcg_date).map((set) => [set.set_name, set.tcg_date as string]),
  )
  const cards = sourceCards.filter(isSeedable)
  const archetypes = [...new Set(cards.flatMap((card) => (card.archetype ? [card.archetype] : [])))]

  await sequelize.transaction(async (transaction) => {
    await Archetype.bulkCreate(
      archetypes.map((id) => ({ id })),
      { transaction },
    )
    for (let start = 0; start < cards.length; start += BATCH_SIZE) {
      const batch = cards.slice(start, start + BATCH_SIZE)
      await Card.bulkCreate(
        batch.map((card) => ({
          id: card.id,
          name: card.name,
          description: card.desc ?? null,
          subtype: card.type,
          race: card.race ?? null,
          atk: card.atk ?? null,
          def: card.def ?? null,
          level: card.level ?? null,
          attribute: card.attribute ?? null,
          first_release:
            (card.card_sets ?? [])
              .map((set) => releaseDates.get(set.set_name))
              .filter((date): date is string => Boolean(date))
              .sort()[0] ?? null,
          archetype_id: card.archetype ?? null,
        })),
        { transaction },
      )
      await CardImage.bulkCreate(
        batch.flatMap((card) =>
          card.card_images.map((image) => ({
            card_id: card.id,
            image: image.image_url,
            image_small: image.image_url_small,
          })),
        ),
        { transaction },
      )
      await CardPrice.bulkCreate(
        batch.flatMap((card) =>
          Object.entries(card.card_prices?.[0] ?? {}).map(([shop, value]) => ({
            card_id: card.id,
            shop: shop.replace('_price', ''),
            value: Number.parseFloat(value),
            date: now,
          })),
        ),
        { transaction },
      )
    }
  })
  return cards.length
}

/** Inserts the sample decks, skipping cards that were not seeded. */
export async function seedDecks(decks: SourceDeck[]): Promise<number> {
  const knownIds = new Set((await Card.findAll({ attributes: ['id'] })).map((card) => card.id))
  await sequelize.transaction(async (transaction) => {
    for (const source of decks) {
      const deck = await Deck.create({ name: source.name, color: source.color }, { transaction })
      await DeckCard.bulkCreate(
        source.cards
          .filter((id) => knownIds.has(id))
          .map((cardId) => ({ deck_id: deck.id, card_id: cardId })),
        { transaction },
      )
    }
  })
  return decks.length
}

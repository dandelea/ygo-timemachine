import {
  Archetype,
  Card,
  CardImage,
  CardPrice,
  CardPrinting,
  CardSet,
  Deck,
  DeckCard,
  FormatCard,
} from '../db/models.ts'
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
  linkval?: number
  linkmarkers?: string[]
  scale?: number
  card_sets?: { set_name: string; set_code?: string; set_rarity?: string }[]
  card_images: { image_url: string; image_url_small: string }[]
  card_prices?: Record<string, string>[]
}

export interface SourceSet {
  set_name: string
  set_code?: string
  tcg_date?: string
}

/** Shape of a format in `data/formats.json`. */
export interface SourceFormat {
  id: string
  cards: number[]
  limits: Record<string, number>
}

/** Copies of a card allowed in a deck when its format does not restrict it. */
const UNRESTRICTED_COPIES = 3

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

/** Card columns from a source card; `releaseDates` maps set names to their TCG date. */
function toCardRow(card: SourceCard, releaseDates: Map<string, string>) {
  return {
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
    link_value: card.linkval ?? null,
    link_markers: card.linkmarkers ?? null,
    pendulum_scale: card.scale ?? null,
    archetype_id: card.archetype ?? null,
  }
}

const releaseDatesOf = (sets: SourceSet[]) =>
  new Map(sets.filter((set) => set.tcg_date).map((set) => [set.set_name, set.tcg_date as string]))

const imageRows = (cards: SourceCard[]) =>
  cards.flatMap((card) =>
    card.card_images.map((image) => ({
      card_id: card.id,
      image: image.image_url,
      image_small: image.image_url_small,
    })),
  )

const priceRows = (cards: SourceCard[], now: Date) =>
  cards.flatMap((card) =>
    Object.entries(card.card_prices?.[0] ?? {}).map(([shop, value]) => ({
      card_id: card.id,
      shop: shop.replace('_price', ''),
      value: Number.parseFloat(value),
      date: now,
    })),
  )

/** Inserts archetypes and cards (with images and prices). Returns the number of cards. */
export async function seedCards(
  sourceCards: SourceCard[],
  sets: SourceSet[],
  now = new Date(),
): Promise<number> {
  const releaseDates = releaseDatesOf(sets)
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
        batch.map((card) => toCardRow(card, releaseDates)),
        { transaction },
      )
      await CardImage.bulkCreate(imageRows(batch), { transaction })
      await CardPrice.bulkCreate(priceRows(batch, now), { transaction })
    }
  })
  return cards.length
}

/**
 * Inserts what came after the first release of the data model: sets, card
 * printings, Link and Pendulum values, and the cards of each format. Only
 * touches cards already in the database, so it also fills older databases.
 */
export async function seedCardDetails(
  sourceCards: SourceCard[],
  sets: SourceSet[],
  formats: SourceFormat[],
  { replace = false } = {},
): Promise<{ printings: number; formatCards: number }> {
  const knownIds = new Set((await Card.findAll({ attributes: ['id'] })).map((card) => card.id))
  const cards = sourceCards.filter((card) => knownIds.has(card.id))
  const uniqueSets = [...new Map(sets.map((set) => [set.set_name, set])).values()]

  const printings = cards.flatMap((card) =>
    (card.card_sets ?? []).map((printing) => ({
      card_id: card.id,
      set_name: printing.set_name || null,
      set_code: printing.set_code ?? null,
      rarity: printing.set_rarity ?? null,
    })),
  )
  const formatCards = formats.flatMap((format) =>
    format.cards
      .filter((id) => knownIds.has(id))
      .map((id) => ({
        format: format.id,
        card_id: id,
        max_copies: format.limits[String(id)] ?? UNRESTRICTED_COPIES,
      })),
  )

  await sequelize.transaction(async (transaction) => {
    if (replace) {
      await CardPrinting.destroy({ where: {}, transaction })
      await FormatCard.destroy({ where: {}, transaction })
      await CardSet.destroy({ where: {}, transaction })
    }
    await CardSet.bulkCreate(
      uniqueSets.map((set) => ({
        name: set.set_name,
        code: set.set_code ?? null,
        release_date: set.tcg_date ?? null,
      })),
      { transaction },
    )
    for (let start = 0; start < printings.length; start += BATCH_SIZE) {
      await CardPrinting.bulkCreate(printings.slice(start, start + BATCH_SIZE), { transaction })
    }
    for (let start = 0; start < formatCards.length; start += BATCH_SIZE) {
      await FormatCard.bulkCreate(formatCards.slice(start, start + BATCH_SIZE), { transaction })
    }
    for (const card of cards) {
      if (card.linkval === undefined && card.scale === undefined) continue
      await Card.update(
        {
          link_value: card.linkval ?? null,
          link_markers: card.linkmarkers ?? null,
          pendulum_scale: card.scale ?? null,
        },
        { where: { id: card.id }, transaction },
      )
    }
  })
  return { printings: printings.length, formatCards: formatCards.length }
}

const CARD_FIELDS = [
  'name',
  'description',
  'subtype',
  'race',
  'atk',
  'def',
  'level',
  'attribute',
  'first_release',
  'link_value',
  'link_markers',
  'pendulum_scale',
  'archetype_id',
] as const

/**
 * Applies newer data to a database that already has cards: updates existing
 * cards in place (same ids, so saved decks keep them), adds new ones, and
 * replaces images, prices, sets, printings and formats. Cards missing from
 * the new data are removed (often placeholder ids of unreleased cards that
 * now have their real id), except those used by a deck.
 */
export async function syncCards(
  sourceCards: SourceCard[],
  sets: SourceSet[],
  formats: SourceFormat[],
  now = new Date(),
): Promise<{ cards: number; added: number; removed: number }> {
  const before = await Card.count()
  let removed = 0
  const releaseDates = releaseDatesOf(sets)
  const cards = sourceCards.filter(isSeedable)
  const archetypes = [...new Set(cards.flatMap((card) => (card.archetype ? [card.archetype] : [])))]

  await sequelize.transaction(async (transaction) => {
    await Archetype.bulkCreate(
      archetypes.map((id) => ({ id })),
      { transaction, ignoreDuplicates: true },
    )
    await CardImage.destroy({ where: { card_id: cards.map((card) => card.id) }, transaction })
    await CardPrice.destroy({ where: { card_id: cards.map((card) => card.id) }, transaction })
    const currentIds = new Set(cards.map((card) => card.id))
    const usedIds = new Set(
      (await DeckCard.findAll({ attributes: ['card_id'], transaction })).map((row) => row.card_id),
    )
    const staleIds = (await Card.findAll({ attributes: ['id'], transaction }))
      .map((card) => card.id)
      .filter((id) => !currentIds.has(id) && !usedIds.has(id))
    removed = staleIds.length
    for (let start = 0; start < staleIds.length; start += BATCH_SIZE) {
      await Card.destroy({ where: { id: staleIds.slice(start, start + BATCH_SIZE) }, transaction })
    }
    for (let start = 0; start < cards.length; start += BATCH_SIZE) {
      const batch = cards.slice(start, start + BATCH_SIZE)
      await Card.bulkCreate(
        batch.map((card) => toCardRow(card, releaseDates)),
        { transaction, updateOnDuplicate: [...CARD_FIELDS] },
      )
      await CardImage.bulkCreate(imageRows(batch), { transaction })
      await CardPrice.bulkCreate(priceRows(batch, now), { transaction })
    }
  })
  await seedCardDetails(sourceCards, sets, formats, { replace: true })
  return { cards: cards.length, added: (await Card.count()) - before + removed, removed }
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

import { createHash } from 'node:crypto'
import { Op, Sequelize, type Order, type WhereOptions } from 'sequelize'
import type { Cache } from '../cache.ts'
import { Archetype, Card, CardImage } from '../db/models.ts'
import { CARD_TYPES, subtypesByType, type CardType } from '../domain/card-types.ts'
import type { CardSearch } from '../http/schemas.ts'

export const PAGE_SIZE = 36

export interface CardSearchResult {
  total: number
  data: Card[]
}

// `type` is a virtual attribute derived from `subtype`; `archetype` is stored
// as `archetype_id`. Ordering by the raw names produced SQL errors.
const orderColumns: Record<CardSearch['order']['field'], string> = {
  name: 'name',
  type: 'subtype',
  race: 'race',
  archetype: 'archetype_id',
  level: 'level',
  attribute: 'attribute',
  atk: 'atk',
  def: 'def',
}

/** Matches the list, or cards without a value (e.g. spells have no attribute). */
function inListOrNull<T>(values: T[]) {
  return { [Op.or]: [{ [Op.in]: values }, { [Op.eq]: null }] }
}

function inRangeOrNull(range: { min: number; max: number }) {
  return { [Op.or]: [{ [Op.between]: [range.min, range.max] }, { [Op.eq]: null }] }
}

/** Filters that only make sense for one card type (e.g. ATK for monsters). */
function typeCondition(type: CardType, form: CardSearch): WhereOptions {
  const condition: Record<string, unknown> = { subtype: { [Op.in]: subtypesByType[type] } }
  // `race` holds the monster type, or the spell/trap family.
  if (type === 'MONSTER' || type === 'EXTRA') {
    if (form.attributes.length) condition.attribute = inListOrNull(form.attributes)
    if (form.levels.length) condition.level = inListOrNull(form.levels)
    if (form.attack) condition.atk = inRangeOrNull(form.attack)
    if (form.defense) condition.def = inRangeOrNull(form.defense)
    if (form.monsterTypes.length) condition.race = { [Op.in]: form.monsterTypes }
  }
  if (type === 'SPELL' && form.spellFamilies.length) {
    condition.race = { [Op.in]: form.spellFamilies }
  }
  if (type === 'TRAP' && form.trapFamilies.length) {
    condition.race = { [Op.in]: form.trapFamilies }
  }
  return condition
}

function buildWhere(form: CardSearch): WhereOptions {
  const checks = form.checks.length ? form.checks : CARD_TYPES
  const conditions: WhereOptions[] = [{ [Op.or]: checks.map((type) => typeCondition(type, form)) }]
  if (form.search) {
    const pattern = `%${form.search.toLowerCase()}%`
    conditions.push({
      [Op.or]: [
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('name')), { [Op.like]: pattern }),
        Sequelize.where(Sequelize.fn('LOWER', Sequelize.col('description')), {
          [Op.like]: pattern,
        }),
      ],
    })
  }
  if (form.archetypes.length) conditions.push({ archetype_id: { [Op.in]: form.archetypes } })
  if (form.epoch) conditions.push({ first_release: { [Op.lte]: form.epoch } })
  return { [Op.and]: conditions }
}

function cacheKey(form: CardSearch): string {
  return `cards:${createHash('sha256').update(JSON.stringify(form)).digest('hex')}`
}

export async function searchCards(form: CardSearch, cache: Cache): Promise<CardSearchResult> {
  const key = cacheKey(form)
  const cached = await cache.get<CardSearchResult>(key)
  if (cached) return cached

  const where = buildWhere(form)
  const direction = form.order.inverse ? 'DESC' : 'ASC'
  const order: Order = [
    [orderColumns[form.order.field], direction],
    ['name', 'ASC'],
  ]
  const [total, data] = await Promise.all([
    Card.count({ where }),
    Card.findAll({
      where,
      order,
      limit: PAGE_SIZE,
      include: [{ model: CardImage, as: 'images' }],
    }),
  ])
  const result = { total, data }
  // Store the serialized form so cached and fresh responses are identical.
  await cache.set(key, { total, data: data.map((card) => card.toJSON()) })
  return result
}

export function findCard(id: number): Promise<Card | null> {
  return Card.findByPk(id, {
    include: [
      { model: Archetype, as: 'archetype' },
      { model: CardImage, as: 'images' },
    ],
  })
}

export function countCards(): Promise<number> {
  return Card.count()
}

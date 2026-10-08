import { z } from 'zod'
import { CARD_TYPES } from '../domain/card-types.ts'

const MAX_LIST = 200
const label = z.string().trim().min(1).max(100)
const labels = z.array(label).max(MAX_LIST).default([])

const pointsRange = z
  .object({
    min: z.coerce.number().int().min(0).max(100_000),
    max: z.coerce.number().int().min(0).max(100_000),
  })
  .refine((range) => range.min <= range.max, { message: 'min must be lower than or equal to max' })

/** Columns a search can be ordered by; `type` and `archetype` map to real columns. */
export const ORDER_FIELDS = [
  'name',
  'type',
  'race',
  'archetype',
  'level',
  'attribute',
  'atk',
  'def',
] as const

/**
 * Body of `POST /cards`. Empty lists mean "no restriction" for that filter.
 * Unknown keys (such as `order.options`, sent by the client) are ignored.
 */
export const cardSearchSchema = z.object({
  epoch: z.union([z.iso.date(), z.literal(''), z.null()]).optional(),
  search: z.string().trim().max(100).default(''),
  checks: z.array(z.enum(CARD_TYPES)).max(CARD_TYPES.length).default([]),
  attributes: labels,
  levels: z.array(z.coerce.number().int().min(0).max(13)).max(MAX_LIST).default([]),
  attack: pointsRange.optional(),
  defense: pointsRange.optional(),
  monsterTypes: labels,
  archetypes: labels,
  spellFamilies: labels,
  trapFamilies: labels,
  order: z
    .object({
      field: z.enum(ORDER_FIELDS).default('name'),
      inverse: z.boolean().default(false),
    })
    .default({ field: 'name', inverse: false }),
})
export type CardSearch = z.infer<typeof cardSearchSchema>

export const cardIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER)

/** Card ids may arrive as numbers or numeric strings (PostgreSQL BIGINT values). */
export const deckPayloadSchema = z.object({
  name: z.string().trim().min(1).max(100),
  color: z.string().trim().max(50).default(''),
  cards: z.array(cardIdSchema).max(100),
})
export type DeckPayload = z.infer<typeof deckPayloadSchema>

export const deckIdSchema = z.uuid()

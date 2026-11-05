import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { subtypesByType } from '../domain/card-types.ts'
import { logger } from '../logger.ts'
import { dataDir } from '../paths.ts'
import type { SourceCard, SourceSet } from '../seed/seed.ts'
import { downloadFormats } from './fetch-formats.ts'
import { CARD_API, pacedClient, type GetJson } from './ygoprodeck.ts'

/**
 * Updates `data/cards.json`, `data/sets.json` and `data/formats.json` from
 * YGOPRODeck, by hand: `npm run data:refresh` (add `-- --force` to download
 * even when the database version has not changed), then commit the files and
 * apply them with `npm run seed:sync`.
 *
 * At most 8 requests, one at a time with a pause: the database version, all
 * cards, all sets and the 5 format requests. Nothing is downloaded when the
 * version is the one already stored. Card images are not downloaded: the app
 * links them from YGOPRODeck.
 */

interface DatabaseVersion {
  database_version: string | number
  last_update: string
}

/** What the API returns for a card; only the fields the app uses are kept. */
export interface ApiCard extends SourceCard {
  banlist_info?: Record<string, string>
  card_images: { id?: number; image_url: string; image_url_small: string }[]
  card_sets?: { set_name: string; set_code?: string; set_rarity?: string; set_price?: string }[]
  [key: string]: unknown
}

/** Subtypes the app does not search by type (they are not playable in a deck). */
const UNGROUPED_SUBTYPES = new Set(['Token', 'Skill Card'])

/** Keeps the fields the seed reads, in the shape of the original data dump. */
export function trimCard(card: ApiCard): ApiCard {
  const optional = [
    'desc',
    'race',
    'archetype',
    'atk',
    'def',
    'level',
    'attribute',
    'linkval',
    'linkmarkers',
    'scale',
    'banlist_info',
  ] as const
  const trimmed: ApiCard = {
    id: card.id,
    name: card.name,
    type: card.type,
    card_images: card.card_images.map(({ id, image_url, image_url_small }) => ({
      ...(id === undefined ? {} : { id }),
      image_url,
      image_url_small,
    })),
  }
  for (const field of optional) {
    // The API sends null for some missing values; the original dump omits them.
    const value: unknown = card[field]
    if (value !== undefined && value !== null) Object.assign(trimmed, { [field]: value })
  }
  if (card.card_sets?.length) {
    trimmed.card_sets = card.card_sets.map(({ set_name, set_code, set_rarity, set_price }) => ({
      set_name,
      ...(set_code ? { set_code } : {}),
      ...(set_rarity ? { set_rarity } : {}),
      ...(set_price ? { set_price } : {}),
    }))
  }
  if (Array.isArray(card.card_prices)) trimmed.card_prices = card.card_prices
  return trimmed
}

/** Subtypes missing from `data/card-types.json`: those cards would match no type filter. */
export function unknownSubtypes(cards: { type: string }[]): string[] {
  const known = new Set(Object.values(subtypesByType).flat())
  return [...new Set(cards.map((card) => card.type))]
    .filter((type) => !known.has(type) && !UNGROUPED_SUBTYPES.has(type))
    .sort()
}

async function storedVersion(dir: string): Promise<DatabaseVersion | null> {
  try {
    return JSON.parse(await readFile(path.join(dir, 'version.json'), 'utf8')) as DatabaseVersion
  } catch {
    return null
  }
}

/** Downloads the data into `dir` (the data directory by default). Returns null if up to date. */
export async function refreshData(getJson: GetJson, { force = false, dir = dataDir } = {}) {
  const writeJson = (file: string, value: unknown, indent?: number) =>
    writeFile(path.join(dir, file), `${JSON.stringify(value, null, indent)}\n`)

  const [remote] = await getJson<DatabaseVersion[]>(`${CARD_API}/checkDBVer.php`)
  if (!remote) throw new Error('checkDBVer.php returned no version')
  const local = await storedVersion(dir)
  if (!force && local && String(local.database_version) === String(remote.database_version)) {
    logger.info({ version: remote.database_version }, 'Data already up to date')
    return null
  }

  const { data } = await getJson<{ data: ApiCard[] }>(`${CARD_API}/cardinfo.php`)
  const sets = await getJson<SourceSet[]>(`${CARD_API}/cardsets.php`)
  const formats = await downloadFormats(getJson, dir)

  const cards = data.map(trimCard).sort((a, b) => a.id - b.id)
  await writeJson('cards.json', cards)
  await writeJson('sets.json', sets, 4)
  await writeJson(
    'version.json',
    { ...remote, downloadedAt: new Date().toISOString().slice(0, 10) },
    2,
  )
  return { cards: cards.length, sets: sets.length, formats, unknown: unknownSubtypes(cards) }
}

if (import.meta.main) {
  try {
    const client = pacedClient()
    const result = await refreshData(client, { force: process.argv.includes('--force') })
    if (result) {
      logger.info(
        { cards: result.cards, sets: result.sets, requests: client.requests() },
        'Data downloaded',
      )
      if (result.unknown.length) {
        logger.warn(
          { subtypes: result.unknown },
          'Add these subtypes to data/card-types.json, or those cards will match no type filter',
        )
      }
    }
  } catch (error) {
    logger.fatal({ err: error }, 'Data refresh failed')
    process.exitCode = 1
  }
}

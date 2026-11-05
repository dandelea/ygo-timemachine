import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { logger } from '../logger.ts'
import { dataDir } from '../paths.ts'
import { BANLIST_API, CARD_API, pacedClient, type GetJson } from './ygoprodeck.ts'

/**
 * Downloads the cards and Forbidden/Limited list of each format from
 * YGOPRODeck into `data/formats.json` (5 requests, paced; see ygoprodeck.ts).
 * Run it by hand when the lists change, and commit the file.
 */

export const FORMATS = [
  { id: 'goat', name: 'GOAT', apiFormat: 'goat', banlist: 'Goat' },
  { id: 'edison', name: 'Edison', apiFormat: 'edison', banlist: 'Edison' },
] as const

export interface BanlistEntry {
  id: number
  status_text: string
}

export interface FormatData {
  id: string
  name: string
  banlistDate: string
  /** Ids of the cards that are legal in the format. */
  cards: number[]
  /** Copies allowed of the restricted cards (0 = forbidden), keyed by card id. */
  limits: Record<string, number>
}

const COPIES: Record<string, number> = { Forbidden: 0, Limited: 1, 'Semi-Limited': 2 }

/** Builds one format entry from the API responses. */
export function buildFormat(
  format: { id: string; name: string },
  banlistDate: string,
  cardIds: number[],
  banlist: BanlistEntry[],
): FormatData {
  const limits: Record<string, number> = {}
  for (const entry of [...banlist].sort((a, b) => a.id - b.id)) {
    const copies = COPIES[entry.status_text]
    if (copies === undefined) throw new Error(`Unknown banlist status: ${entry.status_text}`)
    limits[String(entry.id)] = copies
  }
  return {
    id: format.id,
    name: format.name,
    banlistDate,
    cards: [...new Set(cardIds)].sort((a, b) => a - b),
    limits,
  }
}

/** Downloads every format (5 requests) and writes `data/formats.json`. */
export async function downloadFormats(getJson: GetJson, dir = dataDir): Promise<FormatData[]> {
  const dates = await getJson<{ date: string; type: string }[]>(
    `${BANLIST_API}/getBanListDates.php`,
  )
  const formats: FormatData[] = []
  for (const format of FORMATS) {
    // Formats have a single list; take the newest date in case one is added.
    const banlistDate = dates
      .filter((entry) => entry.type.toLowerCase() === format.banlist.toLowerCase())
      .map((entry) => entry.date)
      .sort()
      .at(-1)
    if (!banlistDate) throw new Error(`No banlist found for ${format.name}`)
    const cards = await getJson<{ data: { id: number }[] }>(
      `${CARD_API}/cardinfo.php?format=${format.apiFormat}`,
    )
    const banlist = await getJson<BanlistEntry[]>(
      `${BANLIST_API}/getBanList.php?list=${format.banlist}&date=${banlistDate}`,
    )
    formats.push(
      buildFormat(
        format,
        banlistDate,
        cards.data.map((card) => card.id),
        banlist,
      ),
    )
    logger.info({ format: format.id, cards: cards.data.length }, 'Format downloaded')
  }
  const file = {
    source:
      'YGOPRODeck: db.ygoprodeck.com/api/v7/cardinfo.php (format) and ygoprodeck.com/api/banlist',
    downloadedAt: new Date().toISOString().slice(0, 10),
    formats,
  }
  await writeFile(path.join(dir, 'formats.json'), `${JSON.stringify(file, null, 2)}\n`)
  return formats
}

if (import.meta.main) {
  try {
    await downloadFormats(pacedClient())
  } catch (error) {
    logger.fatal({ err: error }, 'Format download failed')
    process.exitCode = 1
  }
}

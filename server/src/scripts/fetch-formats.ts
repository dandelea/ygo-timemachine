import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { logger } from '../logger.ts'
import { dataDir } from '../paths.ts'

/**
 * Downloads the cards and Forbidden/Limited list of each format from
 * YGOPRODeck into `data/formats.json`. The API is never called at runtime:
 * run this by hand when the lists change, and commit the file.
 *
 * YGOPRODeck limits requests per IP (and blocks clients that exceed it), so
 * this makes one request at a time, with a pause between them: 5 in total.
 */

const CARD_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php'
const BANLIST_API = 'https://ygoprodeck.com/api/banlist'
const PAUSE_MS = 2000
const USER_AGENT = 'ygo-timemachine (format data refresh)'

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

const pause = () => new Promise((resolve) => setTimeout(resolve, PAUSE_MS))

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`${url} answered ${response.status}`)
  await pause()
  return (await response.json()) as T
}

async function main() {
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
      `${CARD_API}?format=${format.apiFormat}`,
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
  await writeFile(path.join(dataDir, 'formats.json'), `${JSON.stringify(file, null, 2)}\n`)
}

if (import.meta.main) {
  try {
    await main()
  } catch (error) {
    logger.fatal({ err: error }, 'Format download failed')
    process.exitCode = 1
  }
}

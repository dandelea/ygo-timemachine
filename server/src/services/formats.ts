import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Op, Sequelize } from 'sequelize'
import { FormatCard } from '../db/models.ts'
import { FORMAT_IDS, UNRESTRICTED_COPIES, type FormatId } from '../domain/formats.ts'
import { dataDir } from '../paths.ts'

export interface FormatSummary {
  id: FormatId
  name: string
  /** Date of the format's Forbidden/Limited list. */
  banlistDate: string
  /** Number of legal cards. */
  cards: number
  /** Copies allowed of each restricted card (0 = forbidden), keyed by card id. */
  limits: Record<string, number>
}

const metadata = (
  JSON.parse(readFileSync(path.join(dataDir, 'formats.json'), 'utf8')) as {
    formats: { id: string; name: string; banlistDate: string }[]
  }
).formats

export async function listFormats(): Promise<FormatSummary[]> {
  const counts = (await FormatCard.findAll({
    attributes: ['format', [Sequelize.fn('COUNT', Sequelize.col('id')), 'cards']],
    group: ['format'],
    raw: true,
  })) as unknown as { format: string; cards: number | string }[]
  const restricted = await FormatCard.findAll({
    where: { max_copies: { [Op.lt]: UNRESTRICTED_COPIES } },
    attributes: ['format', 'card_id', 'max_copies'],
    order: [['card_id', 'ASC']],
  })
  return FORMAT_IDS.map((id) => {
    const meta = metadata.find((format) => format.id === id)
    const limits: Record<string, number> = {}
    for (const entry of restricted) {
      if (entry.format === id) limits[String(entry.card_id)] = entry.max_copies
    }
    return {
      id,
      name: meta?.name ?? id,
      banlistDate: meta?.banlistDate ?? '',
      cards: Number(counts.find((row) => row.format === id)?.cards ?? 0),
      limits,
    }
  })
}

/** Copies allowed per card in a format; cards missing from the map are not legal. */
export async function formatAllowances(format: FormatId, cardIds: number[]) {
  const rows = await FormatCard.findAll({
    where: { format, card_id: cardIds },
    attributes: ['card_id', 'max_copies'],
  })
  return new Map(rows.map((row) => [row.card_id, row.max_copies]))
}

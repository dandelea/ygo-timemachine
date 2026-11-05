import { CardPrinting, CardSet } from '../db/models.ts'

export interface Printing {
  set: string
  code: string | null
  rarity: string | null
  /** TCG release date of the set, when known. */
  date: string | null
}

export interface CardPrintings {
  /** Printings in every date (after grouping language variants). */
  total: number
  /** Printings up to `until` (or all of them), oldest first. */
  printings: Printing[]
}

/** The English code (LOB-EN005) wins over older or regional ones (LOB-005, LOB-E003). */
function preferredCode(codes: string[]): string | null {
  const sorted = [...codes].sort()
  return sorted.find((code) => /-EN/.test(code)) ?? sorted.at(-1) ?? null
}

/**
 * Printings of a card grouped by set and rarity: language variants of the same
 * printing (LOB-005, LOB-E003, LOB-EN005) become one row.
 */
export async function getPrintings(cardId: number, until?: string): Promise<CardPrintings> {
  const rows = await CardPrinting.findAll({
    where: { card_id: cardId },
    include: [{ model: CardSet, as: 'cardSet', attributes: ['release_date'] }],
  })
  const groups = new Map<string, Printing & { codes: string[] }>()
  for (const row of rows) {
    if (!row.set_name) continue
    const key = `${row.set_name}\u0000${row.rarity ?? ''}`
    const group = groups.get(key) ?? {
      set: row.set_name,
      code: null,
      rarity: row.rarity,
      date: row.cardSet?.release_date ?? null,
      codes: [],
    }
    if (row.set_code) group.codes.push(row.set_code)
    groups.set(key, group)
  }
  const all = [...groups.values()]
    .map(({ codes, ...printing }) => ({ ...printing, code: preferredCode(codes) }))
    .sort(
      (a, b) =>
        (a.date ?? '9999').localeCompare(b.date ?? '9999') ||
        a.set.localeCompare(b.set) ||
        (a.rarity ?? '').localeCompare(b.rarity ?? ''),
    )
  const printings = until ? all.filter((printing) => printing.date && printing.date <= until) : all
  return { total: all.length, printings }
}

import { format } from 'date-fns'
import type { CardSearchRequest, CardType, OrderField, PointsRange } from '@/types/api'
import { attackDefense, attributes, levels, monsterTypes, spellTypes, trapTypes } from './values'

/** State of the search filters panel; every toggle is keyed by option id. */
export interface SearchForm {
  epoch: string | null
  search: string
  checks: Record<CardType, boolean>
  attributes: Record<string, boolean>
  levels: Record<number, boolean>
  attack: PointsRange
  defense: PointsRange
  monsterTypes: Record<string, boolean>
  archetypes: string[]
  spellFamilies: Record<string, boolean>
  trapFamilies: Record<string, boolean>
  order: { field: OrderField; inverse: boolean }
}

const allOff = <K extends string | number>(keys: readonly K[]) =>
  Object.fromEntries(keys.map((key) => [key, false])) as Record<K, boolean>

export const today = () => format(new Date(), 'yyyy-MM-dd')

/** Latest date that can be picked: today, or the last day the card data covers. */
export const latestPickableDate = (dataEnd: string | null) => {
  const now = today()
  return dataEnd && dataEnd < now ? dataEnd : now
}

export function createSearchForm(dataEnd: string | null = null): SearchForm {
  return {
    epoch: latestPickableDate(dataEnd),
    search: '',
    checks: allOff(['MONSTER', 'SPELL', 'TRAP', 'EXTRA'] as const),
    attributes: allOff(attributes.map((attribute) => attribute.id)),
    levels: allOff(levels.map((level) => level.value)),
    attack: { ...attackDefense },
    defense: { ...attackDefense },
    monsterTypes: allOff(monsterTypes.map((type) => type.id)),
    archetypes: [],
    spellFamilies: allOff(spellTypes.map((family) => family.id)),
    trapFamilies: allOff(trapTypes.map((family) => family.id)),
    order: { field: 'name', inverse: false },
  }
}

const selected = <K extends string | number>(toggles: Record<K, boolean>) =>
  (Object.keys(toggles) as K[]).filter((key) => toggles[key])

/** Converts the panel state into the API request; unselected groups mean "any". */
export function toSearchRequest(form: SearchForm): CardSearchRequest {
  const labelOf = (options: { id: string; label: string }[], id: string) =>
    options.find((option) => option.id === id)?.label ?? id
  return {
    epoch: form.epoch || null,
    search: form.search.trim(),
    checks: selected(form.checks),
    attributes: selected(form.attributes),
    levels: selected(form.levels).map(Number),
    attack: form.attack,
    defense: form.defense,
    monsterTypes: selected(form.monsterTypes).map(
      (id) => monsterTypes.find((type) => type.id === id)?.name ?? id,
    ),
    archetypes: form.archetypes,
    spellFamilies: selected(form.spellFamilies).map((id) => labelOf(spellTypes, id)),
    trapFamilies: selected(form.trapFamilies).map((id) => labelOf(trapTypes, id)),
    order: form.order,
  }
}

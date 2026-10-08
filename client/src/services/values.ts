import type { CardType, OrderField } from '@/types/api'

// Bundled icons, resolved to their hashed URLs at build time.
const assets = import.meta.glob<string>('../assets/img/**/*.{png,jpg,svg}', {
  eager: true,
  query: '?url',
  import: 'default',
})

function asset(path: string): string {
  const url = assets[`../assets/img/${path}`]
  if (!url) throw new Error(`Missing asset: ${path}`)
  return url
}

export interface CardTypeOption {
  id: CardType
  label: string
  /** Tailwind color family used by the toggle (e.g. `bg-orange-500`). */
  color: string
}

export const checks: CardTypeOption[] = [
  { id: 'MONSTER', label: 'Monsters', color: 'orange' },
  { id: 'SPELL', label: 'Spells', color: 'green' },
  { id: 'TRAP', label: 'Traps', color: 'pink' },
  { id: 'EXTRA', label: 'Extra', color: 'purple' },
]

export interface AttributeOption {
  id: string
  label: string
  image: string
}

export const attributes: AttributeOption[] = [
  { id: 'EARTH', label: 'Earth', image: asset('attributes/earth.png') },
  { id: 'WIND', label: 'Wind', image: asset('attributes/wind.png') },
  { id: 'WATER', label: 'Water', image: asset('attributes/water.png') },
  { id: 'FIRE', label: 'Fire', image: asset('attributes/fire.png') },
  { id: 'DARK', label: 'Dark', image: asset('attributes/dark.png') },
  { id: 'LIGHT', label: 'Light', image: asset('attributes/light.png') },
]

export interface LevelOption {
  id: string
  label: string
  value: number
  images: { active: string; inactive: string }
}

export const levels: LevelOption[] = Array.from({ length: 12 }, (_, index) => {
  const value = index + 1
  return {
    id: `level_${value}`,
    label: `Level ${value}`,
    value,
    images: {
      active: asset(`levels/level_${value}.svg`),
      inactive: asset(`levels/level_${value}_gray.svg`),
    },
  }
})

export const levelStarImage = asset('levels/level.svg')
export const cardBackImage = asset('card.jpg')

export interface MonsterTypeOption {
  id: string
  /** Value stored in the card's `race` column. */
  name: string
  image: string | null
}

const monsterType = (id: string, name: string, image: string | null = `${id}.png`) => ({
  id,
  name,
  image: image ? asset(`types/sm/${image}`) : null,
})

export const monsterTypes: MonsterTypeOption[] = [
  monsterType('aqua', 'Aqua'),
  monsterType('beast', 'Beast'),
  monsterType('beast-warrior', 'Beast-Warrior'),
  monsterType('creator-god', 'Creator-God', null),
  monsterType('cyberse', 'Cyberse', null),
  monsterType('dinosaur', 'Dinosaur'),
  monsterType('divine-beast', 'Divine-Beast'),
  monsterType('dragon', 'Dragon'),
  monsterType('fairy', 'Fairy'),
  monsterType('fiend', 'Fiend'),
  monsterType('fish', 'Fish'),
  monsterType('insect', 'Insect'),
  monsterType('machine', 'Machine'),
  monsterType('plant', 'Plant'),
  monsterType('psychic', 'Psychic'),
  monsterType('pyro', 'Pyro'),
  monsterType('reptile', 'Reptile'),
  monsterType('rock', 'Rock'),
  monsterType('sea-serpent', 'Sea Serpent'),
  monsterType('spellcaster', 'Spellcaster'),
  monsterType('thunder', 'Thunder'),
  monsterType('warrior', 'Warrior'),
  monsterType('winged-beast', 'Winged Beast'),
  monsterType('wyrm', 'Wyrm', 'wyrm.jpg'),
  monsterType('zombie', 'Zombie'),
]

export const attackDefense = { min: 0, max: 5000 } as const

export interface FamilyOption {
  id: string
  /** Value stored in the card's `race` column. */
  label: string
}

export const spellTypes: FamilyOption[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'field', label: 'Field' },
  { id: 'equip', label: 'Equip' },
  { id: 'continuous', label: 'Continuous' },
  { id: 'quick-play', label: 'Quick-Play' },
  { id: 'ritual', label: 'Ritual' },
]

export const trapTypes: FamilyOption[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'continuous', label: 'Continuous' },
  { id: 'counter', label: 'Counter' },
]

export const orderOptions: { id: OrderField; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'type', label: 'Type' },
  { id: 'race', label: 'Subtype' },
  { id: 'archetype', label: 'Archetype' },
  { id: 'level', label: 'Level' },
  { id: 'attribute', label: 'Attribute' },
  { id: 'atk', label: 'ATK' },
  { id: 'def', label: 'DEF' },
]

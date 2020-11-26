import { attackDefense } from '@/services/values'
import moment from 'moment'

export const form = {
  epoch: moment().format('YYYY-MM-DD'),
  search: '',
  checks: {
    MONSTER: false,
    SPELL: false,
    TRAP: false,
    EXTRA: false,
  },
  attributes: {
    EARTH: false,
    WATER: false,
    WIND: false,
    FIRE: false,
    DARK: false,
    LIGHT: false,
  },
  levels: {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false,
    6: false,
    7: false,
    8: false,
    9: false,
    10: false,
    11: false,
    12: false,
  },
  attack: attackDefense,
  defense: attackDefense,
  monsterTypes: {
    aqua: false,
    beast: false,
    'beast-warrior': false,
    'creator-god': false,
    cyberse: false,
    dinosaur: false,
    'divine-beast': false,
    dragon: false,
    fairy: false,
    fiend: false,
    fish: false,
    insect: false,
    machine: false,
    plant: false,
    psychic: false,
    pyro: false,
    reptile: false,
    rock: false,
    'sea-serpent': false,
    spellcaster: false,
    thunder: false,
    warrior: false,
    'winged-beast': false,
    wyrm: false,
    zombie: false,
  },
  archetypes: [],
  spellFamilies: {
    normal: false,
    field: false,
    equip: false,
    continuous: false,
    'quick-play': false,
    ritual: false,
  },
  trapFamilies: {
    normal: false,
    continuous: false,
    counter: false,
  },
  order: {
    inverse: false,
    field: 'name',
    options: [
      {
        id: 'name',
        label: 'Name'
      },
      {
        id: 'type',
        label: 'Type'
      },
      {
        id: 'race',
        label: 'Subtype'
      },
      {
        id: 'archetype',
        label: 'Archetype'
      },
      {
        id: 'level',
        label: 'Level'
      },
      {
        id: 'attribute',
        label: 'Attribute'
      },
      {
        id: 'atk',
        label: 'ATK'
      },
      {
        id: 'def',
        label: 'DEF'
      },
    ]
  }
}
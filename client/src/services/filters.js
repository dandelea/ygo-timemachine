
import { firstRelease } from '@/services/dates'
import moment from 'moment'

export function filterChecks (card_type, checks) {
  let checks_array = []
  if (checks.monsters) checks_array.push(
    "Effect Monster",
    "Flip Effect Monster",
    "Flip Tuner Effect Monster",
    "Gemini Monster",
    "Normal Monster",
    "Normal Tuner Monster",
    "Pendulum Effect Monster",
    "Pendulum Flip Effect Monster",
    "Pendulum Normal Monster",
    "Pendulum Tuner Effect Monster",
    "Ritual Effect Monster",
    "Ritual Monster",
    "Spirit Monster",
    "Toon Monster",
    "Tuner Monster",
    "Union Effect Monster"
  )
  if (checks.spells) checks_array.push(
    "Spell Card"
  )
  if (checks.traps) checks_array.push(
    "Trap Card"
  )
  if (checks.extra) checks_array.push(
    "Fusion Monster",
    "Link Monster",
    "Pendulum Effect Fusion Monster",
    "Synchro Monster",
    "Synchro Pendulum Effect Monster",
    "Synchro Tuner Monster",
    "XYZ Monster",
    "XYZ Pendulum Effect Monster"
  )
  return !checks_array.length || checks_array.includes(card_type)
}

export function filterAttributes (card_attribute, attributes) {
  let attribute_array = []
  Object.keys(attributes).forEach((attribute) => {
    if (attributes[attribute]) {
      attribute_array.push(attribute.toUpperCase())
    }
  })
  return card_attribute === undefined || !attribute_array.length || attribute_array.includes(card_attribute)
}

export function filterStars (card_stars, stars) {
  let stars_array = []
  Object.keys(stars).forEach((star) => {
    if (stars[star]) {
      stars_array.push(parseInt(star))
    }
  })
  return card_stars === undefined || !stars_array.length || stars_array.includes(card_stars)
}

export function filterAttackDefense (card_attack, min, max) {
  return card_attack === undefined
  || (
    min <= card_attack && max >= card_attack
  )
}

export function filterMonsterTypes (card_type, card_race, form) {
  let types_array = []
  Object.keys(form).forEach((type) => {
    if (form[type]) {
      types_array.push(type.toLowerCase())
    }
  })
  if ([
    "Effect Monster",
    "Flip Effect Monster",
    "Flip Tuner Effect Monster",
    "Gemini Monster",
    "Normal Monster",
    "Normal Tuner Monster",
    "Pendulum Effect Monster",
    "Pendulum Flip Effect Monster",
    "Pendulum Normal Monster",
    "Pendulum Tuner Effect Monster",
    "Ritual Effect Monster",
    "Ritual Monster",
    "Spirit Monster",
    "Toon Monster",
    "Tuner Monster",
    "Union Effect Monster",

    "Fusion Monster",
    "Link Monster",
    "Pendulum Effect Fusion Monster",
    "Synchro Monster",
    "Synchro Pendulum Effect Monster",
    "Synchro Tuner Monster",
    "XYZ Monster",
    "XYZ Pendulum Effect Monster",
  ].includes(card_type)) {
    card_race = card_race.toLowerCase()
  } else {
    card_race = undefined
  }
  return card_type === undefined || !types_array.length || types_array.includes(card_race)
}

export function filterArchetypes (card_archetype, selected_archetypes) {
  return !selected_archetypes.length || selected_archetypes.includes(card_archetype)
}

export function filterSearch (card, search_query) {
  return card.name.toLowerCase().includes(search_query)
}

export function filterSpellFamilies (card_type, card_race, form) {
  let result = true
  let types_array = []
  Object.keys(form).forEach((type) => {
    if (form[type]) {
      types_array.push(type.toLowerCase())
    }
  })

  if ([
    'Spell Card'
  ].includes(card_type)) {
    result = types_array.includes(card_race.toLowerCase()) || !types_array.length
  }

  return result
}

export function filterTrapFamilies (card_type, card_race, form) {
  let result = true
  let types_array = []
  Object.keys(form).forEach((type) => {
    if (form[type]) {
      types_array.push(type.toLowerCase())
    }
  })
  if ([
    'Trap Card'
  ].includes(card_type)) {
    result = types_array.includes(card_race.toLowerCase()) || !types_array.length
  }

  return result
}

export function filterEpoch (card, epoch) {
  let date = firstRelease(card)
  return date !== null 
    && moment(date, 'YYYY-MM-DD').isBefore(moment(epoch, 'YYYY-MM-DD'))
}
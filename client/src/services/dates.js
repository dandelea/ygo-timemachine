import sets from '@/assets/data/sets.json'
import moment from 'moment'

export function firstRelease (card) {
  let first_date = null
  if (!card.card_sets) return null
  card.card_sets.forEach((card_set_link) => {
    let set_code = card_set_link.set_code.split('-')[0]
    let set = sets.find(set => set.set_code === set_code)
    if (set) {
      if (first_date === null) {
        first_date = set.tcg_date
      } else if (new Date(set.tcg_date) - new Date(first_date) < 0){
        first_date = set.tcg_date
      }
    }
  })
  return first_date
}

export function now() {
  return moment().format('YYYY-MM-DD')
}
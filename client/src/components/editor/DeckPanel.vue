<script setup lang="ts">
import { computed } from 'vue'
import { Drag, Drop, useDragAware, type DnDEventPayload } from 'vue-easy-dnd'
import ColorSelector from '@/components/form/ColorSelector.vue'
import {
  EXTRA_DECK_SLOTS,
  mainDeckSlots,
  sortExtraDeck,
  sortMainDeck,
  type EditableDeck,
} from '@/services/deck'
import { cardBackImage } from '@/services/values'
import type { Card } from '@/types/api'
import { DRAG_FROM_DECK, DRAG_FROM_RESULTS } from './drag-types'

const props = defineProps<{ deck: EditableDeck; canSave: boolean; saving?: boolean }>()
const emit = defineEmits<{
  'update:name': [name: string]
  'update:color': [color: string]
  add: [card: Card]
  remove: [card: Card]
  select: [card: Card]
  save: []
  clear: []
}>()

const color = computed({
  get: () => props.deck.color,
  set: (value: string) => {
    emit('update:color', value)
  },
})

const main = computed(() => sortMainDeck(props.deck.main))
const extra = computed(() => sortExtraDeck(props.deck.extra))
const sections = computed(() => [
  {
    key: 'main',
    cards: main.value,
    slots: mainDeckSlots(main.value.length),
    wrapper: 'max-h-half overflow-y-auto',
  },
  { key: 'extra', cards: extra.value, slots: EXTRA_DECK_SLOTS, wrapper: 'mt-4' },
])

const { dragInProgress, dragType } = useDragAware()
const receiving = computed(() => dragInProgress.value && dragType.value === DRAG_FROM_RESULTS)

function slotStyle(card: Card | undefined) {
  const image = card?.images[0]?.image_small ?? cardBackImage
  return { backgroundImage: `url('${image}')` }
}

function onDrop(event: DnDEventPayload) {
  emit('add', event.data as Card)
}
</script>

<template>
  <div>
    <div class="flex">
      <RouterLink
        to="/"
        class="w-10 h-10 flex items-center bg-blue-800 duration-200 hover:bg-blue-700"
        :title="$t('edit.Back')"
      >
        <FontAwesomeIcon icon="arrow-left" class="mx-auto" />
      </RouterLink>
      <input
        class="flex-1 p-2 text-white bg-blue-800"
        type="search"
        :aria-label="$t('edit.Deck name')"
        :placeholder="$t('edit.Deck name')"
        :value="deck.name"
        @input="emit('update:name', ($event.target as HTMLInputElement).value)"
      />
      <ColorSelector v-model="color" :title="$t('edit.Change color')" />
      <button
        type="button"
        class="w-10 h-10 bg-blue-800 duration-200 hover:bg-blue-700 disabled:cursor-not-allowed"
        :disabled="!canSave"
        :title="$t('edit.Save deck')"
        :aria-label="$t('edit.Save deck')"
        @click="emit('save')"
      >
        <FontAwesomeIcon :icon="saving ? 'spinner' : 'save'" :spin="saving" />
      </button>
    </div>
    <div class="flex relative">
      <div class="flex-1 flex items-center">
        <div class="flex-1 text-center">{{ $t('edit.Main deck') }}:</div>
        <div class="w-10 h-10 flex items-center bg-blue-800">
          <span class="mx-auto" data-testid="main-count">{{ deck.main.length }}</span>
        </div>
      </div>
      <div class="flex-1 flex items-center">
        <div class="flex-1 text-center">{{ $t('edit.Extra deck') }}:</div>
        <div class="w-10 h-10 flex items-center bg-blue-800">
          <span class="mx-auto" data-testid="extra-count">{{ deck.extra.length }}</span>
        </div>
      </div>
      <button
        type="button"
        class="w-10 h-10 flex items-center text-white bg-red-500 duration-200 hover:bg-red-600 shadow-lg"
        :title="$t('edit.Clear deck')"
        @click="emit('clear')"
      >
        <FontAwesomeIcon :icon="['far', 'trash-alt']" class="mx-auto" />
      </button>
    </div>
    <Drop :accepts-type="DRAG_FROM_RESULTS" @drop="onDrop">
      <div
        v-for="section in sections"
        :key="section.key"
        class="flex flex-wrap transition-colors duration-500"
        :class="[section.wrapper, { 'bg-gray-900': receiving }]"
        :data-testid="`${section.key}-deck`"
      >
        <template v-for="index in section.slots" :key="`${section.key}-${index}`">
          <Drag
            v-if="section.cards[index - 1]"
            :type="DRAG_FROM_DECK"
            :data="section.cards[index - 1]"
            class="group relative w-12 h-18 m-1/2 mx-auto flex items-center bg-no-repeat bg-cover cursor-pointer"
            :style="slotStyle(section.cards[index - 1])"
            :title="section.cards[index - 1]?.name"
            @click="emit('select', section.cards[index - 1] as Card)"
          >
            <span class="mx-auto">{{ index }}</span>
            <button
              type="button"
              class="absolute top-0 right-0 px-1 text-xs bg-red-500 opacity-100 [@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              :title="$t('edit.Remove card')"
              :aria-label="$t('edit.Remove {card}', { card: section.cards[index - 1]?.name })"
              @click.stop="emit('remove', section.cards[index - 1] as Card)"
            >
              <FontAwesomeIcon :icon="['far', 'trash-alt']" />
            </button>
          </Drag>
          <div
            v-else
            class="w-12 h-18 m-1/2 mx-auto flex items-center bg-no-repeat bg-cover"
            :style="slotStyle(undefined)"
          >
            <span class="mx-auto">{{ index }}</span>
          </div>
        </template>
      </div>
    </Drop>
  </div>
</template>

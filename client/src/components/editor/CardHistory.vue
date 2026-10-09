<script setup lang="ts">
import type { Card } from '@/types/api'

defineProps<{ cards: Card[] }>()
defineEmits<{ select: [card: Card]; clear: [] }>()
</script>

<template>
  <div v-if="cards.length" class="hidden md:block">
    <div class="py-2 pl-6 bg-blue-800 w-full h-10 flex items-center">
      <h2 class="flex-1 text-sm text-white">{{ $t('edit.Card history') }}</h2>
      <button
        type="button"
        class="w-10 h-10 flex items-center text-white bg-red-500 duration-200 hover:bg-red-600 shadow-lg"
        :title="$t('edit.Clear history')"
        @click="$emit('clear')"
      >
        <FontAwesomeIcon :icon="['far', 'trash-alt']" class="mx-auto" />
      </button>
    </div>
    <div class="flex flex-wrap md:max-h-history md:overflow-y-auto">
      <button
        v-for="card in cards"
        :key="card.id"
        type="button"
        class="w-12 bg-blue-900 h-16 mx-1 my-1 bg-no-repeat bg-cover"
        :style="{ backgroundImage: `url('${card.images[0]?.image_small ?? ''}')` }"
        :title="card.name"
        :aria-label="card.name"
        @click="$emit('select', card)"
      ></button>
    </div>
  </div>
</template>

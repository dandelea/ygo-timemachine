<script setup lang="ts">
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { computed } from 'vue'
import type { PointsRange } from '@/types/api'

const props = defineProps<{ label: string; min: number; max: number }>()
const range = defineModel<PointsRange>({ required: true })

const values = computed({
  get: () => [range.value.min, range.value.max],
  set: ([min = props.min, max = props.max]) => {
    range.value = { min, max }
  },
})
</script>

<template>
  <div class="w-full">
    <h3>{{ label }} ({{ range.min }} - {{ range.max }})</h3>
    <SliderRoot
      v-model="values"
      :min="min"
      :max="max"
      :step="100"
      :min-steps-between-thumbs="0"
      class="relative flex items-center select-none touch-none w-full h-6 px-1.5"
    >
      <SliderTrack class="relative grow h-1 rounded-full bg-gray-300">
        <SliderRange class="absolute h-full rounded-full bg-blue-500" />
      </SliderTrack>
      <SliderThumb
        v-for="thumb in ['min', 'max']"
        :key="thumb"
        :aria-label="`${label} ${thumb}`"
        class="block w-3.5 h-3.5 rounded-full bg-white shadow-md focus:outline-none focus:shadow-outline"
      />
    </SliderRoot>
  </div>
</template>

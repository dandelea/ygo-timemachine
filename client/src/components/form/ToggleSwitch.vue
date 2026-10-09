<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ id: string; color?: string }>()
const checked = defineModel<boolean>({ default: false })

// Classes are listed in main.css (`@source inline`) because they are built at runtime.
const knobColor = computed(() => (props.color ? `bg-${props.color}-500` : 'bg-blue-800'))
const trackColor = computed(() => (props.color ? `bg-${props.color}-200` : 'bg-blue-700'))
</script>

<template>
  <label :for="id" class="inline-flex items-center cursor-pointer">
    <span class="relative">
      <span
        class="block w-10 h-6 rounded-full shadow-inner"
        :class="checked ? trackColor : 'bg-blue-800'"
      ></span>
      <span
        class="absolute block w-4 h-4 my-1 ml-1 rounded-full inset-y-0 left-0 transition-transform duration-300 ease-in-out"
        :class="checked ? [knobColor, 'translate-x-full'] : 'bg-white'"
      >
        <input :id="id" v-model="checked" type="checkbox" class="absolute opacity-0 w-0 h-0" />
      </span>
    </span>
    <span class="ml-1 text-2xs flex items-center"><slot /></span>
  </label>
</template>

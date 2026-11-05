<script setup lang="ts">
import { vTooltip } from '@/directives/tooltip'
defineProps<{ id: string; label: string; image: string }>()
const active = defineModel<boolean>({ default: false })
</script>

<template>
  <button
    :id="id"
    v-tooltip="label"
    type="button"
    class="cursor-pointer p-1 rounded-full hover:shadow-lg duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
    :class="{ 'bg-blue-700 shadow-lg': active }"
    :aria-label="label"
    :aria-pressed="active"
    @click="active = !active"
  >
    <img alt="" :src="image" />
  </button>
</template>

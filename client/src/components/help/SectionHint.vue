<script setup lang="ts">
/** A short, always visible line explaining what a section of the page does. */
defineProps<{ highlight?: boolean }>()
</script>

<template>
  <p
    class="mx-4 my-1 text-xs leading-snug"
    :class="
      highlight
        ? 'px-2 py-1 border-l-4 border-orange-400 bg-orange-400/10 text-orange-200'
        : 'text-gray-400'
    "
  >
    <slot />
  </p>
</template>

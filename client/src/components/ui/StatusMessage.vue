<script setup lang="ts">
/** Inline loading, error or empty state, with an optional retry action. */
defineProps<{ kind: 'loading' | 'error' | 'empty'; message: string; retry?: boolean }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    :role="kind === 'error' ? 'alert' : 'status'"
    class="flex flex-wrap items-center justify-center gap-3 m-4 p-4 text-center"
    :class="kind === 'error' ? 'bg-red-800' : 'bg-blue-800'"
  >
    <FontAwesomeIcon v-if="kind === 'loading'" icon="spinner" spin />
    <FontAwesomeIcon v-else-if="kind === 'error'" icon="triangle-exclamation" />
    <span>{{ message }}</span>
    <slot />
    <button
      v-if="retry"
      type="button"
      class="px-3 py-1 bg-white text-blue-900 font-semibold duration-200 hover:bg-gray-200"
      @click="$emit('retry')"
    >
      {{ $t('common.Retry') }}
    </button>
  </div>
</template>

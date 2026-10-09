<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'
import type { SaveStatus } from '@/stores/editor'

const props = defineProps<{ status: SaveStatus }>()
const emit = defineEmits<{ dismiss: [] }>()

const SUCCESS_TIMEOUT_MS = 3000
let timer: ReturnType<typeof setTimeout> | undefined

// Success messages fade out on their own; errors stay until dismissed.
watch(
  () => props.status,
  (status) => {
    clearTimeout(timer)
    if (status === 'saved')
      timer = setTimeout(() => {
        emit('dismiss')
      }, SUCCESS_TIMEOUT_MS)
  },
)
onBeforeUnmount(() => {
  clearTimeout(timer)
})
</script>

<template>
  <div class="fixed bottom-4 inset-x-0 z-20 flex justify-center pointer-events-none">
    <Transition
      enter-from-class="opacity-0 translate-y-2"
      leave-to-class="opacity-0 translate-y-2"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-200"
    >
      <div
        v-if="status !== 'idle'"
        :role="status === 'error' ? 'alert' : 'status'"
        class="pointer-events-auto flex items-center gap-3 px-4 py-2 shadow-lg"
        :class="{
          'bg-blue-700': status === 'saving',
          'bg-green-600': status === 'saved',
          'bg-red-600': status === 'error',
        }"
        data-testid="save-feedback"
      >
        <FontAwesomeIcon v-if="status === 'saving'" icon="spinner" spin />
        <FontAwesomeIcon v-else-if="status === 'saved'" icon="check" />
        <FontAwesomeIcon v-else icon="triangle-exclamation" />
        <span v-if="status === 'saving'">{{ $t('edit.Saving') }}</span>
        <span v-else-if="status === 'saved'">{{ $t('edit.Saved') }}</span>
        <span v-else>{{ $t('edit.Save error') }}</span>
        <button
          v-if="status === 'error'"
          type="button"
          class="ml-2"
          :title="$t('common.Dismiss')"
          :aria-label="$t('common.Dismiss')"
          @click="emit('dismiss')"
        >
          <FontAwesomeIcon icon="xmark" />
        </button>
      </div>
    </Transition>
  </div>
</template>

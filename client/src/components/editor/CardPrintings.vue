<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getPrintings } from '@/services/api'
import type { CardPrintings } from '@/types/api'
import { formatLongDate } from '@/utils/date'

const props = defineProps<{ cardId: number; until: string | null }>()
const { t, locale } = useI18n()

const VISIBLE = 5
const data = ref<CardPrintings | null>(null)
const failed = ref(false)
const expanded = ref(false)

let request = 0
watch(
  () => [props.cardId, props.until] as const,
  async ([cardId, until]) => {
    const current = ++request
    expanded.value = false
    failed.value = false
    try {
      const loaded = await getPrintings(cardId, until)
      if (current === request) data.value = loaded
    } catch {
      if (current === request) {
        data.value = null
        failed.value = true
      }
    }
  },
  { immediate: true },
)

const printings = computed(() => data.value?.printings ?? [])
const visible = computed(() =>
  expanded.value ? printings.value : printings.value.slice(0, VISIBLE),
)
const summary = computed(() => {
  const total = data.value?.total ?? 0
  return props.until
    ? t('card.printingsUntil', {
        count: printings.value.length,
        date: formatLongDate(props.until, locale.value),
        total,
      })
    : t('card.printingsTotal', { total }, total)
})

// Literal class names so Tailwind can detect them.
function rarityClass(rarity: string | null) {
  const value = rarity ?? ''
  if (/Ultimate|Ultra|Gold|Ghost/.test(value)) return 'bg-yellow-600 text-gray-900'
  if (/Secret|Starlight|Collector|Prismatic/.test(value)) return 'bg-gray-200 text-gray-900'
  if (/Super/.test(value)) return 'bg-blue-300 text-gray-900'
  if (/Rare/.test(value)) return 'bg-gray-400 text-gray-900'
  return 'bg-gray-700 text-gray-200'
}
</script>

<template>
  <section
    v-if="printings.length || failed"
    class="bg-blue-800 p-2 mb-2"
    :aria-label="t('card.printings')"
    data-testid="card-printings"
  >
    <h3
      class="mb-1 flex flex-wrap justify-between gap-x-2 text-xs font-semibold uppercase tracking-wide text-gray-400"
    >
      {{ t('card.printings') }}
      <span v-if="!failed" class="font-normal normal-case tracking-normal text-gray-500">{{
        summary
      }}</span>
    </h3>
    <p v-if="failed" class="text-xs text-gray-400">{{ t('card.printingsError') }}</p>
    <table v-else class="w-full text-xs">
      <tbody>
        <tr
          v-for="printing in visible"
          :key="`${printing.set}-${printing.rarity}`"
          class="border-t border-blue-700"
        >
          <td class="py-1 pr-2 align-top whitespace-nowrap tabular-nums text-gray-400">
            {{ printing.date }}
          </td>
          <td class="py-1 pr-2 align-top">{{ printing.set }}</td>
          <td class="py-1 pr-2 align-top whitespace-nowrap font-mono text-gray-400">
            {{ printing.code }}
          </td>
          <td class="py-1 align-top text-right">
            <span
              v-if="printing.rarity"
              class="inline-block px-1.5 rounded-full text-2xs whitespace-nowrap"
              :class="rarityClass(printing.rarity)"
            >
              {{ printing.rarity }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
    <button
      v-if="!failed && printings.length > VISIBLE"
      type="button"
      class="mt-1 w-full py-1 text-xs text-blue-200 bg-black/20 duration-200 hover:bg-black/30"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? t('card.showFewer') : t('card.showAll', { count: printings.length }) }}
    </button>
  </section>
</template>

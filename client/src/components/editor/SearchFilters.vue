<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ArchetypeSelector from '@/components/form/ArchetypeSelector.vue'
import AttributeToggle from '@/components/form/AttributeToggle.vue'
import LevelToggle from '@/components/form/LevelToggle.vue'
import PointsSelector from '@/components/form/PointsSelector.vue'
import SquareCheckbox from '@/components/form/SquareCheckbox.vue'
import ToggleSwitch from '@/components/form/ToggleSwitch.vue'
import SectionHint from '@/components/help/SectionHint.vue'
import { vTooltip } from '@/directives/tooltip'
import { latestPickableDate, today, type SearchForm } from '@/services/search-form'
import type { Format, FormatId, LinkMarker } from '@/types/api'
import {
  attackDefense,
  attributes,
  checks,
  levels,
  linkValues,
  monsterTypes,
  pendulumScale,
  orderOptions,
  spellTypes,
  trapTypes,
} from '@/services/values'
import { dateLocale, formatLongDate } from '@/utils/date'

const props = defineProps<{
  archetypes: string[]
  dataEnd?: string | null
  formats?: Format[]
}>()
defineEmits<{ clear: [] }>()
const form = defineModel<SearchForm>({ required: true })
const { t, locale } = useI18n()

const noTypeSelected = computed(() => !Object.values(form.value.checks).some(Boolean))
const showMonsters = computed(
  () => form.value.checks.MONSTER || form.value.checks.EXTRA || noTypeSelected.value,
)
const showSpells = computed(() => form.value.checks.SPELL || noTypeSelected.value)
const showTraps = computed(() => form.value.checks.TRAP || noTypeSelected.value)
const maxDate = computed(() => latestPickableDate(props.dataEnd ?? null))
// Shown only while the data stops before today.
const dataEndLabel = computed(() =>
  props.dataEnd && props.dataEnd < today() ? formatLongDate(props.dataEnd, locale.value) : null,
)
const orderLabel = computed(() =>
  form.value.order.inverse ? t('help.tooltips.descending') : t('help.tooltips.ascending'),
)
const epochLabel = computed(() => formatLongDate(form.value.epoch, locale.value))

const formatOptions = computed<{ id: FormatId | null; name: string }[]>(() => [
  { id: null, name: t('formats.free') },
  ...(props.formats ?? []).map(({ id, name }) => ({ id, name })),
])
const currentFormat = computed(
  () => props.formats?.find((format) => format.id === form.value.format) ?? null,
)

// 3x3 grid of Link arrows; the middle cell is the card itself.
const markerGrid: ({ id: LinkMarker; arrow: string } | null)[] = [
  { id: 'Top-Left', arrow: '↖' },
  { id: 'Top', arrow: '↑' },
  { id: 'Top-Right', arrow: '↗' },
  { id: 'Left', arrow: '←' },
  null,
  { id: 'Right', arrow: '→' },
  { id: 'Bottom-Left', arrow: '↙' },
  { id: 'Bottom', arrow: '↓' },
  { id: 'Bottom-Right', arrow: '↘' },
]
</script>

<template>
  <div>
    <div
      v-if="formatOptions.length > 1"
      class="flex mx-4 mt-2"
      role="radiogroup"
      :aria-label="t('formats.label')"
    >
      <button
        v-for="option in formatOptions"
        :key="option.id ?? 'free'"
        type="button"
        role="radio"
        :aria-checked="form.format === option.id"
        class="flex-1 py-1.5 text-sm duration-200"
        :class="form.format === option.id ? 'bg-blue-500' : 'bg-blue-800 hover:bg-blue-700'"
        @click="form.format = option.id"
      >
        {{ option.name }}
      </button>
    </div>
    <div class="px-4 m-2 text-center flex">
      <label class="flex-1 p-2" :class="{ 'text-gray-500': currentFormat }" for="epoch">
        {{ t('edit.Time travel') }}
      </label>
      <div v-if="currentFormat" class="flex-1 p-2 border border-gray-700 text-gray-500">
        {{ t('formats.instead', { format: currentFormat.name }) }}
      </div>
      <div v-else class="flex-1 epoch-picker">
        <VueDatePicker
          v-model="form.epoch"
          dark
          auto-apply
          model-type="yyyy-MM-dd"
          :formats="{ input: 'yyyy-MM-dd' }"
          :time-config="{ enableTimePicker: false }"
          min-date="2001-01-01"
          :max-date="maxDate"
          :locale="dateLocale(locale)"
          :input-attrs="{ id: 'epoch', hideInputIcon: true }"
        />
      </div>
    </div>
    <template v-if="currentFormat">
      <SectionHint highlight data-testid="format-hint">
        <i18n-t keypath="formats.hint" scope="global">
          <template #format>
            <strong class="text-white">{{ currentFormat.name }}</strong>
          </template>
          <template #cards>{{ currentFormat.cards.toLocaleString(locale) }}</template>
        </i18n-t>
      </SectionHint>
      <ul
        class="mx-4 my-1 flex flex-wrap gap-x-3 gap-y-1 text-xs"
        :aria-label="t('formats.legend')"
      >
        <li class="flex items-center gap-1">
          <span
            class="w-4 h-4 grid place-items-center rounded-full bg-red-700 font-extrabold"
            aria-hidden="true"
            >✕</span
          >
          {{ t('formats.forbidden') }}
        </li>
        <li class="flex items-center gap-1">
          <span
            class="w-4 h-4 grid place-items-center rounded-full bg-orange-600 font-extrabold"
            aria-hidden="true"
            >1</span
          >
          {{ t('formats.limited') }}
        </li>
        <li class="flex items-center gap-1">
          <span
            class="w-4 h-4 grid place-items-center rounded-full bg-yellow-500 text-gray-900 font-extrabold"
            aria-hidden="true"
            >2</span
          >
          {{ t('formats.semiLimited') }}
        </li>
      </ul>
    </template>
    <SectionHint v-else highlight data-testid="epoch-hint">
      <i18n-t keypath="help.hints.epoch" scope="global">
        <template #date>
          <strong class="text-white">{{ epochLabel }}</strong>
        </template>
      </i18n-t>
    </SectionHint>
    <SectionHint v-if="dataEndLabel && !currentFormat" data-testid="data-end-hint">
      {{ t('help.hints.dataEnd', { date: dataEndLabel }) }}
    </SectionHint>
    <div class="flex flex-wrap items-center px-2">
      <label class="flex-1 p-2" for="order">{{ t('edit.Order') }}:</label>
      <select
        id="order"
        v-model="form.order.field"
        class="p-2 m-2 appearance-none cursor-pointer bg-blue-800"
      >
        <option
          v-for="option in orderOptions"
          :key="option.id"
          :value="option.id"
          class="bg-white text-blue-700"
        >
          {{ option.label }}
        </option>
      </select>
      <button
        v-tooltip="orderLabel"
        type="button"
        class="flex-1 p-2 m-2 bg-blue-800 duration-200 hover:bg-blue-700"
        :aria-label="orderLabel"
        @click="form.order.inverse = !form.order.inverse"
      >
        <FontAwesomeIcon :icon="form.order.inverse ? 'chevron-circle-down' : 'chevron-circle-up'" />
      </button>
    </div>
    <button
      type="button"
      class="flex w-[calc(100%-2rem)] mx-4 my-2 bg-blue-800 text-center items-center text-white uppercase shadow-lg duration-200 hover:bg-blue-700"
      @click="$emit('clear')"
    >
      <span class="mx-auto">{{ t('edit.Clear filters') }}</span>
      <FontAwesomeIcon icon="eraser" class="mx-auto ml-2 !h-8" />
    </button>
    <div class="my-1 flex flex-wrap">
      <ToggleSwitch
        v-for="check in checks"
        :id="`check-${check.id}`"
        :key="check.id"
        v-model="form.checks[check.id]"
        :color="check.color"
        class="mx-auto"
      >
        {{ check.label }}
      </ToggleSwitch>
    </div>
    <div class="px-4 my-2 flex items-center">
      <input
        v-model="form.search"
        class="w-full p-2 text-white bg-blue-800"
        type="search"
        :aria-label="t('edit.Search name or description')"
        :placeholder="t('edit.Search name or description')"
      />
    </div>
    <SectionHint>{{ t('help.hints.filters', { tab: t('edit.Result') }) }}</SectionHint>

    <div v-show="showMonsters">
      <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
        <h3 class="w-11/12 text-white">{{ t('edit.Monsters') }} / {{ t('edit.Extra') }}</h3>
      </div>
      <div class="p-2 flex items-center">
        <AttributeToggle
          v-for="attribute in attributes"
          :id="attribute.id"
          :key="attribute.id"
          v-model="form.attributes[attribute.id]"
          :label="attribute.label"
          :image="attribute.image"
          class="mx-auto w-10 h-10"
        />
      </div>
      <div class="p-2 flex items-center">
        <LevelToggle
          v-for="level in levels"
          :id="level.id"
          :key="level.id"
          v-model="form.levels[level.value]"
          :label="level.label"
          :images="level.images"
          class="w-1/12 px-1 mx-auto"
        />
      </div>
      <div class="py-1 px-4 flex items-center">
        <PointsSelector
          v-model="form.attack"
          label="ATK"
          :min="attackDefense.min"
          :max="attackDefense.max"
        />
      </div>
      <div class="py-1 px-4 pb-2 flex items-center">
        <PointsSelector
          v-model="form.defense"
          label="DEF"
          :min="attackDefense.min"
          :max="attackDefense.max"
        />
      </div>
      <div
        class="px-4 py-1 flex flex-wrap items-center gap-1"
        role="group"
        :aria-label="t('filters.linkValue')"
      >
        <span class="w-28 text-sm" aria-hidden="true">{{ t('filters.linkValue') }}</span>
        <button
          v-for="value in linkValues"
          :key="value"
          type="button"
          class="min-w-8 h-8 px-2 font-bold text-sm duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          :class="form.linkValues[value] ? 'bg-blue-500' : 'bg-blue-800 hover:bg-blue-700'"
          :aria-pressed="form.linkValues[value]"
          @click="form.linkValues[value] = !form.linkValues[value]"
        >
          {{ value }}
        </button>
      </div>
      <div class="px-4 py-1 flex items-center gap-3">
        <span class="w-28 text-sm">{{ t('filters.linkMarkers') }}</span>
        <div class="grid grid-cols-3 gap-0.5" role="group" :aria-label="t('filters.linkMarkers')">
          <template v-for="(cell, index) in markerGrid" :key="cell?.id ?? index">
            <span v-if="!cell" aria-hidden="true" />
            <button
              v-else
              v-tooltip="t(`filters.markers.${cell.id}`)"
              type="button"
              class="w-7 h-7 text-sm duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              :class="form.linkMarkers[cell.id] ? 'bg-red-600' : 'bg-blue-800 hover:bg-blue-700'"
              :aria-label="t(`filters.markers.${cell.id}`)"
              :aria-pressed="form.linkMarkers[cell.id]"
              @click="form.linkMarkers[cell.id] = !form.linkMarkers[cell.id]"
            >
              <span aria-hidden="true">{{ cell.arrow }}</span>
            </button>
          </template>
        </div>
        <span class="flex-1 text-xs text-gray-400">{{ t('filters.anyMarker') }}</span>
      </div>
      <div class="py-1 px-4 pb-2 flex items-center">
        <PointsSelector
          v-model="form.scale"
          :label="t('filters.scale')"
          :min="pendulumScale.min"
          :max="pendulumScale.max"
          :step="1"
        />
      </div>
      <div class="p-2 flex flex-wrap items-center">
        <SquareCheckbox
          v-for="monsterType in monsterTypes"
          :id="monsterType.id"
          :key="monsterType.id"
          v-model="form.monsterTypes[monsterType.id]"
          class="w-1/2 my-1"
        >
          <img
            v-if="monsterType.image"
            :src="monsterType.image"
            :alt="monsterType.name"
            class="w-4 h-4 ml-1"
          />
          <span class="ml-1">{{ monsterType.name }}</span>
        </SquareCheckbox>
      </div>
      <div class="flex items-center">
        <ArchetypeSelector v-model="form.archetypes" :archetypes="archetypes" />
      </div>
    </div>
    <div v-show="showSpells">
      <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
        <h3 class="w-11/12 text-white">{{ t('edit.Spells') }}</h3>
      </div>
      <div class="p-2 flex flex-wrap items-center">
        <ToggleSwitch
          v-for="family in spellTypes"
          :id="`spells-${family.id}`"
          :key="family.id"
          v-model="form.spellFamilies[family.id]"
          color="green"
          class="mx-auto my-1"
        >
          {{ family.label }}
        </ToggleSwitch>
      </div>
    </div>
    <div v-show="showTraps">
      <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
        <h3 class="w-11/12 text-white">{{ t('edit.Traps') }}</h3>
      </div>
      <div class="p-2 flex flex-wrap items-center">
        <ToggleSwitch
          v-for="family in trapTypes"
          :id="`traps-${family.id}`"
          :key="family.id"
          v-model="form.trapFamilies[family.id]"
          color="pink"
          class="mx-auto my-1"
        >
          {{ family.label }}
        </ToggleSwitch>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Match the original date picker: transparent field with a light border. */
.epoch-picker :deep(.dp--theme-dark) {
  --dp-background-color: transparent;
  --dp-border-color: var(--color-gray-500);
  --dp-border-color-hover: var(--color-gray-300);
  --dp-text-color: var(--color-gray-400);
  --dp-menu-border-color: var(--color-gray-700);
}

.epoch-picker :deep(.dp--menu) {
  --dp-background-color: var(--color-gray-900);
  /* Days after the end of the data: dimmed and struck through, as in the mockups. */
  --dp-secondary-color: var(--color-gray-600);
}

.epoch-picker :deep(.dp--cell-disabled) {
  text-decoration: line-through;
}
</style>

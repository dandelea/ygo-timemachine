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
import { today, type SearchForm } from '@/services/search-form'
import {
  attackDefense,
  attributes,
  checks,
  levels,
  monsterTypes,
  orderOptions,
  spellTypes,
  trapTypes,
} from '@/services/values'
import { dateLocale } from '@/utils/date'

defineProps<{ archetypes: string[] }>()
defineEmits<{ clear: [] }>()
const form = defineModel<SearchForm>({ required: true })
const { t, locale } = useI18n()

const noTypeSelected = computed(() => !Object.values(form.value.checks).some(Boolean))
const showMonsters = computed(
  () => form.value.checks.MONSTER || form.value.checks.EXTRA || noTypeSelected.value,
)
const showSpells = computed(() => form.value.checks.SPELL || noTypeSelected.value)
const showTraps = computed(() => form.value.checks.TRAP || noTypeSelected.value)
const maxDate = today()
</script>

<template>
  <div>
    <div class="px-4 m-2 text-center flex">
      <label class="flex-1 p-2" for="epoch">{{ t('edit.Time travel') }}</label>
      <div class="flex-1 epoch-picker">
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
        type="button"
        class="flex-1 p-2 m-2 bg-blue-800 duration-200 hover:bg-blue-700"
        :title="form.order.inverse ? 'DESC' : 'ASC'"
        @click="form.order.inverse = !form.order.inverse"
      >
        <FontAwesomeIcon :icon="form.order.inverse ? 'chevron-circle-down' : 'chevron-circle-up'" />
      </button>
    </div>
    <button
      type="button"
      class="flex w-[calc(100%-2rem)] mx-4 my-2 bg-blue-800 text-center items-center text-white uppercase shadow-lg duration-200 hover:bg-blue-700"
      :title="t('edit.Clear filters')"
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
}
</style>

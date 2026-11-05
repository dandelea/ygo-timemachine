<script setup lang="ts">
import { computed } from 'vue'
import type { EditableDeck } from '@/services/deck'
import { deckStats, MAX_LEVEL } from '@/services/deck-stats'
import { attributes as attributeOptions } from '@/services/values'

const props = defineProps<{ deck: Pick<EditableDeck, 'main' | 'extra'> }>()
const stats = computed(() => deckStats(props.deck))
const total = computed(() => stats.value.main + stats.value.extra)

// Literal class names so Tailwind can detect them.
const segments = computed(() => [
  { key: 'monsters', count: stats.value.composition.monsters, color: 'bg-orange-500' },
  { key: 'spells', count: stats.value.composition.spells, color: 'bg-green-600' },
  { key: 'traps', count: stats.value.composition.traps, color: 'bg-pink-600' },
  { key: 'extra', count: stats.value.extra, color: 'bg-purple-600' },
])

const attributeInfo = Object.fromEntries(attributeOptions.map((option) => [option.id, option]))
const maxAttribute = computed(() => Math.max(1, ...stats.value.attributes.map((a) => a.count)))
const maxLevel = computed(() => Math.max(1, ...stats.value.levels))
const maxArchetype = computed(() => Math.max(1, ...stats.value.archetypes.map((a) => a.count)))
const percent = (value: number, max: number) => `${(value / max) * 100}%`
</script>

<template>
  <div class="p-1 flex flex-col gap-4" data-testid="deck-stats">
    <p v-if="!total" class="p-4 text-center text-sm text-gray-400">{{ $t('stats.empty') }}</p>
    <template v-else>
      <section :aria-label="$t('stats.composition')">
        <h3
          class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          {{ $t('stats.composition') }}
          <span class="font-normal normal-case tracking-normal text-gray-500">
            {{ $t('stats.sizes', { main: stats.main, extra: stats.extra }) }}
          </span>
        </h3>
        <div class="flex h-6 text-xs font-semibold" aria-hidden="true">
          <template v-for="segment in segments" :key="segment.key">
            <div
              v-if="segment.count"
              class="grid place-items-center"
              :class="segment.color"
              :style="{ width: percent(segment.count, total) }"
            >
              {{ segment.count }}
            </div>
          </template>
        </div>
        <ul class="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
          <li v-for="segment in segments" :key="segment.key" class="flex items-center gap-1">
            <span class="inline-block w-2.5 h-2.5" :class="segment.color" aria-hidden="true" />
            {{ $t(`stats.kinds.${segment.key}`) }}: {{ segment.count }}
          </li>
        </ul>
      </section>

      <section v-if="stats.attributes.length" :aria-label="$t('stats.attributes')">
        <h3
          class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          {{ $t('stats.attributes') }}
          <span class="font-normal normal-case tracking-normal text-gray-500">
            {{ $t('stats.monsters', { count: stats.monsters }, stats.monsters) }}
          </span>
        </h3>
        <ul class="flex flex-col gap-1">
          <li
            v-for="attribute in stats.attributes"
            :key="attribute.id"
            class="grid grid-cols-[6rem_1fr_1.5rem] items-center gap-2 text-xs"
          >
            <span class="flex items-center gap-1">
              <img
                v-if="attributeInfo[attribute.id]"
                :src="attributeInfo[attribute.id]!.image"
                alt=""
                class="w-4 h-4"
              />
              {{ attributeInfo[attribute.id]?.label ?? attribute.id }}
            </span>
            <span class="relative h-2.5 bg-blue-800" aria-hidden="true">
              <span
                class="absolute inset-y-0 left-0 bg-blue-500"
                :style="{ width: percent(attribute.count, maxAttribute) }"
              />
            </span>
            <span class="text-right font-semibold tabular-nums">{{ attribute.count }}</span>
          </li>
        </ul>
      </section>

      <section v-if="stats.levels.some(Boolean)" :aria-label="$t('stats.levels')">
        <h3 class="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
          {{ $t('stats.levels') }}
        </h3>
        <ol class="grid grid-cols-12 items-end gap-1 h-16">
          <li
            v-for="level in MAX_LEVEL"
            :key="level"
            class="relative min-h-0.5"
            :class="stats.levels[level - 1] ? 'bg-blue-500' : 'bg-blue-800'"
            :style="{ height: percent(stats.levels[level - 1] ?? 0, maxLevel) }"
            :aria-label="$t('stats.levelCount', { level, count: stats.levels[level - 1] })"
          >
            <span
              v-if="stats.levels[level - 1]"
              class="absolute -top-4 inset-x-0 text-center text-2xs"
              aria-hidden="true"
              >{{ stats.levels[level - 1] }}</span
            >
          </li>
        </ol>
        <div
          class="mt-1 grid grid-cols-12 gap-1 text-center text-2xs text-gray-500"
          aria-hidden="true"
        >
          <span v-for="level in MAX_LEVEL" :key="level">{{ level }}</span>
        </div>
      </section>

      <section v-if="stats.archetypes.length" :aria-label="$t('stats.archetypes')">
        <h3
          class="mb-1 flex justify-between text-xs font-semibold uppercase tracking-wide text-gray-400"
        >
          {{ $t('stats.archetypes') }}
          <span class="font-normal normal-case tracking-normal text-gray-500">
            {{ $t('stats.topArchetypes') }}
          </span>
        </h3>
        <ul class="flex flex-col gap-1">
          <li
            v-for="archetype in stats.archetypes"
            :key="archetype.name"
            class="grid grid-cols-[6rem_1fr_1.5rem] items-center gap-2 text-xs"
          >
            <span class="truncate" :title="archetype.name">{{ archetype.name }}</span>
            <span class="relative h-2.5 bg-blue-800" aria-hidden="true">
              <span
                class="absolute inset-y-0 left-0 bg-blue-500"
                :style="{ width: percent(archetype.count, maxArchetype) }"
              />
            </span>
            <span class="text-right font-semibold tabular-nums">{{ archetype.count }}</span>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

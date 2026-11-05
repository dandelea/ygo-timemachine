<script setup lang="ts">
import { MAIN_DECK_MIN } from '@/services/deck'
import { DECK_LIMITS } from '@/types/api'

const limits = { min: MAIN_DECK_MIN, max: DECK_LIMITS.main, copies: DECK_LIMITS.copies }
</script>

<template>
  <section
    class="m-4 p-4 bg-black/20 border-l-4 border-orange-400"
    aria-labelledby="home-intro-title"
    data-testid="home-intro"
  >
    <h2 id="home-intro-title" class="text-lg font-semibold">{{ $t('help.intro.title') }}</h2>
    <p class="mt-1 text-gray-300">{{ $t('help.intro.body') }}</p>
    <ol class="mt-3 grid gap-2 sm:grid-cols-3">
      <li class="p-3 bg-blue-800 text-sm">
        <span class="block text-xs font-semibold uppercase tracking-wide text-orange-400">
          1 · {{ $t('help.intro.steps.travel.title') }}
        </span>
        {{ $t('help.intro.steps.travel.text') }}
      </li>
      <li class="p-3 bg-blue-800 text-sm">
        <span class="block text-xs font-semibold uppercase tracking-wide text-orange-400">
          2 · {{ $t('help.intro.steps.search.title') }}
        </span>
        {{ $t('help.intro.steps.search.text') }}
      </li>
      <li class="p-3 bg-blue-800 text-sm">
        <span class="block text-xs font-semibold uppercase tracking-wide text-orange-400">
          3 · {{ $t('help.intro.steps.build.title') }}
        </span>
        {{ $t('help.intro.steps.build.text', limits) }}
      </li>
    </ol>
  </section>
</template>

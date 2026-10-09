<template>
  <div class="mx-auto max-w-md rounded-lg overflow-hidden shadow-lg bg-white m-4">
    <div class="flex flex-col min-h-full">
      <div class="px-6 py-10">
        <p class="text-base text-center text-gray-800 font-bold">
          <a href="http://danieldelosreyesleal.com"
            >{{ $t('credits.Made by') }} © Daniel de los Reyes - 2020</a
          >
        </p>

        <p class="text-base text-gray-800 my-4 text-justify font-thin">
          {{ $t('credits.Powered by') }}
          <a href="https://ygoprodeck.com/" class="text-orange-600">YGOPRODeck.com</a>
        </p>

        <i18n-t
          keypath="credits.legal.general"
          tag="p"
          class="text-base text-gray-800 my-4 text-justify font-thin"
        >
          <template #game><strong>Yu-Gi-Oh!</strong></template>
          <template #owner><strong>4K Media Inc</strong></template>
          <template #parent><strong>Konami Digital Entertainment, Inc</strong></template>
          <template #disclaimer>
            <strong>{{ $t('credits.legal.disclaimer') }}</strong>
          </template>
        </i18n-t>
      </div>
      <div class="px-6">
        <div class="py-4 flex justify-end">
          <a
            href="http://danieldelosreyesleal.com"
            class="text-sm text-gray-700 font-medium px-4 py-1 bg-gray-100"
          >
            {{ $t('credits.Visit') }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

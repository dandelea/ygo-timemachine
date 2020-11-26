<template>
  <div class="mx-auto max-w-md rounded-lg overflow-hidden shadow-lg bg-white m-4">
    <div class="flex flex-col min-h-full">
      <div class="px-6 py-10 flex-grow">
        <p class="text-base text-center text-gray-800 font-bold">
          <a href="http://danieldelosreyesleal.com">{{$t('credits.Made by')}} © Daniel de los Reyes - 2020</a>
        </p>
        
        <p class="text-base text-center text-gray-800 my-4 text-justify font-thin">
          {{$t('credits.Powered by')}} <a href="https://ygoprodeck.com/" class="text-orange-600">YGOPRODeck.com</a>
        </p>
        
        <i18n path="credits.legal.general" tag="p" class="text-base text-center text-gray-800 my-4 text-justify font-thin">
          <template v-slot:0>
            <strong>Yu-Gi-Oh!</strong>
          </template>
          <template v-slot:1>
            <strong>4K Media Inc</strong>
          </template>
          <template v-slot:2>
            <strong>Konami Digital Entertainment, Inc</strong>
          </template>
          <template v-slot:3>
            <strong>{{$t('credits.legal.3')}}</strong>
          </template>
        </i18n>
      </div>
      <div class="px-6">
        <div class="border-t py-4 flex justify-end">
          <a href="http://danieldelosreyesleal.com" class="text-sm text-gray-700 font-medium border px-4 py-1 bg-gray-100 border-gray-400 rounded">
            {{$t('credits.Visit')}}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'credits',
  metaInfo: {
    title: 'YuGiOh! TimeMachine - Credits'
  },
}
</script>
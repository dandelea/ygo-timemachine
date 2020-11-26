<template>
  <section class="flex flex-wrap">
    <router-link
      to="/decks/new"
      :title="$t('decks.New deck')"
      class="w-full m-4 p-4 text-center bg-blue-800 duration-200 hover:bg-blue-700 cursor-pointer"
    >
      <font-awesome-icon icon="plus" size="2x" />
    </router-link>
    <div v-for="deck in decks" :key="deck.id" class="w-1/6 mx-4 my-2">
      <div
        class="w-full relative text-center py-8"
        :style="`background-image: linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.7)), url('${
          deck.cards.length ? deck.cards[0].images[0].image : null
        }'); background-repeat: no-repeat; background-size: cover;`"
      >
        <router-link
          :to="`/decks/${deck.id}`"
          :class="`absolute w-full h-full bg-${deck.color} bg-opacity-50 top-0 left-0`"
        ></router-link>
        <router-link
          :to="`/decks/${deck.id}`"
          class="relative w-full text-lg font-bold m-4"
        >
          {{ deck.name }}
        </router-link>
      </div>
    </div>
  </section>
</template>
<script>
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
library.add(faPlus);
import { getDecks } from "@/services/client";
export default {
  name: "Decks",
  metaInfo: {
    title: "YuGiOh! TimeMachine - Decks",
  },
  components: {
    FontAwesomeIcon,
  },
  data: function () {
    return {
      decks: [],
    };
  },
  mounted: function () {
    getDecks().then((decks) => {
      this.decks = decks;
    });
  },
};
</script>
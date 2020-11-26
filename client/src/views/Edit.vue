<template>
  <div class="flex flex-col md:flex-row md:max-h-body">
    <!-- Current -->
    <div id="current" class="w-full md:w-1/3 md:overflow-y-auto">
      <div class="p-2 flex flex-row md:flex-col w-full">
        <div v-if="current" class="flex">
          <button
            @click="current_image_showing > 0 ? current_image_showing-- : null"
            :class="{
              invisible: current_image_showing <= 0,
            }"
            class="flex-shrink p-2 bg-blue-800 duration-200 hover:bg-blue-700"
            :title="$t('edit.Previous image')"
          >
            <font-awesome-icon icon="chevron-left" />
          </button>
          <img
            class="ml-4 w-32 md:w-64 md:mx-auto"
            v-for="(image, i) in current.images"
            :class="{
              hidden: i !== current_image_showing,
            }"
            :key="image.id"
            :src="image.image"
            :alt="current.name"
            :title="current.name"
          />
          <button
            @click="
              current_image_showing < current.images.length - 1
                ? current_image_showing++
                : null
            "
            class="flex-shrink p-2 bg-blue-800 duration-200 hover:bg-blue-700"
            :class="{
              invisible: current_image_showing >= current.images.length - 1,
            }"
            :title="$t('edit.Next image')"
          >
            <font-awesome-icon icon="chevron-right" />
          </button>
        </div>
        <img
          v-if="!current"
          class="ml-4 w-32 md:w-64 md:mx-auto"
          :src="images.card"
          alt="No card"
          :title="$t('edit.No card')"
        />
        <div class="px-6 py-4" v-if="current">
          <div
            class="bg-blue-800 p-2 text-center text-sm md:text-md lg:text-lg mb-2 flex flex-wrap"
            v-if="current"
          >
            <h1 class="w-full font-bold">{{ current.name }}</h1>
            <span
              class="mx-auto p-1 text-sm flex flex-row items-center text-center"
              v-if="current.level"
            >
              <span class="mr-1">{{ current.level }}</span>
              <img
                class="w-5 h-5"
                alt="Level"
                :title="`${$t('edit.Level')} ${current.level}`"
                :src="images.star"
              />
            </span>
            <span
              class="mx-auto p-1 text-sm flex flex-row items-center text-center"
              v-if="current.attribute"
            >
              <span class="mr-1">{{ current.attribute }}</span>
              <img
                class="w-5 h-5"
                alt="Level"
                :title="`${$t('edit.Attribute')} ${current.attribute}`"
                :src="images.attributes[current.attribute]"
              />
            </span>
            <span
              class="w-full p-1 text-sm items-center text-center italic"
              v-if="current.first_release"
            >
              {{$t('edit.First release')}}: {{ current.first_release | date }}
            </span>
          </div>
          <div class="bg-blue-800 p-2 mb-2 text-justify">
            <p class="text-grey-darker text-xs text-green-400 font-bold">
              [{{ current.race }}]
            </p>
            <p
              class="text-grey-darker text-xs"
              :class="{
                italic: current.subtype === 'Normal Monster',
              }"
            >
              {{ current.description }}
            </p>
          </div>
          <div
            class="bg-blue-800 p-2 text-center"
            v-if="current.atk !== null || current.def !== null"
          >
            <div class="w-full flex flex-wrap text-sm">
              <span class="flex-1" v-if="current.atk !== null"
                >ATK {{ current.atk }}</span
              >
              <span class="flex-1" v-if="current.def !== null"
                >DEF {{ current.def }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div id="history" class="hidden md:block" v-if="history.length">
        <div class="py-2 pl-6 bg-blue-800 w-full h-10 flex items-center">
          <h1 class="flex-1 text-sm text-white">{{$t('edit.Card history')}}</h1>
          <span
            @click="clearHistory()"
            class="w-10 h-10 flex items-center text-white cursor-pointer bg-red-500 duration-200 hover:bg-red-600 shadow-lg"
            :title="$t('edit.Clear history')"
          >
            <font-awesome-icon :icon="['far', 'trash-alt']" class="mx-auto" />
          </span>
        </div>
        <div class="flex flex-wrap md:max-h-history md:overflow-y-auto">
          <div
            class="w-12 bg-blue-900 h-16 mx-1 my-1 cursor-pointer"
            v-for="card in history"
            :key="card.id"
            @click="selectCard(card)"
            :style="`background-image: url('${card.images[0].image_small}'); background-repeat: no-repeat; background-size: cover`"
            :title="card.name"
          ></div>
        </div>
      </div>
    </div>
    <!-- Second column -->
    <div class="px-2 w-full md:w-1/3">
      <!-- Deck -->
      <div id="deck">
        <div>
          <div class="flex">
            <router-link
              to="/"
              class="w-10 h-10 flex items-center bg-blue-800 duration-200 hover:bg-blue-700"
              :title="$t('edit.Back')"
            >
              <font-awesome-icon icon="arrow-left" class="mx-auto" />
            </router-link>
            <input
              class="flex-1 p-2 text-white bg-blue-800"
              type="search"
              :placeholder="$t('edit.Deck name')"
              v-model="deck.name"
            />
            <color-selector v-model="deck.color" :title="$t('edit.Change color')" />
            <button
              @click="saveDeck"
              class="w-10 h-10 bg-blue-800 duration-200 hover:bg-blue-700"
              :disabled="!deck.name"
              :class="{
                'cursor-not-allowed': !deck.name,
              }"
            >
              <font-awesome-icon icon="save" />
            </button>
          </div>
          <div class="flex relative">
            <div class="flex-1 flex items-center">
              <div class="flex-1 text-center">{{$t('edit.Main deck')}}:</div>
              <div class="w-10 h-10 flex items-center bg-blue-800">
                <span class="mx-auto">{{ deck.main.length }}</span>
              </div>
            </div>
            <div class="flex-1 flex items-center">
              <div class="flex-1 text-center">{{$t('edit.Extra deck')}}:</div>
              <div class="w-10 h-10 flex items-center bg-blue-800">
                <span class="mx-auto">{{ deck.extra.length }}</span>
              </div>
            </div>
            <div
              :title="$t('edit.Clear deck')"
              class="w-10 h-10 flex items-center text-white cursor-pointer bg-red-500 duration-200 hover:bg-red-600 shadow-lg"
              @click="clearDeck()"
            >
              <font-awesome-icon :icon="['far', 'trash-alt']" class="mx-auto" />
            </div>
          </div>
        </div>
        <drop
          @dragover="handleDragover('adding', ...arguments)"
          @drop="handleDrop"
        >
          <div
            class="flex flex-wrap transition-colors duration-500 rounded max-h-1/2 overflow-y-auto"
            :class="{
              'bg-gray-900': dragging && dragging.group === 'adding',
            }"
          >
            <drag
              :transfer-data="{ group: 'removing', card: deck_main[j] }"
              @dragstart="dragging = { group: 'removing', card: deck_main[j] }"
              @dragend="dragging = null"
              class="w-12 bg-pink h-18 m-1/2 mx-auto flex items-center"
              :class="{
                'cursor-pointer': deck_main[j],
              }"
              v-for="(i, j) in deckSize(deck_main)"
              :key="`main-deck-${j}`"
              v-on:click.native="deck_main[j] ? selectCard(deck_main[j]) : null"
              :style="`background-image: url('${
                deck_main[j] ? deck_main[j].images[0].image_small : images.card
              }'); background-repeat: no-repeat; background-size: cover;`"
              :title="deck_main[j] ? deck_main[j].name : null"
            >
              <span class="mx-auto">{{ i }}</span>
            </drag>
          </div>
          <div
            class="flex flex-wrap mt-4 transition-colors duration-500 rounded"
            :class="{
              'bg-gray-900': dragging && dragging.group === 'adding',
            }"
          >
            <drag
              :transfer-data="{ group: 'removing', card: deck_extra[j] }"
              @dragstart="dragging = { group: 'removing', card: deck_extra[j] }"
              @dragend="dragging = null"
              class="w-12 bg-pink h-18 m-1/2 mx-auto flex items-center"
              :class="{
                'cursor-pointer': deck_extra[j],
              }"
              v-for="(i, j) in 15"
              :key="`extra-deck-${j}`"
              v-on:click.native="
                deck_extra[j] ? selectCard(deck_extra[j]) : null
              "
              :style="`background-image: url('${
                deck_extra[j]
                  ? deck_extra[j].images[0].image_small
                  : images.card
              }'); background-repeat: no-repeat; background-size: cover;`"
              :title="deck_extra[j] ? deck_extra[j].name : null"
            >
              <span class="mx-auto">{{ i }}</span>
            </drag>
          </div>
        </drop>
      </div>
    </div>
    <!-- Third column -->
    <div class="w-full md:w-1/3 flex flex-col md:overflow-y-auto">
      <!-- Tabs -->
      <ul class="flex">
        <li class="flex-1">
          <a
            @click="activeTab = 'form'"
            class="text-center block py-2 px-4 uppercase duration-200"
            :class="{
              'border-blue-500 bg-blue-500 text-white hover:bg-blue-700':
                activeTab === 'form',
              'border-white hover:border-gray-200 text-white bg-blue-800 hover:bg-blue-700':
                activeTab !== 'form',
            }"
            href="#"
          >
            {{$t('edit.Search')}}
          </a>
        </li>
        <li class="flex-1">
          <a
            @click="activeTab = 'cards'"
            class="text-center block py-2 px-4 uppercase duration-200"
            :class="{
              'border-blue-500 bg-blue-500 text-white hover:bg-blue-700':
                activeTab === 'cards',
              'border-white hover:border-gray-200 text-white bg-blue-800 hover:bg-blue-700':
                activeTab !== 'cards',
            }"
            href="#"
          >
            {{$t('edit.Result')}}
          </a>
        </li>
      </ul>
      <!-- Search results -->
      <div id="list" v-if="stats && cards && activeTab === 'cards'">
        <div class="p-2 bg-blue-800 text-center mb-2 text-sm md:text-base">
          {{$t('edit.Showing {0} of {1} results', [ Math.min(stats.pageSize, cards.total), stats.cards ])}}
        </div>
        <drop
          @dragover="handleDragover('removing', ...arguments)"
          @drop="handleDrop"
          class="flex flex-wrap transition-colors duration-500 rounded"
          :class="{
            'bg-gray-900': dragging && dragging.group === 'removing',
          }"
        >
          <drag
            :transfer-data="{ group: 'adding', card }"
            @dragstart="dragging = { group: 'adding', card }"
            @dragend="dragging = null"
            class="w-16 bg-blue-900 h-24 m-1/2 mx-auto cursor-pointer"
            v-for="card in cards.data"
            :key="`search-results-${card.id}`"
            v-on:click.native="selectCard(card)"
            :style="`background-image: url('${card.images[0].image_small}'); background-repeat: no-repeat; background-size: cover`"
            :title="card.name"
          ></drag>
        </drop>
      </div>
      <!-- Filters -->
      <div id="filters" v-if="activeTab === 'form'">
        <div class="px-4 m-2 text-center flex">
          <span class="flex-1 p-2">{{$t('edit.Time travel')}}</span>
          <vue-ctk-date-time-picker
            v-model="form.epoch"
            class="flex-1"
            format="YYYY-MM-DD"
            formatted="YYYY-MM-DD"
            disable-time
            onlyDate
            noKeyboard
            dark
            noLabel
            minDate="2001-01-01"
            :maxDate="now"
          />
        </div>
        <div class="flex flex-wrap items-center px-2">
          <label class="flex-1 p-2" for="order">{{$t('edit.Order')}}:</label>
          <select
            id="order"
            v-model="form.order.field"
            class="flex-grow p-2 m-2 appearance-none cursor-pointer bg-blue-800"
          >
            <option
              :value="option.id"
              v-for="option in form.order.options"
              :key="option.id"
              class="bg-white text-blue-700"
            >
              {{ option.label }}
            </option>
          </select>
          <button
            class="flex-1 p-2 m-2 bg-blue-800 duration-200 hover:bg-blue-700"
            @click="form.order.inverse = !form.order.inverse"
            :title="form.order.inverse ? 'DESC' : 'ASC'"
          >
            <font-awesome-icon
              :icon="
                form.order.inverse ? 'chevron-circle-down' : 'chevron-circle-up'
              "
            />
          </button>
        </div>
        <div
          class="flex mx-4 my-2 bg-blue-800 text-center items-center text-white uppercase shadow-lg cursor-pointer duration-200 hover:bg-blue-700"
          @click="clearFilters"
          :title="$t('edit.Clear filters')"
        >
          <span class="mx-auto">{{$t('edit.Clear filters')}}</span>
          <font-awesome-icon icon="eraser" class="mx-auto ml-2 h-8" />
        </div>
        <div id="checks" class="my-1 flex flex-wrap">
          <checkbox-lg
            :id="check.id"
            v-model="form.checks[check.id]"
            v-for="check in parameters.checks"
            :key="`checks-${check.id}`"
            :color="check.color"
            class="mx-auto"
          >
            {{ check.label }}
          </checkbox-lg>
        </div>
        <div id="search" class="px-4 my-2 flex items-center">
          <input
            class="w-full p-2 text-white bg-blue-800"
            type="search"
            :placeholder="$t('edit.Search name or description')"
            v-model="form.search"
          />
        </div>

        <div
          v-show="
            form.checks.MONSTER ||
            form.checks.EXTRA ||
            !Object.values(form.checks).filter((v) => v).length
          "
        >
          <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
            <h1 class="w-11/12 text-white">{{$t('edit.Monsters')}} / {{$t('edit.Extra')}}</h1>
          </div>
          <div>
            <div id="attribute" class="p-2 flex items-center" v-if="parameters">
              <attribute-checkbox
                v-model="form.attributes[attribute.id]"
                :id="attribute.id"
                :label="attribute.label"
                :image="attribute.image"
                :value="form.attributes[attribute.id]"
                class="mx-auto w-10 h-10"
                v-for="attribute in parameters.attributes"
                :key="attribute.id"
              />
            </div>
            <div id="levels" class="p-2 flex items-center" v-if="parameters">
              <star-checkbox
                v-model="form.levels[level.value]"
                :id="level.id"
                :label="level.label"
                :images="[level.images.active, level.images.inactive]"
                :value="form.levels[level.id]"
                class="w-1/12 px-1 mx-auto"
                v-for="level in parameters.levels"
                :key="level.id"
              />
            </div>
            <div
              id="attack"
              class="py-1 px-4 flex items-center"
              v-if="parameters"
            >
              <points-selector
                label="ATK"
                v-model="form.attack"
                :min="parameters.attackDefense.min"
                :max="parameters.attackDefense.max"
              />
            </div>
            <div
              id="defense"
              class="py-1 px-4 pb-2 flex items-center"
              v-if="parameters"
            >
              <points-selector
                label="DEF"
                v-model="form.defense"
                :min="parameters.attackDefense.min"
                :max="parameters.attackDefense.max"
              />
            </div>
            <div
              id="types"
              class="p-2 flex flex-wrap items-center"
              v-if="parameters"
            >
              <checkbox
                :id="monsterType.id"
                :label="monsterType.name"
                :value="form.monsterTypes[monsterType.id]"
                v-for="monsterType in parameters.monsterTypes"
                :key="monsterType.id"
                v-model="form.monsterTypes[monsterType.id]"
                class="w-1/2 my-1"
              >
                <img
                  :src="monsterType.image"
                  :alt="monsterType.name"
                  class="w-4 h-4 ml-1"
                  v-if="monsterType.image"
                />
                <span class="ml-1">{{ monsterType.name }}</span>
              </checkbox>
            </div>
            <div id="archetypes" class="flex items-center" v-if="parameters">
              <archetype-selector
                :archetypes="archetypes"
                :values="form.archetypes"
                v-model="form.archetypes"
              />
            </div>
          </div>
        </div>
        <div
          v-show="
            form.checks.SPELL ||
            !Object.values(form.checks).filter((v) => v).length
          "
        >
          <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
            <h1 class="w-11/12 text-white">{{$t('edit.Spells')}}</h1>
          </div>
          <div>
            <div
              id="spell-family"
              class="p-2 flex flex-wrap items-center"
              v-if="parameters"
            >
              <checkbox-lg
                :id="`spells-${family.id}`"
                v-model="form.spellFamilies[family.id]"
                v-for="family in parameters.spellTypes"
                :key="`spells-${family.id}`"
                color="green"
                class="mx-auto my-1"
              >
                {{ family.label }}
              </checkbox-lg>
            </div>
          </div>
        </div>
        <div
          v-show="
            form.checks.TRAP ||
            !Object.values(form.checks).filter((v) => v).length
          "
        >
          <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
            <h1 class="w-11/12 text-white">{{$t('edit.Traps')}}</h1>
          </div>
          <div>
            <div
              id="trap-family"
              class="p-2 flex flex-wrap items-center"
              v-if="parameters"
            >
              <checkbox-lg
                :id="`traps-${family.id}`"
                v-model="form.trapFamilies[family.id]"
                v-for="family in parameters.trapTypes"
                :key="`traps-${family.id}`"
                color="pink"
                class="mx-auto my-1"
              >
                {{ family.label }}
              </checkbox-lg>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import checkbox from "@/components/form/checkbox";
import checkboxLg from "@/components/form/checkbox-lg";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faSearch,
  faChevronCircleUp,
  faChevronCircleDown,
  faChevronLeft,
  faChevronRight,
  faEraser,
  faArrowLeft,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import { faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import "@/assets/css/custom.css";

import attributeCheckbox from "@/components/form/attribute-checkbox";
import starCheckbox from "@/components/form/star-checkbox";

import pointsSelector from "@/components/form/points-selector";
import archetypeSelector from "@/components/form/archetype-selector";

import colorSelector from "@/components/form/color-selector";

import card_image from "@/assets/img/card.jpg";
import star_image from "@/assets/img/levels/level.svg";

import VueCtkDateTimePicker from "vue-ctk-date-time-picker";
import "vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css";

import { Drag, Drop } from "vue-drag-drop";

import {
  getArchetypes,
  getCards,
  getStats,
  getDeck,
  editDeck,
} from "@/services/client";
const parameters = require("@/services/values");
const initialForm = require("@/services/form").form;
import moment from "moment";

library.add(
  faSearch,
  faChevronCircleUp,
  faChevronCircleDown,
  faChevronLeft,
  faChevronRight,
  faEraser,
  faArrowLeft,
  faSave
);
library.add(faTrashAlt);

const HISTORY_SIZE = 18;

export default {
  name: "Edit",
  metaInfo() {
    return {
      title: `YuGiOh! TimeMachine - Deck ${this.deck.name}`,
      meta: [
        {
          name: "description",
          content: `Edition of deck ${this.deck.name}`,
        },
        {
          property: "og:title",
          content: `Deck ${this.deck.name}`,
        },
        {
          property: "og:site_name",
          content: "YuGiOh! TimeMachine",
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          name: "robots",
          content: "index,follow",
        },
      ],
    };
  },
  components: {
    checkbox,
    checkboxLg,
    FontAwesomeIcon,
    attributeCheckbox,
    starCheckbox,
    pointsSelector,
    archetypeSelector,
    VueCtkDateTimePicker,
    Drag,
    Drop,
    colorSelector,
  },
  computed: {
    now: function () {
      return moment().format("YYYY-MM-DD");
    },
    parameters: function () {
      return parameters;
    },
    deck_main: function () {
      if (this.deck) {
        return [...this.deck.main].sort((a, b) => {
          if (a.type < b.type) return -1;
          if (a.type > b.type) return 1;
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
      }
      return null;
    },
    deck_extra: function () {
      if (this.deck) {
        return [...this.deck.extra].sort((a, b) => {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });
      }
      return null;
    },
  },
  data: function () {
    return {
      deck: {
        id: this.$route.params.id,
        name: "",
        main: [],
        extra: [],
      },
      cards: {
        data: [],
        total: 0,
      },
      stats: {},
      current: null,
      current_image_showing: 0,
      form: JSON.parse(JSON.stringify(initialForm)),
      images: {
        card: card_image,
        star: star_image,
        attributes: parameters.attributes.reduce((map, obj) => {
          map[obj.id.toUpperCase()] = obj.image;
          return map;
        }, {}),
      },
      history: [],
      archetypes: [],
      archetype: "",
      activeTab: "cards",
      dragging: null,
    };
  },
  watch: {
    form: {
      handler() {
        if (this.activeTab === "cards") {
          this.searchCards();
        }
      },
      deep: true,
    },
    activeTab: {
      handler() {
        if (this.activeTab === "cards") {
          this.searchCards();
        }
      },
    },
  },
  methods: {
    clearFilters: function () {
      this.form = JSON.parse(JSON.stringify(initialForm));
    },
    clearHistory: function () {
      this.history = [];
    },
    clearDeck: function () {
      this.deck.main = [];
      this.deck.extra = [];
    },
    addHistory: function (card) {
      let found = this.history.find((element) => element.id === card.id);
      if (found === undefined) {
        this.history.unshift(card);
        if (this.history.length > HISTORY_SIZE) {
          this.history = this.history.slice(0, HISTORY_SIZE);
        }
      } else {
        this.history.sort((x, y) => {
          return x == found ? -1 : y == found ? 1 : 0;
        });
      }
    },
    selectCard: function (card) {
      this.addHistory(card);
      this.current = card;
      this.current_image_showing = 0;
    },
    saveDeck: function () {
      let body = {
        name: this.deck.name,
        color: this.deck.color,
        cards: this.deck.main
          .map((card) => {
            return card.id;
          })
          .concat(
            this.deck.extra.map((card) => {
              return card.id;
            })
          ),
      };
      if (this.deck.id !== "new") body.id = this.deck.id;
      editDeck(this.deck.id !== "new" ? this.deck.id : null, body)
        .then((response) => {
          if (this.deck.id !== response.id) {
            this.$router.push(`/decks/${response.id}`);
          }
        })
        .catch((err) => console.error(err));
    },
    searchCards: function () {
      let form = Object.assign({}, this.form);
      form.checks = Object.keys(form.checks).filter((x) => form.checks[x]);
      if (!form.checks.length) form.checks = parameters.checks.map((x) => x.id);
      form.attributes = Object.keys(form.attributes).filter(
        (x) => form.attributes[x]
      );
      if (!form.attributes.length)
        form.attributes = parameters.attributes.map((x) => x.id);
      form.levels = Object.keys(form.levels).filter((x) => form.levels[x]);
      if (!form.levels.length)
        form.levels = parameters.levels.map((x) => x.value);
      form.monsterTypes = Object.keys(form.monsterTypes)
        .filter((x) => form.monsterTypes[x])
        .map((x) => parameters.monsterTypes.find((y) => y.id === x).name);
      if (!form.monsterTypes.length)
        form.monsterTypes = parameters.monsterTypes.map((x) => x.name);
      form.spellFamilies = Object.keys(form.spellFamilies)
        .filter((x) => form.spellFamilies[x])
        .map((x) => parameters.spellTypes.find((y) => y.id === x).label);
      if (!form.spellFamilies.length)
        form.spellFamilies = parameters.spellTypes.map((x) => x.label);
      form.trapFamilies = Object.keys(form.trapFamilies)
        .filter((x) => form.trapFamilies[x])
        .map((x) => parameters.trapTypes.find((y) => y.id === x).label);
      if (!form.trapFamilies.length)
        form.trapFamilies = parameters.trapTypes.map((x) => x.label);
      getCards(form).then((response) => {
        this.cards = response;
      });
    },
    handleDragover: function (group, data, event) {
      if (data && group !== data.group) {
        event.dataTransfer.dropEffect = "none";
      }
    },
    handleDrop: function (data) {
      if (data && data.group === "removing") {
        let im = this.deck.main.indexOf(data.card);
        let ie = this.deck.extra.indexOf(data.card);
        if (im > -1) this.deck.main.splice(im, 1);
        if (ie > -1) this.deck.extra.splice(ie, 1);
      }
      if (data && data.group === "adding") {
        if (data.card.type === "EXTRA") {
          if (this.deck.extra.filter((x) => x.id === data.card.id).length < 3) {
            this.deck.extra.push(data.card);
          }
        } else {
          if (this.deck.main.filter((x) => x.id === data.card.id).length < 3) {
            this.deck.main.push(data.card);
          }
        }
      }
      this.dragging = null;
    },
    deckSize: function (deck) {
      let result = 40;
      if (deck.length >= 40) {
        result = (Math.floor(deck.length / 10) * 10) + 10;
      }
      return result;
    },
  },
  mounted: function () {
    getArchetypes().then((archetypes) => {
      this.archetypes = archetypes;
    });
    getStats().then((stats) => {
      this.stats = stats;
    });
    this.searchCards();
    if (this.deck.id !== "new") {
      getDeck(this.deck.id).then((deck) => {
        this.deck = deck;
      });
    }
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.modal-fade-enter,
.modal-fade-leave-active {
  opacity: 0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.5s ease;
}
</style>

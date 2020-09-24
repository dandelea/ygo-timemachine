<template>
  <div class="flex flex-col md:flex-row md:max-h-body">
    <!-- Current -->
    <div id="current" class="w-full md:w-1/3 md:overflow-y-auto">
      <div class="p-2 flex flex-row md:flex-col w-full">
        <img v-if="current" class="ml-4 w-32 md:w-64 md:mx-auto" :src="current.card_images[0].image_url" :alt="current.name">
        <img v-if="!current" class="ml-4 w-32 md:w-64 md:mx-auto" :src="images.card" alt="No Card">
        <div class="px-6 py-4" v-if="current">
          <div class="bg-blue-800 p-2 text-center text-sm md:text-md lg:text-lg mb-2 flex flex-wrap" v-if="current">
            <h1 class="w-full font-bold">{{current.name}}</h1>
            <span class="mx-auto p-1 text-sm flex flex-row items-center text-center shadow-lg" v-if="current.level">
              <span class="mr-1">{{current.level}}</span>
              <img class="w-5 h-5" alt="Level" :title="`Level ${current.level}`" :src="images.star" />
            </span>
            <span class="mx-auto p-1 text-sm flex flex-row items-center text-center shadow-lg" v-if="current.attribute">
              <span class="mr-1">{{current.attribute}}</span>
              <img class="w-5 h-5" alt="Level" :title="`Attribute ${current.attribute}`" :src="images.attributes[current.attribute]" />
            </span>
          </div>
          <div class="bg-blue-800 p-2 mb-2 text-justify">
            <p class="text-grey-darker text-xs text-green-400 font-bold">
            [{{current.race}}]
            </p>
            <p class="text-grey-darker text-xs">
              {{current.desc}}
            </p>
          </div>
          <div class="bg-blue-800 p-2 text-center" v-if="(current.atk !== undefined) || current.def !== undefined">
            <div class="w-full flex flex-wrap text-sm">
              <span class="flex-1" v-if="current.atk !== undefined">ATK {{current.atk}}</span>
              <span class="flex-1" v-if="current.def !== undefined">DEF {{current.def}}</span>
            </div>
          </div>
        </div>
      </div>
      <div id="history" class="hidden md:block" v-if="history.length">
        <div class="py-2 px-6 bg-blue-800 w-full h-8 flex items-center">
          <h1 class="w-11/12 text-sm text-white">Card history</h1>
          <span @click="clearHistory()"
            class="w-1/12 w-6 h-6 text-center text-white cursor-pointer bg-red-500 duration-200 hover:bg-red-600 shadow-lg">
            <font-awesome-icon :icon="['far', 'trash-alt']" />
          </span>
        </div>
        <div class="flex flex-wrap md:max-h-history md:overflow-y-auto">
          <div class="w-12 bg-blue-900 h-16 mx-1 my-1 cursor-pointer"
            v-for="card in history" :key="card.id"
            @click="selectCard(card)"
            :style="`background-image: url('${card.card_images[0].image_url_small}'); background-repeat: no-repeat; background-size: cover`"
            :title="card.name"
          >
          </div>
        </div>
      </div>
    </div>
    <!-- List -->
    <div v-if="stats && cards" id="list" class="px-2 w-full md:w-1/3">
      <div class="p-2 bg-blue-800 text-center my-2 text-sm md:text-base">
        Showing {{Math.min(stats.pageSize, cards.total)}} of {{stats.cards}} results
      </div>
      <div class="flex flex-wrap md:max-h-list md:overflow-y-auto">
        <div class="w-16 bg-blue-900 h-24 m-1 mx-auto cursor-pointer"
          v-for="card in cards.data" :key="card.id"
          @click="selectCard(card)"
          :style="`background-image: url('${card.card_images[0].image_url_small}'); background-repeat: no-repeat; background-size: cover`"
          :title="card.name"
        ></div>
      </div>
    </div>
    <!-- Filters -->
    <div id="filters" class="w-full md:w-1/3 flex flex-col md:overflow-y-auto">
      <div class="px-4 m-2 text-center">
        <span>Time travel</span>
        <vue-ctk-date-time-picker v-model="form.epoch"
          format="YYYY-MM-DD" formatted="YYYY-MM-DD" 
          disable-time onlyDate noKeyboard dark
          label="Select date" minDate="2001-01-01" :maxDate="now"
        />
      </div>
      <div class="flex flex-wrap items-center px-2">
        <label class="flex-1 p-2" for="order">Sort by:</label>
        <select id="order" v-model="form.order.field"
          class="flex-grow p-2 m-2 appearance-none cursor-pointer bg-blue-800">
          <option :value="option.id" v-for="option in form.order.options" :key="option.id" class="bg-white text-blue-700">{{option.label}}</option>
        </select>
        <button class="flex-1 p-2 m-2 bg-blue-800 hover:bg-blue-700" @click="form.order.inverse = !form.order.inverse">
          <font-awesome-icon :icon="form.order.inverse ? 'chevron-circle-down' : 'chevron-circle-up'" />
        </button>
      </div>
      <div class="flex mx-4 my-2 bg-blue-800 text-center items-center text-white uppercase shadow-lg cursor-pointer duration-200 hover:bg-blue-700"
        @click="clearFilters" title="Clear filters">
        <span class="mx-auto">Clear filters</span>
        <font-awesome-icon icon="eraser" class="mx-auto ml-2 h-8" />
      </div>
      <div id="checks" class="my-1 flex flex-wrap">
        <checkbox-lg :id="check.id" v-model="form.checks[check.id]"
          v-for="check in parameters.checks" :key="`checks-${check.id}`"
          :color="check.color" class="mx-auto"
        >
          {{check.label}}
        </checkbox-lg>
      </div>
      <div id="search" class="px-4 my-2 flex items-center">
        <input class="w-full p-2 text-white bg-blue-800"
          type="search" placeholder="Search name..."
          v-model="form.search"
        >
      </div>
      
      <div v-show="form.checks.monsters || form.checks.extra || !Object.values(form.checks).filter(v => v).length">
        <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
          <h1 class="w-11/12 text-white">Monsters / Extra</h1>
        </div>
        <div>
          <div id="attribute" class="p-2 flex items-center" v-if="parameters">
            <attribute-checkbox v-model="form.attributes[attribute.id]"
              :id="attribute.id" :label="attribute.label"
              :image="attribute.image" :value="form.attributes[attribute.id]"
              class="mx-auto w-10 h-10"
              v-for="attribute in parameters.attributes" :key="attribute.id" />
          </div>
          <div id="levels" class="p-2 flex items-center" v-if="parameters">
            <star-checkbox v-model="form.levels[level.value]"
              :id="level.id" :label="level.label"
              :images="[level.images.active, level.images.inactive]"
              :value="form.levels[level.id]"
              class="w-1/12 px-1 mx-auto"
              v-for="level in parameters.levels" :key="level.id" />
          </div>
          <div id="attack" class="py-1 px-4 flex items-center" v-if="parameters">
            <points-selector label="ATK" v-model="form.attack" :min="parameters.attackDefense.min" :max="parameters.attackDefense.max" />
          </div>
          <div id="defense" class="py-1 px-4 pb-2 flex items-center" v-if="parameters">
            <points-selector label="DEF" v-model="form.defense" :min="parameters.attackDefense.min" :max="parameters.attackDefense.max" />
          </div>
          <div id="types" class="p-2 flex flex-wrap items-center" v-if="parameters">
            <checkbox :id="monsterType.id" :label="monsterType.name"
              :value="form.monsterTypes[monsterType.id]"
              v-for="monsterType in parameters.monsterTypes" :key="monsterType.id"
              v-model="form.monsterTypes[monsterType.id]"
              class="w-1/2 my-1"
            >
              <img :src="monsterType.image" :alt="monsterType.name" class="w-4 h-4 ml-1" v-if="monsterType.image" />
              <span class="ml-1">{{monsterType.name}}</span>
            </checkbox>
          </div>
          <div id="archetypes" class="flex items-center" v-if="parameters">
            <archetype-selector :archetypes="archetypes" :values="form.archetypes" v-model="form.archetypes" />
          </div>
        </div>
      </div>
      <div v-show="form.checks.spells || !Object.values(form.checks).filter(v => v).length">
        <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
          <h1 class="w-11/12 text-white">Spells</h1>
        </div>
        <div>
          <div id="spell-family" class="p-2 flex flex-wrap items-center" v-if="parameters">
            <checkbox-lg :id="`spells-${family.id}`" v-model="form.spellFamilies[family.id]"
              v-for="family in parameters.spellTypes" :key="`spells-${family.id}`"
              color="green" class="mx-auto my-1">
              {{family.label}}
            </checkbox-lg>
          </div>
        </div>
      </div>
      <div v-show="form.checks.traps || !Object.values(form.checks).filter(v => v).length">
        <div class="py-2 px-6 bg-blue-800 text-sm h-6 flex items-center">
          <h1 class="w-11/12 text-white">Traps</h1>
        </div>
        <div>
          <div id="trap-family" class="p-2 flex flex-wrap items-center" v-if="parameters">
            <checkbox-lg :id="`traps-${family.id}`" v-model="form.trapFamilies[family.id]"
              v-for="family in parameters.trapTypes" :key="`traps-${family.id}`"
              color="pink" class="mx-auto my-1">
              {{family.label}}
            </checkbox-lg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import checkbox from '@/components/form/checkbox'
import checkboxLg from '@/components/form/checkbox-lg'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faSearch, faChevronCircleUp, faChevronCircleDown, faEraser } from '@fortawesome/free-solid-svg-icons'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import '@/assets/css/custom.css'

import attributeCheckbox from '@/components/form/attribute-checkbox'
import starCheckbox from '@/components/form/star-checkbox'

import pointsSelector from '@/components/form/points-selector'
import archetypeSelector from '@/components/form/archetype-selector'

import card_image from '@/assets/img/card.jpg'
import star_image from '@/assets/img/levels/level.svg'

import VueCtkDateTimePicker from 'vue-ctk-date-time-picker';
import 'vue-ctk-date-time-picker/dist/vue-ctk-date-time-picker.css';

import { getArchetypes, getCards, getStats } from '@/services/client'
const parameters = require('@/services/values')
const initialForm = require('@/services/form').form
import moment from 'moment'

library.add(faSearch, faChevronCircleUp, faChevronCircleDown, faEraser)
library.add(faTrashAlt)

const HISTORY_SIZE = 18

export default {
  name: 'Home',
  metaInfo: {
    title: 'YuGiOh! TimeMachine'
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
  },
  computed: {
    now: function() {
      return moment().format('YYYY-MM-DD');
    },
    parameters: function() {
      return parameters
    },
  },
  data: function () {
    return {
      cards: {
        data: [],
        total: 0,
      },
      stats: {},
      current: null,
      form: JSON.parse(JSON.stringify(initialForm)),
      images: {
        card: card_image,
        star: star_image,
        attributes: parameters.attributes.reduce((map, obj) => {
          map[obj.id.toUpperCase()] = obj.image
          return map
        }, {}),
      },
      history: [],
      modals: {
        type: false,
        archetype: false,
      },
      archetypes: [],
      archetype: '',
    }
  },
  watch: {
    form: {
      handler () {
        getCards(this.form).then((response) => {
          this.cards = response;
        })
      },
      deep: true,
    },
  },
  methods: {
    clearFilters: function() {
      this.form = JSON.parse(JSON.stringify(initialForm))
    },
    clearHistory: function() {
      this.history = []
    },
    addHistory: function(card) {
      let found = this.history.find(element => element.id === card.id)
      if (found === undefined) {
        this.history.unshift(card);
        if (this.history.length > HISTORY_SIZE) {
          this.history = this.history.slice(0, HISTORY_SIZE)
        }
      } else {
        this.history.sort((x,y) => { return x == found ? -1 : y == found ? 1 : 0; });
      }
    },
    selectCard: function(card) {
      this.addHistory(card)
      this.current = card;
    },
  },
  mounted: function() {
    getArchetypes().then((archetypes) => {
      this.archetypes = archetypes;
    });
    getStats().then((stats) => {
      this.stats = stats;
    })
    getCards(this.form).then((cards) => {
      this.cards = cards;
    })
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>

  .modal-fade-enter,
  .modal-fade-leave-active {
    opacity: 0;
  }

  .modal-fade-enter-active,
  .modal-fade-leave-active {
    transition: opacity .5s ease
  }
  
</style>

<script>
  export default {
    name: 'autocomplete',

    props: {
      items: {
        type: Array,
        required: false,
        default: () => [],
      },
      isAsync: {
        type: Boolean,
        required: false,
        default: false,
      },
      placeholder: {
        type: String,
        default: 'Select...',
      }
    },

    data() {
      return {
        isOpen: false,
        results: [],
        search: '',
        isLoading: false,
        arrowCounter: 0,
      };
    },

    methods: {
      onChange() {
        // Let's warn the parent that a change was made
        // this.$emit('input', this.search);

        // Is the data given by an outside ajax request?
        if (this.isAsync) {
          this.isLoading = true;
        } else {
          // Let's  our flat array
          this.filterResults();
          this.isOpen = true;
        }
      },

      filterResults() {
        // first uncapitalize all the things
        if (this.search.length < 1) this.results = []
        else
        this.results = this.items.filter((item) => {
          return item.toLowerCase().includes(this.search.toLowerCase());
        });
      },
      setResult(result) {
        this.search = result;
        this.isOpen = false;
        this.$emit('input', this.search);
        this.search = ''
      },
      onArrowDown() {
        if (this.arrowCounter < this.results.length) {
          this.arrowCounter = this.arrowCounter + 1;
        }
      },
      onArrowUp() {
        if (this.arrowCounter > 0) {
          this.arrowCounter = this.arrowCounter -1;
        }
      },
      onEnter() {
        this.search = this.results[this.arrowCounter];
        this.isOpen = false;
        this.arrowCounter = -1;
        this.$emit('input', this.search);
        this.search = ''
      },
      handleClickOutside(evt) {
        if (!this.$el.contains(evt.target)) {
          this.isOpen = false;
          this.arrowCounter = -1;
        }
      }
    },
    watch: {
      items: function (val, oldValue) {
        // actually compare them
        if (val.length !== oldValue.length) {
          this.results = val;
          this.isLoading = false;
        }
      },
    },
    mounted() {
      document.addEventListener('click', this.handleClickOutside)
    },
    destroyed() {
      document.removeEventListener('click', this.handleClickOutside)
    }
  };
</script>

<template>
  <div class="autocomplete">
    <input
      type="text"
      @input="onChange"
      v-model="search"
      @keydown.down="onArrowDown"
      @keydown.up="onArrowUp"
      @keydown.enter="onEnter"
      class="p-2 pl-6 w-full text-white bg-blue-800"
      :placeholder="placeholder"
    />
    <ul
      id="autocomplete-results"
      v-show="isOpen"
      class="autocomplete-results"
    >
      <li
        class="loading"
        v-if="isLoading"
      >
        Loading results...
      </li>
      <li
        v-else
        v-for="(result, i) in results"
        :key="i"
        @click="setResult(result)"
        class="autocomplete-result"
        :class="{ 'is-active': i === arrowCounter }"
      >
        {{ result }}
      </li>
    </ul>
  </div>
</template>

<style>
  .autocomplete {
    position: relative;
  }

  .autocomplete-results {
    @apply p-0 m-0 overflow-auto w-full h-20;
  }

  .autocomplete-result {
    @apply bg-white text-blue-700 cursor-pointer text-left p-2 list-none ;
  }

  .autocomplete-result.is-active,
  .autocomplete-result:hover {
    @apply bg-blue-700 text-white ;
  }

</style>
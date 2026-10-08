import { library } from '@fortawesome/fontawesome-svg-core'
import { faTimesCircle, faTrashAlt } from '@fortawesome/free-regular-svg-icons'
import {
  faArrowLeft,
  faCheck,
  faChevronCircleDown,
  faChevronCircleUp,
  faChevronLeft,
  faChevronRight,
  faEraser,
  faPlus,
  faSave,
  faSpinner,
  faTriangleExclamation,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import { i18n } from './i18n'
import { router } from './router'

library.add(
  faArrowLeft,
  faCheck,
  faChevronCircleDown,
  faChevronCircleUp,
  faChevronLeft,
  faChevronRight,
  faEraser,
  faPlus,
  faSave,
  faSpinner,
  faTimesCircle,
  faTriangleExclamation,
  faXmark,
  faTrashAlt,
)

createApp(App)
  .use(createPinia())
  .use(router)
  .use(i18n)
  .component('FontAwesomeIcon', FontAwesomeIcon)
  .mount('#app')

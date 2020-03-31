import Vue from 'vue'
import App from './App.vue'
import router from './router'
import VueMeta from 'vue-meta'
import moment from 'moment'
import '@/assets/css/tailwind.css'

import vmodal from 'vue-js-modal'
Vue.use(vmodal)

Vue.use(VueMeta, {
  // optional pluginOptions
  refreshOnceOnNavigation: true
})

Vue.filter('date', function (value) {
  if (!value) return ''
  value = value.toString()
  let date = moment(value)
  if (date.isValid()) {
    return date.format('DD/MM/YYYY')
  }
  return value
})


Vue.config.productionTip = process.env.NODE_ENV === 'production'
Vue.config.performance = process.env.NODE_ENV === 'development';
Vue.config.lintOnSave = process.env.NODE_ENV !== 'production'
Vue.config.productionSourceMap = process.env.NODE_ENV === 'development';

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')


import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home'
import Credits from '../views/Credits'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      title: 'Daniel de los Reyes - Inicio'
    },
  },
  {
    path: '/credits',
    name: 'Credits',
    component: Credits,
    meta: {
      title: 'Daniel de los Reyes - Inicio'
    },
  },
]

const router = new VueRouter({
  routes,
  mode: 'history',
})

export default router

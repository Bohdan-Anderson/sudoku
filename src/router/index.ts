import { createRouter, createWebHistory } from 'vue-router'
import LandingView from '../views/LandingView.vue'
import HomeView from '../views/HomeView.vue'
import GameView from '../views/GameView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingView },
    { path: '/home', name: 'home', component: HomeView },
    { path: '/game/:id', name: 'game', component: GameView, props: true },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

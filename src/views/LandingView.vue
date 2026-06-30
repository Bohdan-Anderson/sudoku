<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGamesStore } from '../stores/games'

const router = useRouter()
const store = useGamesStore()

onMounted(() => {
  const last = store.lastInProgress
  if (last) {
    router.replace({ name: 'game', params: { id: last.id } })
  } else {
    router.replace({ name: 'home' })
  }
})
</script>

<template>
  <div class="landing" />
</template>

<style scoped>
.landing {
  min-height: 100svh;
  background: var(--bg);
}
</style>

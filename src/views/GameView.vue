<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import SudokuBoard from '../components/SudokuBoard.vue'
import { useGamesStore } from '../stores/games'
import { DIFFICULTY_LABELS } from '../types/game'

const props = defineProps<{ id: string }>()

const router = useRouter()
const store = useGamesStore()

const game = computed(() => store.getGame(props.id))

onMounted(() => {
  if (!game.value) {
    router.replace({ name: 'home' })
    return
  }
  if (game.value.status === 'playing') {
    store.setActiveGame(props.id)
  }
})

const progress = computed(() =>
  game.value ? store.gameProgress(game.value) : 0,
)
</script>

<template>
  <div v-if="game" class="game-view">
    <header class="top-bar">
      <button class="back" type="button" aria-label="Home" @click="router.push({ name: 'home' })">
        ←
      </button>
      <span class="meta">
        {{ DIFFICULTY_LABELS[game.difficulty] }} · {{ progress }}%
      </span>
    </header>

    <SudokuBoard :game-id="id" />

    <div v-if="game.status === 'won'" class="win-banner">Solved</div>
  </div>
</template>

<style scoped>
.game-view {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.top-bar {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 420px;
  min-height: 44px;
  margin-bottom: 16px;
  gap: 12px;
}

.back {
  min-width: 44px;
  min-height: 44px;
  border: 1px solid var(--border-subtle);
  background: var(--bg);
  color: var(--text);
  font-size: 20px;
  cursor: pointer;
}

.meta {
  font-size: 14px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.win-banner {
  margin-top: 24px;
  padding: 12px 24px;
  border: 2px solid var(--border);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
</style>

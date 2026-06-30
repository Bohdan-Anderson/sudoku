<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import GameCard from '../components/GameCard.vue'
import { useGamesStore } from '../stores/games'
import { DIFFICULTIES, DIFFICULTY_LABELS } from '../types/game'
import type { Difficulty, SavedGame } from '../types/game'

const router = useRouter()
const store = useGamesStore()
const completedOpen = ref(false)

function openGame(id: string) {
  router.push({ name: 'game', params: { id } })
}

function startGame(difficulty: Difficulty) {
  const id = store.createGame(difficulty)
  router.push({ name: 'game', params: { id } })
}

function confirmRemoveGame(game: SavedGame) {
  const label = DIFFICULTY_LABELS[game.difficulty]
  if (window.confirm(`Remove this ${label} game?`)) {
    store.deleteGame(game.id)
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="home">
    <header class="header">
      <h1>Sudoku</h1>
    </header>

    <section v-if="store.lastInProgress" class="continue">
      <button class="continue-btn" type="button" @click="openGame(store.lastInProgress!.id)">
        <span class="continue-label">Continue</span>
        <span class="continue-meta">
          {{ DIFFICULTY_LABELS[store.lastInProgress!.difficulty] }}
          · {{ store.gameProgress(store.lastInProgress!) }}%
          · {{ formatTime(store.lastInProgress!.updatedAt) }}
        </span>
      </button>
    </section>

    <section class="section">
      <h2 class="section-title">In progress</h2>
      <p v-if="store.inProgressGames.length === 0" class="empty">No games yet</p>
      <GameCard
        v-for="game in store.inProgressGames"
        :key="game.id"
        :game="game"
        removable
        @select="openGame(game.id)"
        @remove="confirmRemoveGame(game)"
      />
    </section>

    <section class="section">
      <button
        class="section-toggle"
        type="button"
        @click="completedOpen = !completedOpen"
      >
        <h2 class="section-title">Completed ({{ store.completedGames.length }})</h2>
        <span class="chevron">{{ completedOpen ? '−' : '+' }}</span>
      </button>
      <div v-if="completedOpen">
        <p v-if="store.completedGames.length === 0" class="empty">None yet</p>
        <GameCard
          v-for="game in store.completedGames"
          :key="game.id"
          :game="game"
          completed
          @select="openGame(game.id)"
        />
      </div>
    </section>

    <section class="new-game">
      <h2 class="section-title">New game</h2>
      <button
        v-for="d in DIFFICULTIES"
        :key="d"
        class="new-btn"
        type="button"
        @click="startGame(d)"
      >
        {{ DIFFICULTY_LABELS[d] }}
      </button>
    </section>
  </div>
</template>

<style scoped>
.home {
  min-height: 100svh;
  padding: 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  max-width: 480px;
  margin: 0 auto;
}

.header {
  margin-bottom: 24px;

  h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
}

.continue {
  margin-bottom: 28px;
}

.continue-btn {
  width: 100%;
  min-height: 64px;
  padding: 16px;
  border: 2px solid var(--border);
  background: var(--bg);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;

  .continue-label {
    display: block;
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .continue-meta {
    font-size: 14px;
    color: var(--text-muted);
  }
}

.section {
  margin-bottom: 28px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.section-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  min-height: 44px;
  margin-bottom: 12px;

  .section-title {
    margin: 0;
  }

  .chevron {
    font-size: 20px;
    color: var(--text-muted);
  }
}

.empty {
  margin: 0;
  font-size: 14px;
  color: var(--text-muted);
}

.new-game {
  .section-title {
    margin-bottom: 12px;
  }
}

.new-btn {
  display: block;
  width: 100%;
  min-height: 48px;
  margin-bottom: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
</style>

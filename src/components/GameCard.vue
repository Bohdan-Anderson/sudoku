<script setup lang="ts">
import { computed } from 'vue'
import { useGamesStore } from '../stores/games'
import type { SavedGame } from '../types/game'
import { DIFFICULTY_LABELS } from '../types/game'

const props = defineProps<{
  game: SavedGame
  completed?: boolean
  removable?: boolean
}>()

defineEmits<{ select: []; remove: [] }>()

const store = useGamesStore()

const progress = computed(() => store.gameProgress(props.game))

const metaText = computed(() => {
  const { helpCount } = props.game
  return helpCount > 0
    ? `${progress.value}% · ${helpCount} help${helpCount > 1 ? 's' : ''}`
    : `${progress.value}% complete`
})

function cellFilled(i: number) {
  return (props.game.cells[i]?.value ?? 0) > 0
}

function cellGiven(i: number) {
  return props.game.cells[i]?.given ?? false
}
</script>

<template>
  <div class="card-row">
    <button class="card" type="button" @click="$emit('select')">
      <div class="thumb">
        <span
          v-for="i in 81"
          :key="i"
          class="dot"
          :class="{ filled: cellFilled(i - 1), given: cellGiven(i - 1) }"
        />
      </div>
      <div class="info">
        <span class="title">
          {{ DIFFICULTY_LABELS[game.difficulty] }}
          <span v-if="completed" class="badge">Done</span>
        </span>
        <span class="meta">{{ metaText }}</span>
      </div>
    </button>
    <button
      v-if="removable"
      class="remove"
      type="button"
      aria-label="Remove game"
      @click="$emit('remove')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.card-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.card {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
  min-height: 56px;
  padding: 12px 0;
  border: none;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}

.remove {
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}

.thumb {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border: 1px solid var(--border-subtle);

  .dot {
    border: 0.5px solid transparent;

    &.filled {
      background: var(--text);
    }

    &.given {
      box-shadow: inset 0 0 0 0.5px var(--border);
    }
  }
}

.info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-size: 16px;
  font-weight: 500;
}

.badge {
  margin-left: 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
}

.meta {
  font-size: 13px;
  color: var(--text-muted);
}
</style>

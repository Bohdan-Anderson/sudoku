<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { cellsFromGame, type Cell } from '../puzzle'
import { clampPickerPosition, hitTest, pieSizes, type PickerHit } from '../pieSelector'
import { candidates, gridFromPuzzle } from '../sudoku/board'
import { boxIndex, getConflictInfo, type ConflictInfo } from '../sudoku/validate'
import { useGamesStore } from '../stores/games'
import type { MoveEntry } from '../types/game'
import PieSelector from './PieSelector.vue'

const props = defineProps<{ gameId: string }>()

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const store = useGamesStore()
const boardWrap = ref<HTMLElement | null>(null)

const game = computed(() => store.getGame(props.gameId))
const cells = ref<Cell[]>([])
const conflicts = ref<ConflictInfo>({
  cells: new Set(),
  rows: new Set(),
  cols: new Set(),
  boxes: new Set(),
})

function refreshConflicts() {
  conflicts.value = getConflictInfo(cells.value)
}

const activeIndex = ref<number | null>(null)
const pickerOpen = ref(false)
const highlight = ref<PickerHit | null>(null)
const pickerX = ref(0)
const pickerY = ref(0)
const pieFront = ref(0)
const pieBack = ref(0)
const pointerId = ref<number | null>(null)

const activeBox = computed(() =>
  activeIndex.value !== null ? boxIndex(activeIndex.value) : null,
)

const isWon = computed(() => game.value?.status === 'won')

watch(
  game,
  (g) => {
    if (g) {
      cells.value = cellsFromGame(g)
      refreshConflicts()
    }
  },
  { immediate: true },
)

function syncToStore() {
  if (!game.value || isWon.value) return
  store.updateGame(props.gameId, cells.value)
  refreshConflicts()
}

function updateHighlight(e: PointerEvent) {
  highlight.value = hitTest(e.clientX, e.clientY, pickerX.value, pickerY.value, pieFront.value, pieBack.value)
}

/** Snapshot a cell's current value/notes for use in a MoveEntry. */
function snapshotCell(cell: Cell) {
  return { value: cell.value, notes: [...cell.notes] }
}

function recordCellMove(index: number, before: { value: number | null; notes: number[] }, cell: Cell) {
  const entry: MoveEntry = {
    cellIndex: index,
    prevValue: before.value,
    prevNotes: before.notes,
    newValue: cell.value,
    newNotes: [...cell.notes],
  }
  store.recordMove(props.gameId, entry)
}

function applyHit(index: number, hit: PickerHit) {
  if (isWon.value) return
  const cell = cells.value[index]
  if (cell.given) return

  if (hit.action === 'clear') {
    const before = snapshotCell(cell)
    cell.value = null
    cell.notes = new Set()
    syncToStore()
    recordCellMove(index, before, cell)
    return
  }

  if (hit.action === 'value') {
    const before = snapshotCell(cell)
    cell.value = hit.digit!
    cell.notes = new Set()
    syncToStore()
    recordCellMove(index, before, cell)
    return
  }

  if (cell.value) return

  const before = snapshotCell(cell)
  const next = new Set(cell.notes)
  if (next.has(hit.digit!)) next.delete(hit.digit!)
  else next.add(hit.digit!)
  cell.notes = next
  syncToStore()
  recordCellMove(index, before, cell)
}

function closePicker() {
  pickerOpen.value = false
  activeIndex.value = null
  highlight.value = null
  pointerId.value = null
}

function removeWindowListeners() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerCancel)
}

function onCellPointerDown(index: number, e: PointerEvent) {
  if (isWon.value || cells.value[index].given) return

  e.preventDefault()

  const sizes = pieSizes()
  pieFront.value = sizes.front
  pieBack.value = sizes.back
  const clamped = clampPickerPosition(e.clientX, e.clientY, sizes.back)
  pickerX.value = clamped.x
  pickerY.value = clamped.y
  activeIndex.value = index
  pickerOpen.value = true
  pointerId.value = e.pointerId

  boardWrap.value?.setPointerCapture(e.pointerId)

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerCancel)

  updateHighlight(e)
}

function onPointerMove(e: PointerEvent) {
  if (!pickerOpen.value || e.pointerId !== pointerId.value) return
  updateHighlight(e)
}

function onPointerUp(e: PointerEvent) {
  if (!pickerOpen.value || e.pointerId !== pointerId.value) return

  if (boardWrap.value?.hasPointerCapture(e.pointerId)) {
    boardWrap.value.releasePointerCapture(e.pointerId)
  }

  removeWindowListeners()

  const hit = hitTest(e.clientX, e.clientY, pickerX.value, pickerY.value, pieFront.value, pieBack.value)
  if (hit && activeIndex.value !== null) applyHit(activeIndex.value, hit)

  closePicker()
}

function onPointerCancel(e: PointerEvent) {
  if (!pickerOpen.value || e.pointerId !== pointerId.value) return

  if (boardWrap.value?.hasPointerCapture(e.pointerId)) {
    boardWrap.value.releasePointerCapture(e.pointerId)
  }

  removeWindowListeners()
  closePicker()
}

onUnmounted(removeWindowListeners)

function cellClass(i: number) {
  const row = Math.floor(i / 9)
  const col = i % 9
  const box = boxIndex(i)
  const c = conflicts.value
  const inConflictLine =
    c.rows.has(row) || c.cols.has(col) || c.boxes.has(box)

  const inSelectBox =
    pickerOpen.value && activeBox.value !== null && box === activeBox.value

  return {
    given: cells.value[i].given,
    active: pickerOpen.value && activeIndex.value === i,
    'select-box': inSelectBox,
    conflict: c.cells.has(i),
    'conflict-line': inConflictLine && !c.cells.has(i),
    'box-right': col === 2 || col === 5,
    'box-bottom': row === 2 || row === 5,
    'edge-left': col === 0,
    'edge-right': col === 8,
    'edge-top': row === 0,
    'edge-bottom': row === 8,
  }
}

function hasNote(cell: Cell, n: number) {
  return !cell.value && cell.notes.has(n)
}

/** Fill the empty cell with the fewest valid candidates using the solution. Returns true if a cell was helped. */
function useHelp(): boolean {
  if (!game.value || isWon.value) return false

  const grid = cells.value.map((c) => c.value ?? 0)
  let bestIndex = -1
  let bestCandidateCount = Infinity

  for (let i = 0; i < cells.value.length; i++) {
    const cell = cells.value[i]
    if (cell.given || cell.value) continue

    const count = candidates(grid, i).length
    if (count < bestCandidateCount) {
      bestCandidateCount = count
      bestIndex = i
    }
  }

  if (bestIndex === -1) return false

  const solutionGrid = gridFromPuzzle(game.value.solution)
  const cell = cells.value[bestIndex]
  const before = snapshotCell(cell)
  cell.value = solutionGrid[bestIndex]
  cell.notes = new Set()
  syncToStore()
  recordCellMove(bestIndex, before, cell)

  return true
}

/** Reverts the most recent recorded move, if any. */
function performUndo() {
  const entry = store.undo(props.gameId)
  if (!entry) return

  const cell = cells.value[entry.cellIndex]
  cell.value = entry.prevValue
  cell.notes = new Set(entry.prevNotes)
  syncToStore()
}

/** Re-applies the most recently undone move, if any. */
function performRedo() {
  const entry = store.redo(props.gameId)
  if (!entry) return

  const cell = cells.value[entry.cellIndex]
  cell.value = entry.newValue
  cell.notes = new Set(entry.newNotes)
  syncToStore()
}

const canUndo = computed(() => store.canUndo(props.gameId))
const canRedo = computed(() => store.canRedo(props.gameId))

defineExpose({ useHelp, performUndo, performRedo })
</script>

<template>
  <div ref="boardWrap" class="board-wrap">
    <div class="board">
      <div
        v-for="(cell, i) in cells"
        :key="i"
        class="cell"
        :class="cellClass(i)"
        @pointerdown="onCellPointerDown(i, $event)"
      >
        <span v-if="cell.value" class="value">{{ cell.value }}</span>
        <div v-else class="notes">
          <span v-for="n in DIGITS" :key="n">{{ hasNote(cell, n) ? n : '' }}</span>
        </div>
      </div>
    </div>

    <div class="undo-row">
      <button class="undo-btn" type="button" :disabled="!canUndo" @click="performUndo">↩ Undo</button>
      <button class="redo-btn" type="button" :disabled="!canRedo" @click="performRedo">↪ Redo</button>
    </div>

    <PieSelector
      v-if="pickerOpen"
      :x="pickerX"
      :y="pickerY"
      :highlight="highlight"
    />
  </div>
</template>

<style scoped>
.board-wrap {
  position: relative;
  touch-action: none;
}

.undo-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  width: min(92vw, 420px);
  margin: 12px auto 0;
}

.undo-btn,
.redo-btn {
  flex: 1;
  min-height: 44px;
  border: 1px solid var(--border-subtle);
  background: var(--bg);
  color: var(--text);
  font-size: 16px;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  width: min(92vw, 420px);

  .cell {
    aspect-ratio: 1;
    border: 1px solid var(--border-subtle);
    display: grid;
    place-items: center;
    font-size: clamp(14px, 4vw, 22px);
    background: var(--board-surface);
    color: var(--text);
    user-select: none;
    touch-action: none;
    cursor: default;
    font-weight: 200;

    &.given {
      font-weight: 700;
    }

    &.select-box {
      background: var(--board-select-box);
    }

    &.active {
      background: var(--board-active);
    }

    &.conflict {
      background: var(--conflict-bg);
      color: var(--conflict-text);
      font-weight: 600;
    }

    &.conflict-line {
      background: var(--conflict-line-bg);
    }

    &.conflict.conflict-line {
      background: var(--conflict-bg);
    }

    &.box-right {
      border-right-width: 2px;
      border-right-color: var(--border);
    }

    &.box-bottom {
      border-bottom-width: 2px;
      border-bottom-color: var(--border);
    }

    &.edge-left {
      border-left-width: 2px;
      border-left-color: var(--border);
    }

    &.edge-right {
      border-right-width: 2px;
      border-right-color: var(--border);
    }

    &.edge-top {
      border-top-width: 2px;
      border-top-color: var(--border);
    }

    &.edge-bottom {
      border-bottom-width: 2px;
      border-bottom-color: var(--border);
    }

    .value {
      font-size: 1.4em;
    }

    .notes {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      width: 100%;
      height: 100%;
      font-size: 0.45em;
      color: var(--text);

      span {
        display: grid;
        place-items: center;
      }
    }
  }
}
</style>

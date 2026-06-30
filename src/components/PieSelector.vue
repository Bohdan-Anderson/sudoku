<script setup lang="ts">
import {
  CX,
  CY,
  LABELS,
  R_CENTER,
  R_EDGE,
  SLICES,
  labelPos,
  sliceHighlight,
  slicePath,
  type PickerHit,
  PIE_FRONT_MAX,
} from '../pieSelector'

defineProps<{
  x: number
  y: number
  highlight: PickerHit | null
}>()

const LABEL_OUTSET = (100 / PIE_FRONT_MAX) * 5
const LABEL_R = R_EDGE * 0.62 + LABEL_OUTSET
</script>

<template>
  <div class="overlay" :style="{ left: `${x}px`, top: `${y}px` }">
    <svg class="pie pie-back" viewBox="0 0 100 100">
      <path
        v-for="i in SLICES"
        :key="'back-' + i"
        :d="slicePath(i - 1, R_EDGE)"
        class="slice back"
        :class="{
          on: sliceHighlight(highlight, i - 1, 'back'),
          clear: highlight?.action === 'clear' && i - 1 === 9,
        }"
      />
      <circle :cx="CX" :cy="CY" :r="R_CENTER" class="center" />
    </svg>

    <svg class="pie pie-front" viewBox="0 0 100 100">
      <path
        v-for="i in SLICES"
        :key="'front-' + i"
        :d="slicePath(i - 1, R_EDGE)"
        class="slice front"
        :class="{
          on: sliceHighlight(highlight, i - 1, 'front'),
          clear: highlight?.action === 'clear' && i - 1 === 9,
        }"
      />
      <text
        v-for="(label, i) in LABELS"
        :key="'front-label-' + i"
        :x="labelPos(i, LABEL_R).x"
        :y="labelPos(i, LABEL_R).y"
        class="label inner"
        :class="{ clear: label === '×', on: sliceHighlight(highlight, i, 'front') }"
      >{{ label }}</text>
      <circle :cx="CX" :cy="CY" :r="R_CENTER" class="center" />
    </svg>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  z-index: 100;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: 0.85;
  transform: translate(-50%, -50%) scale(0);
  animation: pie-in 0.15s ease-out forwards;

  .pie {
    grid-area: 1 / 1;
    filter: drop-shadow(0 4px 20px rgba(255, 255, 255, 0.08));
  }

  .pie-back {
    width: min(75vw, 310px);
    height: min(75vw, 310px);
  }

  .pie-front {
    width: min(55vw, 220px);
    height: min(55vw, 220px);
  }
}

.slice {
  stroke: var(--border);
  stroke-width: 0.6;

  &.back {
    fill: var(--pie-back);

    &:nth-child(odd) {
      fill: var(--pie-back-alt);
    }
  }

  &.front {
    fill: var(--pie-front);

    &:nth-child(odd) {
      fill: var(--pie-front-alt);
    }
  }

  &.front.on {
    fill: var(--pie-highlight-value);
  }

  &.back.on {
    fill: var(--pie-highlight-note);
  }

  &.on.clear {
    fill: rgba(255, 255, 255, 0.2);
  }
}

.center {
  fill: var(--pie-center);
  stroke: var(--border);
  stroke-width: 0.6;
}

.label {
  font-family: system-ui, sans-serif;
  text-anchor: middle;
  dominant-baseline: central;
  fill: var(--pie-label);

  &.inner {
    font-size: 7px;
    font-weight: 600;
  }

  &.clear {
    fill: var(--pie-clear);
  }

  &.on {
    fill: var(--text);
  }

  &.clear.on {
    fill: var(--pie-clear);
  }
}

@keyframes pie-in {
  from {
    transform: translate(-50%, -50%) scale(0);
  }

  to {
    transform: translate(-50%, -50%) scale(1);
  }
}
</style>

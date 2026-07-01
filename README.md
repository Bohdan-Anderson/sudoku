# Sudoku

A mobile-first Sudoku game built with Vue 3, TypeScript, and Vite. Touch-friendly radial menu for number entry, four difficulty levels, unique-solution puzzle generation, pencil marks, undo/redo, and offline play as an installable PWA.

**Live:** https://d327h6hurcq4re.cloudfront.net/

---

## Project Overview

Sudoku is a client-only single-page app — there is no backend, and all game state lives in the browser. It's designed for touch devices first, with large tap targets and a gesture-driven number picker instead of an on-screen keypad.

- **Puzzle generation** — every new game gets a freshly generated grid with a mathematically unique solution, at one of four difficulties (Easy, Medium, Hard, Extreme)
- **Multiple concurrent games** — start as many games as you like; in-progress and completed games are listed on the home screen with mini thumbnail previews
- **Resume where you left off** — opening the app lands you back in your last active game (`LandingView.vue` auto-redirects), or the home screen if none exist
- **Fully offline-capable** — installable as a PWA with all assets precached by a service worker

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Vue 3](https://vuejs.org/) 3.5 (Composition API, `<script setup>`) |
| Language | [TypeScript](https://www.typescriptlang.org/) ~6.0 |
| Build | [Vite](https://vite.dev/) ^8.1 with `@vitejs/plugin-vue` |
| State | [Pinia](https://pinia.vuejs.org/) ^3.0 (Options-style store) |
| Routing | [Vue Router](https://router.vuejs.org/) ^5.1 |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox (service worker, manifest, auto-update) |
| Icon generation | [sharp](https://sharp.pixelplumbing.com/) (rasterizes SVG → PWA icons at build time) |

---

## Architecture

```
sudoku/
├── src/
│   ├── views/                 # Route-level page components
│   │   ├── LandingView.vue      # Redirects to last active game or home
│   │   ├── HomeView.vue         # Game list + new game buttons
│   │   └── GameView.vue         # Board + top bar (back, meta, help)
│   ├── components/             # Reusable UI components
│   │   ├── SudokuBoard.vue       # 9×9 grid, cell interactions, undo/redo
│   │   ├── PieSelector.vue       # SVG radial picker overlay
│   │   └── GameCard.vue          # Mini preview card for saved games
│   ├── sudoku/                 # Pure game logic (framework-agnostic)
│   │   ├── board.ts              # Grid primitives, candidates, peers
│   │   ├── solver.ts             # Backtracking solver (MRV heuristic)
│   │   ├── generator.ts          # Puzzle generation with unique solution
│   │   └── validate.ts           # Conflict + win detection
│   ├── stores/
│   │   └── games.ts              # Pinia store — all game state + persistence
│   ├── types/
│   │   └── game.ts               # TypeScript interfaces and constants
│   ├── router/
│   │   └── index.ts              # Vue Router config
│   ├── pieSelector.ts           # Radial menu geometry & hit-testing
│   ├── puzzle.ts                # Cell runtime/serialization helpers
│   ├── style.css                # Global dark theme CSS variables
│   └── main.ts                  # App entry point
├── public/                     # Static assets (PWA icons, favicon)
├── scripts/
│   └── generate-pwa-icons.mjs  # Generates PWA icons from SVG via sharp
├── vite.config.ts              # Vite + PWA plugin configuration
└── package.json
```

### Data flow

```
User taps a cell → SudokuBoard captures PointerEvent
  → PieSelector opens (fixed overlay, z-index: 100)
  → User drags → hitTest() resolves the wedge under the pointer
  → On release, SudokuBoard applies the change to cells[] ref
  → syncToStore():
      → store.updateGame() serializes cells
      → isWin() checked against the stored solution
      → Debounced localStorage write (300ms)
  → Conflicts recomputed via getConflictInfo()
```

### Puzzle engine (`src/sudoku/`)

1. **Generation** (`generator.ts`) — fills the diagonal 3×3 boxes with random digits, solves the rest of the grid via backtracking, then carves cells out one at a time while re-checking `countSolutions(grid, limit=2) === 1` to guarantee the puzzle still has exactly one solution. Clue counts vary by difficulty.
2. **Solving** (`solver.ts`) — pure backtracking with a **Minimum Remaining Values** heuristic (always branches on the cell with fewest candidates). `countSolutions()` stops early once it hits a `limit`, which is what makes the uniqueness check in generation cheap.
3. **Validation** (`validate.ts`) — scans every row, column, and 3×3 box for duplicate digits and returns per-cell conflict info plus the affected rows/cols/boxes. A game is won when all cells are filled, match the solution, and there are no conflicts.

### Persistence

All game state lives under a single `localStorage` key, `sudoku-games-v1` (see `STORAGE_KEY` in `types/game.ts`):

- Every in-progress and completed game (puzzle, solution, cell values/notes)
- Help-usage count per game
- Full undo/redo move history (`MoveEntry[]`)
- Which game was last active

Hydration happens once at startup in `main.ts` via `store.hydrate()`. Older saved games are gracefully backfilled with defaults for fields added later (`helpCount`, `moveHistory`, `redoStack`).

---

## Local Development

```bash
# Install dependencies
npm install

# Start the dev server (hot reload)
npm run dev
# → http://localhost:5173

# Expose the dev server to other devices on your network
npm run dev -- --host 0.0.0.0

# Type-check, regenerate icons, and build for production
npm run build

# Preview the production build locally
npm run preview

# Regenerate PWA icons only
npm run icons
```

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Generate PWA icons → type-check (`vue-tsc -b`) → build with Vite |
| `npm run preview` | Preview the production build locally |
| `npm run icons` | Regenerate PWA icons from `public/pwa-icon.svg` only |

### Tech notes

- **State management:** Pinia Options-style store (`defineStore('games', { state, getters, actions })`)
- **Persistence:** manual `localStorage` sync debounced by 300ms — no persistence plugin
- **Cell data model:** runtime cells use `Set<number>` for notes; serialized as `number[]` for storage
- **Grid representation:** flat `number[]` of 81 cells (row-major), `0` = empty
- **Touch targets:** all interactive elements are at least 44×44px (WCAG guideline)
- **Safe areas:** uses `env(safe-area-inset-bottom)` padding for notched devices

---

## Features

### Help button
A **"?"** button sits in the `GameView.vue` top bar. Each tap runs `SudokuBoard.useHelp()`, which scans every empty, non-given cell, ranks them by number of valid candidates (`candidates()` in `board.ts`), and fills in the one with the fewest — i.e. the hardest remaining cell — using the value from the puzzle's stored solution. Usage is tracked per game (`helpCount`) and surfaced as `helps N` next to the button and on the game's card in the home list. The count persists across sessions like any other game state.

### Undo / redo
Every board change — placing a value, toggling a note, clearing a cell, or using help — is recorded as a `MoveEntry` (previous and new value/notes) via `store.recordMove()`. Undo/redo buttons below the board call `SudokuBoard.performUndo()` / `performRedo()`, which pop/push entries between the game's `moveHistory` and `redoStack` in the store and reapply the corresponding cell state. Taking a new action after undoing clears the redo stack. The full history is preserved across page refreshes since it's part of the persisted game state.

### Pie selector
Pressing down on any editable cell opens `PieSelector.vue`, a two-ring SVG radial menu centered on the pointer (clamped to stay on-screen). The geometry and hit-testing live in `pieSelector.ts`:

- **Inner ring** (10 wedges) — drag to a digit to set the cell's value, or to the top wedge (`×`) to clear it
- **Outer ring** — drag further out to the same digit wedge to toggle that number as a pencil-mark note instead
- `hitTest()` does polar math (angle + radius) on every pointer move to highlight the active wedge live, and resolves the final action on pointer-up
- The picker animates in with a short CSS scale transition

### Conflict detection
`getConflictInfo()` in `validate.ts` scans all 9 rows, 9 columns, and 9 boxes for duplicate digits after every change. Cells holding a duplicate are highlighted in red; the rest of the affected row/column/box gets a subtler tint so the whole conflicting group is easy to spot. The same check gates the win condition — a puzzle only counts as solved when it's full, matches the solution, and has zero conflicts.

### PWA
Configured in `vite.config.ts` via `vite-plugin-pwa`:

- Installable in standalone mode, locked to portrait orientation, with a black theme/background to match the app
- `registerType: 'autoUpdate'` — the service worker (registered in `main.ts` with `registerSW({ immediate: true })`) refreshes automatically when new content is deployed
- Workbox precaches all built JS/CSS/HTML/image/font assets and falls back to `index.html` for client-side routes, so the app keeps working fully offline

---

## Deployment

### Build

```bash
npm run build
```

Output goes to `dist/`. This runs `scripts/generate-pwa-icons.mjs` (rasterizes `public/pwa-icon.svg` with `sharp` into the PWA/apple-touch/favicon PNGs), type-checks with `vue-tsc -b`, bundles with Vite, and generates the Workbox service worker.

### Deploy to S3 + CloudFront

The repo includes deployment scripts generated by a provisioning tool, targeting the `bohdan-sudoku` S3 bucket in `ca-central-1` behind CloudFront distribution `E38FWYFXOLY6R4` (see `cloudfront-bohdan-sudoku.env`):

```bash
# 1. Load AWS credentials (gitignored, not committed)
set -a && source ./uploader-aws-credentials.env && set +a

# 2. Sync the build to S3
./upload-bohdan-sudoku.sh ./dist --delete

# 3. Invalidate the CloudFront cache
./invalidate-cloudfront-bohdan-sudoku.sh
```

**Live URL:** https://d327h6hurcq4re.cloudfront.net/

> Deployment is manual — there is no CI/CD pipeline. `uploader-aws-credentials.env` and other `.env` files are gitignored and must be provisioned locally before running the upload script.

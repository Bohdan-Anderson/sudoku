# Sudoku

A mobile-first Sudoku game built with Vue 3, TypeScript, and Vite. Features a touch-friendly radial menu for quick number entry, four difficulty levels, automatic puzzle generation with unique solutions, pencil marks for note-taking, and full undo/redo support. Packaged as a Progressive Web App (PWA) for offline play.

**Live:** https://d327h6hurcq4re.cloudfront.net/

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) |
| Language | [TypeScript](https://www.typescriptlang.org/) (~6.0) |
| Build | [Vite](https://vite.dev/) (~8.1) |
| State | [Pinia](https://pinia.vuejs.org/) (~3.0) |
| Routing | [Vue Router](https://router.vuejs.org/) (~5.1) |
| PWA | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with Workbox |
| Icons | [sharp](https://sharp.pixelplumbing.com/) (PWA icon generation) |

---

## Features

### 🎮 Gameplay
- **4 difficulty levels** — Easy (36–45 clues), Medium (28–35), Hard (22–27), Extreme (17–21)
- **Radial pie menu** — Tap a cell, drag through the inner ring to set a value, outer ring to toggle pencil marks, bottom wedge to clear. Animated entry with CSS
- **Pencil marks** — Toggle candidate notes per cell (shown as a 3×3 mini-grid)
- **Conflict detection** — Duplicate digits in a row, column, or box are highlighted in red; the affected row/col/box gets a subtle tint
- **Auto-save** — Games persist to `localStorage` with a 300ms debounce
- **Multiple concurrent games** — In-progress and completed lists on the home screen with mini thumbnail previews

### 🆘 Help system
- A **"?"** button in the game view top bar (right-aligned)
- Each click fills in the hardest remaining empty cell (fewest valid candidates)
- Tracks how many times help was used per game — shown as `helps N` next to the button, and on the game card in the home screen
- Help count persists across sessions

### ↩️ Undo / Redo
- Buttons centered below the board
- Every action is tracked: value placement, note toggle, clear, and help
- Full history preserved across page refreshes via `localStorage`
- Redo stack cleared when a new action is taken after undoing

### 📱 PWA
- Installable on mobile and desktop (standalone mode, portrait orientation)
- Service worker caches all assets for offline play
- Auto-updates when new content is available

---

## Architecture

```
sudoku/
├── src/
│   ├── views/              # Route-level page components
│   │   ├── LandingView.vue    # Auto-redirect to last game or home
│   │   ├── HomeView.vue       # Game list + new game buttons
│   │   └── GameView.vue       # Board + top bar (back, meta, help)
│   ├── components/          # Reusable UI components
│   │   ├── SudokuBoard.vue    # 9×9 grid, cell interactions, undo/redo
│   │   ├── PieSelector.vue    # SVG radial picker overlay
│   │   └── GameCard.vue       # Mini preview card for saved games
│   ├── sudoku/              # Pure game logic (framework-agnostic)
│   │   ├── board.ts           # Grid primitives, candidates, peers
│   │   ├── solver.ts          # Backtracking solver (MRV heuristic)
│   │   ├── generator.ts       # Puzzle generation with unique solution
│   │   └── validate.ts        # Conflict + win detection
│   ├── stores/
│   │   └── games.ts           # Pinia store — all game state + persistence
│   ├── types/
│   │   └── game.ts            # TypeScript interfaces and constants
│   ├── router/
│   │   └── index.ts           # Vue Router config
│   ├── pieSelector.ts         # Radial menu geometry & hit-testing
│   ├── puzzle.ts              # Cell runtime/serialization helpers
│   ├── style.css              # Global dark theme CSS variables
│   └── main.ts                # App entry point
├── public/                    # Static assets (PWA icons, favicon)
├── scripts/
│   └── generate-pwa-icons.mjs # Auto-generates PWA icons from SVG
├── vite.config.ts             # Vite + PWA plugin configuration
└── package.json
```

### Key data flow

```
User taps cell → SudokuBoard captures PointerEvent
  → PieSelector opens (overlay, z-index: 100)
  → User drags to slice → hitTest() determines action
  → SudokuBoard applies change to cells[] ref
  → syncToStore() called:
      → Store.updateGame() serializes cells
      → isWin() check against solution
      → Debounced localStorage.write() (300ms)
  → Conflicts refreshed (getConflictInfo)
```

### Puzzle engine (`src/sudoku/`)

1. **Generation** (`generator.ts`):
   - Fill diagonal 3×3 boxes with random valid digits (guarantees solvability)
   - Solve the full grid using backtracking with MRV
   - Carve cells out while checking uniqueness via `countSolutions(grid, limit=2)`
   - Target clue counts vary by difficulty

2. **Solving** (`solver.ts`):
   - Pure backtracking with **Minimum Remaining Values** heuristic
   - Picks the cell with fewest candidates at each branch
   - `countSolutions()` stops counting at `limit` (used for uniqueness checks)

3. **Validation** (`validate.ts`):
   - Scans all rows, columns, and 3×3 boxes for duplicate digits
   - Returns per-cell conflict info plus affected rows/cols/boxes
   - Win detection: all cells filled, matches solution, no conflicts

### Persistence

All game state is saved to `localStorage` under key `sudoku-games-v1`:
- Multiple in-progress games
- Completed games (with ability to review)
- Help count per game
- Full undo/redo move history
- Last active game tracking

Hydration happens at app startup in `main.ts`. Old saved games are gracefully backfilled with defaults for new fields.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (hot reload)
npm run dev

# The dev server runs at http://localhost:5173 by default
```

For network access from other devices:
```bash
npm run dev -- --host 0.0.0.0
```

---

## Building & Deploying

### Build for production

```bash
npm run build
```

Build output goes to `dist/`. The build step:
1. Generates PWA icons from SVG (`scripts/generate-pwa-icons.mjs`)
2. Type-checks with `vue-tsc -b`
3. Bundles with Vite
4. Generates service worker with Workbox (16+ assets precached)

### Deploy to S3 + CloudFront

The repo includes deployment scripts (generated from a provisioning tool):

```bash
# 1. Load AWS credentials (not committed — gitignored)
set -a && source ./uploader-aws-credentials.env && set +a

# 2. Upload to S3
./upload-bohdan-sudoku.sh ./dist --delete

# 3. Invalidate CloudFront cache
./invalidate-cloudfront-bohdan-sudoku.sh
```

**Live URL:** https://d327h6hurcq4re.cloudfront.net/

> **Note:** Deployment is manual. The upload script syncs `./dist` to the `bohdan-sudoku` S3 bucket in `ca-central-1`. The invalidation script clears CloudFront edge caches for distribution `E38FWYFXOLY6R4`.

---

## Development

### Project commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with hot reload |
| `npm run build` | Type-check, generate icons, build for production |
| `npm run preview` | Preview the production build locally |
| `npm run icons` | Regenerate PWA icons only |

### Tech notes

- **State management:** Pinia Options API store (`defineStore('games', {...})`) with `state`, `getters`, and `actions`
- **Persistence:** Manual `localStorage` sync (debounced 300ms) — no persistence plugin
- **Cell data model:** Runtime uses `Set<number>` for notes; serialized as `number[]` for storage
- **Grid representation:** Flat `number[]` array of 81 cells (row-major), 0 = empty
- **Touch targets:** All interactive elements are minimum 44×44px (WCAG guideline)
- **Safe areas:** Uses `env(safe-area-inset-bottom)` for notched devices

import { defineStore } from 'pinia'
import { cellsFromPuzzle, serializeCells, type Cell } from '../puzzle'
import { generatePuzzle } from '../sudoku/generator'
import { isWin } from '../sudoku/validate'
import { progressPercent } from '../sudoku/board'
import type { Difficulty, PersistedState, SavedGame } from '../types/game'
import { STORAGE_KEY } from '../types/game'

let persistTimer: ReturnType<typeof setTimeout> | null = null

/** Generate a unique game id; falls back when randomUUID is unavailable (e.g. HTTP on LAN). */
function newId(): string {
  if (typeof crypto?.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6]! & 0x0f) | 0x40
    bytes[8] = (bytes[8]! & 0x3f) | 0x80
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const useGamesStore = defineStore('games', {
  state: (): PersistedState => ({
    games: [],
    lastActiveGameId: null,
  }),

  getters: {
    getGame: (state) => (id: string) => state.games.find((g) => g.id === id),

    inProgressGames(state): SavedGame[] {
      return state.games
        .filter((g) => g.status === 'playing')
        .sort((a, b) => b.updatedAt - a.updatedAt)
    },

    completedGames(state): SavedGame[] {
      return state.games
        .filter((g) => g.status === 'won')
        .sort((a, b) => b.updatedAt - a.updatedAt)
    },

    lastInProgress(state): SavedGame | undefined {
      if (state.lastActiveGameId) {
        const active = state.games.find((g) => g.id === state.lastActiveGameId)
        if (active?.status === 'playing') return active
      }
      return state.games
        .filter((g) => g.status === 'playing')
        .sort((a, b) => b.updatedAt - a.updatedAt)[0]
    },

    gameProgress: () => (game: SavedGame) => {
      const grid = game.cells.map((c) => c.value ?? 0)
      return progressPercent(grid, game.puzzle)
    },
  },

  actions: {
    hydrate() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const data = JSON.parse(raw) as PersistedState
        this.games = (data.games ?? []).map((g) => ({ ...g, helpCount: g.helpCount ?? 0 }))
        this.lastActiveGameId = data.lastActiveGameId ?? null
      } catch {
        this.games = []
        this.lastActiveGameId = null
      }
    },

    persist() {
      if (persistTimer) clearTimeout(persistTimer)
      persistTimer = setTimeout(() => {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            games: this.games,
            lastActiveGameId: this.lastActiveGameId,
          }),
        )
      }, 300)
    },

    setActiveGame(id: string) {
      const game = this.getGame(id)
      if (!game || game.status !== 'playing') return
      this.lastActiveGameId = id
      this.persist()
    },

    createGame(difficulty: Difficulty): string {
      const { puzzle, solution } = generatePuzzle(difficulty)
      const now = Date.now()
      const id = newId()
      const game: SavedGame = {
        id,
        puzzle,
        solution,
        cells: serializeCells(cellsFromPuzzle(puzzle)),
        difficulty,
        status: 'playing',
        createdAt: now,
        updatedAt: now,
        helpCount: 0,
      }
      this.games.unshift(game)
      this.lastActiveGameId = id
      this.persist()
      return id
    },

    updateGame(id: string, cells: Cell[]) {
      const game = this.getGame(id)
      if (!game || game.status === 'won') return

      game.cells = serializeCells(cells)
      game.updatedAt = Date.now()

      if (isWin(cells, game.solution)) {
        game.status = 'won'
        if (this.lastActiveGameId === id) {
          this.lastActiveGameId = this.inProgressGames[0]?.id ?? null
        }
      }

      this.persist()
    },

    useHelp(id: string) {
      const game = this.getGame(id)
      if (!game) return

      game.helpCount++
      this.persist()
    },

    deleteGame(id: string) {
      const game = this.getGame(id)
      if (!game || game.status !== 'playing') return

      this.games = this.games.filter((g) => g.id !== id)
      if (this.lastActiveGameId === id) {
        this.lastActiveGameId = this.inProgressGames[0]?.id ?? null
      }
      this.persist()
    },
  },
})

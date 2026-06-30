export type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'
export type GameStatus = 'playing' | 'won'

export interface SavedCell {
  value: number | null
  notes: number[]
  given: boolean
}

export interface SavedGame {
  id: string
  puzzle: string
  solution: string
  cells: SavedCell[]
  difficulty: Difficulty
  status: GameStatus
  createdAt: number
  updatedAt: number
}

export interface PersistedState {
  games: SavedGame[]
  lastActiveGameId: string | null
}

export const STORAGE_KEY = 'sudoku-games-v1'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  extreme: 'Extreme',
}

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard', 'extreme']

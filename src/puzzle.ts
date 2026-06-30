import type { SavedCell, SavedGame } from './types/game'

export interface Cell {
  value: number | null
  notes: Set<number>
  given: boolean
}

/** Build initial board state from a puzzle string */
export function createBoard(puzzle: string): Cell[] {
  return puzzle.split('').map((char) => {
    const n = Number(char)
    return {
      value: n || null,
      notes: new Set<number>(),
      given: n > 0,
    }
  })
}

/** Runtime Cell[] → storable SavedCell[] */
export function serializeCells(cells: Cell[]): SavedCell[] {
  return cells.map((c) => ({
    value: c.value,
    notes: [...c.notes],
    given: c.given,
  }))
}

/** SavedCell[] → runtime Cell[] */
export function deserializeCells(saved: SavedCell[]): Cell[] {
  return saved.map((c) => ({
    value: c.value,
    notes: new Set(c.notes),
    given: c.given,
  }))
}

/** Create fresh cells from puzzle for new game */
export function cellsFromPuzzle(puzzle: string): Cell[] {
  return createBoard(puzzle)
}

/** Get runtime cells from saved game */
export function cellsFromGame(game: SavedGame): Cell[] {
  return deserializeCells(game.cells)
}

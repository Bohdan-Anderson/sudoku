export type Grid = number[]

export const SIZE = 9
export const CELL_COUNT = 81

/** Row-major index from row/col */
export function index(row: number, col: number) {
  return row * SIZE + col
}

/** Row and col from flat index */
export function rowCol(i: number) {
  return { row: Math.floor(i / SIZE), col: i % SIZE }
}

/** Box top-left cell index for a given cell */
export function boxStart(i: number) {
  const { row, col } = rowCol(i)
  return index(Math.floor(row / 3) * 3, Math.floor(col / 3) * 3)
}

/** All indices sharing row, col, or box with i (excluding i) */
export function peers(i: number): number[] {
  const { row, col } = rowCol(i)
  const boxRow = Math.floor(row / 3) * 3
  const boxCol = Math.floor(col / 3) * 3
  const result: number[] = []

  for (let c = 0; c < SIZE; c++) {
    const p = index(row, c)
    if (p !== i) result.push(p)
  }
  for (let r = 0; r < SIZE; r++) {
    const p = index(r, col)
    if (p !== i && !result.includes(p)) result.push(p)
  }
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const p = index(r, c)
      if (p !== i && !result.includes(p)) result.push(p)
    }
  }

  return result
}

/** Parse 81-char puzzle string into grid (0 = empty) */
export function gridFromPuzzle(puzzle: string): Grid {
  return puzzle.split('').map((c) => Number(c))
}

/** Serialize grid to 81-char string */
export function puzzleString(grid: Grid): string {
  return grid.map((n) => String(n)).join('')
}

/** Empty 81-cell grid */
export function emptyGrid(): Grid {
  return new Array(CELL_COUNT).fill(0)
}

/** Clone grid */
export function cloneGrid(grid: Grid): Grid {
  return [...grid]
}

/** Valid placement at index (ignores empty check) */
export function isValidAt(grid: Grid, i: number, digit: number): boolean {
  if (digit === 0) return true
  return !peers(i).some((p) => grid[p] === digit)
}

/** Digits 1-9 valid at index */
export function candidates(grid: Grid, i: number): number[] {
  if (grid[i] !== 0) return []
  const result: number[] = []
  for (let d = 1; d <= 9; d++) {
    if (isValidAt(grid, i, d)) result.push(d)
  }
  return result
}

/** Count filled cells */
export function filledCount(grid: Grid): number {
  return grid.filter((n) => n > 0).length
}

/** Progress 0-100 from user-filled cells vs empty in original puzzle */
export function progressPercent(grid: Grid, puzzle: string): number {
  const initial = gridFromPuzzle(puzzle)
  let total = 0
  let filled = 0
  for (let i = 0; i < CELL_COUNT; i++) {
    if (initial[i] === 0) {
      total++
      if (grid[i] > 0) filled++
    }
  }
  return total === 0 ? 100 : Math.round((filled / total) * 100)
}

import type { Cell } from '../puzzle'
import { CELL_COUNT, gridFromPuzzle, index, rowCol, type Grid } from './board'

export interface ConflictInfo {
  /** Cells that hold a duplicate digit in their row, column, or box */
  cells: Set<number>
  rows: Set<number>
  cols: Set<number>
  boxes: Set<number>
}

function gridFromCells(cells: Cell[]): Grid {
  return cells.map((c) => c.value ?? 0)
}

function boxIndex(i: number) {
  const { row, col } = rowCol(i)
  return Math.floor(row / 3) * 3 + Math.floor(col / 3)
}

/** Mark all cells sharing a duplicated digit within a group of indices */
function findDuplicatesInGroup(group: number[], grid: Grid, cells: Set<number>) {
  const byDigit = new Map<number, number[]>()

  for (const i of group) {
    const digit = grid[i]
    if (digit === 0) continue
    const list = byDigit.get(digit) ?? []
    list.push(i)
    byDigit.set(digit, list)
  }

  for (const indices of byDigit.values()) {
    if (indices.length > 1) {
      indices.forEach((i) => cells.add(i))
    }
  }
}

/** Detect row, column, and box duplicates across the whole board */
export function getConflictInfo(cells: Cell[]): ConflictInfo {
  const grid = gridFromCells(cells)
  const conflictCells = new Set<number>()
  const rows = new Set<number>()
  const cols = new Set<number>()
  const boxes = new Set<number>()

  for (let row = 0; row < 9; row++) {
    const group = Array.from({ length: 9 }, (_, col) => index(row, col))
    const before = conflictCells.size
    findDuplicatesInGroup(group, grid, conflictCells)
    if (conflictCells.size > before) rows.add(row)
  }

  for (let col = 0; col < 9; col++) {
    const group = Array.from({ length: 9 }, (_, row) => index(row, col))
    const before = conflictCells.size
    findDuplicatesInGroup(group, grid, conflictCells)
    if (conflictCells.size > before) cols.add(col)
  }

  for (let box = 0; box < 9; box++) {
    const boxRow = Math.floor(box / 3) * 3
    const boxCol = (box % 3) * 3
    const group: number[] = []
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        group.push(index(boxRow + r, boxCol + c))
      }
    }
    const before = conflictCells.size
    findDuplicatesInGroup(group, grid, conflictCells)
    if (conflictCells.size > before) boxes.add(box)
  }

  return { cells: conflictCells, rows, cols, boxes }
}

export function getConflicts(cells: Cell[]): Set<number> {
  return getConflictInfo(cells).cells
}

/** All cells filled, no conflicts, matches solution */
export function isWin(cells: Cell[], solution: string): boolean {
  const grid = gridFromCells(cells)
  const answer = gridFromPuzzle(solution)

  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] === 0) return false
    if (grid[i] !== answer[i]) return false
  }

  return getConflictInfo(cells).cells.size === 0
}

/** Grid from cells for progress etc. */
export function cellsToGrid(cells: Cell[]): Grid {
  return gridFromCells(cells)
}

export { boxIndex }

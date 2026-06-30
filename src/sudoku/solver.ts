import { CELL_COUNT, candidates, cloneGrid, type Grid } from './board'

/** Solve grid in-place via backtracking with MRV. Returns false if unsolvable. */
export function solve(grid: Grid): boolean {
  let best = -1
  let bestCands: number[] = []

  for (let i = 0; i < CELL_COUNT; i++) {
    if (grid[i] !== 0) continue
    const cands = candidates(grid, i)
    if (cands.length === 0) return false
    if (best === -1 || cands.length < bestCands.length) {
      best = i
      bestCands = cands
    }
  }

  if (best === -1) return true

  for (const digit of bestCands) {
    grid[best] = digit
    if (solve(grid)) return true
    grid[best] = 0
  }

  return false
}

/** Count solutions up to limit (for uniqueness check) */
export function countSolutions(grid: Grid, limit = 2): number {
  const work = cloneGrid(grid)
  let count = 0

  function search(): void {
    if (count >= limit) return

    let best = -1
    let bestCands: number[] = []

    for (let i = 0; i < CELL_COUNT; i++) {
      if (work[i] !== 0) continue
      const cands = candidates(work, i)
      if (cands.length === 0) return
      if (best === -1 || cands.length < bestCands.length) {
        best = i
        bestCands = cands
      }
    }

    if (best === -1) {
      count++
      return
    }

    for (const digit of bestCands) {
      work[best] = digit
      search()
      work[best] = 0
      if (count >= limit) return
    }
  }

  search()
  return count
}

import type { Difficulty } from '../types/game'
import {
  CELL_COUNT,
  cloneGrid,
  emptyGrid,
  gridFromPuzzle,
  index,
  puzzleString,
} from './board'
import { countSolutions, solve } from './solver'

const CLUE_TARGETS: Record<Difficulty, [number, number]> = {
  easy: [36, 45],
  medium: [28, 35],
  hard: [22, 27],
  extreme: [17, 21],
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

function randomDigit(): number {
  return Math.floor(Math.random() * 9) + 1
}

/** Fill diagonal 3x3 boxes with random valid digits */
function fillDiagonalBoxes(grid: number[]): void {
  for (let b = 0; b < 3; b++) {
    const used = new Set<number>()
    const row0 = b * 3
    const col0 = b * 3
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        let digit: number
        do {
          digit = randomDigit()
        } while (used.has(digit))
        used.add(digit)
        grid[index(row0 + r, col0 + c)] = digit
      }
    }
  }
}

function generateFullGrid(): number[] {
  const grid = emptyGrid()
  fillDiagonalBoxes(grid)
  solve(grid)
  return grid
}

function carvePuzzle(solution: number[], targetClues: number): string {
  const puzzle = cloneGrid(solution)
  const indices = shuffle([...Array(CELL_COUNT).keys()])

  for (const i of indices) {
    if (puzzle.filter((n) => n > 0).length <= targetClues) break

    const backup = puzzle[i]!
    puzzle[i] = 0
    const test = cloneGrid(puzzle)
    if (countSolutions(test, 2) !== 1) {
      puzzle[i] = backup
    }
  }

  return puzzleString(puzzle)
}

/** Generate a puzzle with unique solution */
export function generatePuzzle(difficulty: Difficulty): { puzzle: string; solution: string } {
  const [minClues, maxClues] = CLUE_TARGETS[difficulty]
  const target = minClues + Math.floor(Math.random() * (maxClues - minClues + 1))

  for (let attempt = 0; attempt < (difficulty === 'extreme' ? 20 : 10); attempt++) {
    const solutionGrid = generateFullGrid()
    const puzzle = carvePuzzle(solutionGrid, target)
    if (countSolutions(gridFromPuzzle(puzzle), 2) === 1) {
      return { puzzle, solution: puzzleString(solutionGrid) }
    }
  }

  const solutionGrid = generateFullGrid()
  return {
    puzzle: puzzleString(solutionGrid),
    solution: puzzleString(solutionGrid),
  }
}

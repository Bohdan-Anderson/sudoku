export interface PickerHit {
  action: 'clear' | 'value' | 'note'
  digit?: number
}

export const SLICES = 10
export const CX = 50
export const CY = 50
export const R_EDGE = 48
export const R_CENTER = 14
export const SLICE = (2 * Math.PI) / SLICES

export const PIE_FRONT_MAX = 220
export const PIE_BACK_MAX = 310

export const LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '×']

/** Rendered pie sizes matching CSS min(vw, max) */
export function pieSizes() {
  const vw = window.innerWidth / 100
  return {
    front: Math.min(vw * 55, PIE_FRONT_MAX),
    back: Math.min(vw * 75, PIE_BACK_MAX),
  }
}

/** Keep picker center in viewport so the outer ring is never clipped */
export function clampPickerPosition(
  x: number,
  y: number,
  backSize: number,
  padding = 8,
) {
  const r = backSize / 2 + padding
  return {
    x: Math.min(Math.max(x, r), window.innerWidth - r),
    y: Math.min(Math.max(y, r), window.innerHeight - r),
  }
}

/** Start angle for slice i; offset so × (slice 9) sits at top center */
export function startAngle(i: number) {
  return -Math.PI / 2 + (i + 0.5) * SLICE
}

export function labelPos(i: number, r: number) {
  const mid = startAngle(i) + SLICE / 2
  return { x: CX + Math.cos(mid) * r, y: CY + Math.sin(mid) * r }
}

export function slicePath(i: number, r: number) {
  const a0 = startAngle(i)
  const a1 = a0 + SLICE
  const x0 = CX + r * Math.cos(a0)
  const y0 = CY + r * Math.sin(a0)
  const x1 = CX + r * Math.cos(a1)
  const y1 = CY + r * Math.sin(a1)
  const large = SLICE > Math.PI ? 1 : 0
  return `M${CX},${CY} L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`
}

function wedgeIndex(dx: number, dy: number) {
  let angle = Math.atan2(dy, dx)
  angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI)
  return Math.floor(((angle - SLICE / 2 + 2 * Math.PI) % (2 * Math.PI)) / SLICE) % SLICES
}

/** Hit-test in viewport pixels relative to picker center */
export function hitTest(
  clientX: number,
  clientY: number,
  centerX: number,
  centerY: number,
  frontSize: number,
  backSize: number,
): PickerHit | null {
  const dx = clientX - centerX
  const dy = clientY - centerY
  const dist = Math.hypot(dx, dy)
  const centerR = (R_CENTER / 100) * frontSize

  if (dist < centerR) return null

  const frontR = (R_EDGE / 100) * frontSize
  const backR = (R_EDGE / 100) * backSize
  const wedge = wedgeIndex(dx, dy)

  if (wedge === 9) return { action: 'clear' }

  const digit = wedge + 1
  if (dist <= frontR) return { action: 'value', digit }
  if (dist <= backR) return { action: 'note', digit }
  return null
}

export function sliceHighlight(
  highlight: PickerHit | null,
  sliceIndex: number,
  ring: 'front' | 'back',
) {
  if (!highlight) return false
  if (sliceIndex === 9) return highlight.action === 'clear'
  const digit = sliceIndex + 1
  if (ring === 'front') return highlight.action === 'value' && highlight.digit === digit
  return highlight.action === 'note' && highlight.digit === digit
}

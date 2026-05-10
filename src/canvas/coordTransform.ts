import type { ViewState } from '@/types/tools'
import type { GardenElement, Point } from '@/types/elements'
import { EDGE_SNAP_THRESHOLD } from '@/constants/grid'

// ── World ↔ Screen ────────────────────────────────────────────────────────────

export function worldToScreen(wx: number, wy: number, view: ViewState): Point {
  return {
    x: view.panX + wx * view.zoom,
    y: view.panY + wy * view.zoom,
  }
}

export function screenToWorld(sx: number, sy: number, view: ViewState): Point {
  return {
    x: (sx - view.panX) / view.zoom,
    y: (sy - view.panY) / view.zoom,
  }
}

// ── Grid snap ────────────────────────────────────────────────────────────────

export function snapToGrid(wx: number, wy: number, gridStep: number): Point {
  return {
    x: Math.round(wx / gridStep) * gridStep,
    y: Math.round(wy / gridStep) * gridStep,
  }
}

// ── Element snap points ───────────────────────────────────────────────────────

function elementSnapPoints(el: GardenElement): Point[] {
  if (el.type === 'rect') {
    const { x, y, width: w, height: h } = el
    return [
      { x, y }, { x: x + w, y }, { x, y: y + h }, { x: x + w, y: y + h },
      { x: x + w / 2, y }, { x: x + w / 2, y: y + h },
      { x, y: y + h / 2 }, { x: x + w, y: y + h / 2 },
      { x: x + w / 2, y: y + h / 2 },
    ]
  }
  if (el.type === 'circle') {
    const { cx, cy, radius: r } = el
    return [
      { x: cx, y: cy },
      { x: cx - r, y: cy }, { x: cx + r, y: cy },
      { x: cx, y: cy - r }, { x: cx, y: cy + r },
    ]
  }
  if (el.type === 'poly' || el.type === 'line') {
    const pts = el.points
    const snap: Point[] = [...pts]
    for (let i = 0; i < pts.length - 1; i++) {
      snap.push({ x: (pts[i].x + pts[i + 1].x) / 2, y: (pts[i].y + pts[i + 1].y) / 2 })
    }
    return snap
  }
  if (el.type === 'symbol') {
    return [{ x: el.cx, y: el.cy }]
  }
  return []
}

/**
 * Returns the unique X and Y axis values that represent element **edges only**
 * (no centres or midpoints). Used for axis-alignment snapping so the guide
 * lines align to real edges rather than interior reference points.
 */
function elementEdgeAxes(el: GardenElement): { xs: number[]; ys: number[] } {
  if (el.type === 'rect') {
    return { xs: [el.x, el.x + el.width], ys: [el.y, el.y + el.height] }
  }
  if (el.type === 'circle') {
    return {
      xs: [el.cx - el.radius, el.cx + el.radius],
      ys: [el.cy - el.radius, el.cy + el.radius],
    }
  }
  if (el.type === 'poly' || el.type === 'line') {
    // Each vertex is an actual edge point
    return {
      xs: el.points.map((p) => p.x),
      ys: el.points.map((p) => p.y),
    }
  }
  if (el.type === 'symbol') {
    // Snap to outer edges (centre ± scale)
    return {
      xs: [el.cx - el.scale, el.cx + el.scale],
      ys: [el.cy - el.scale, el.cy + el.scale],
    }
  }
  return { xs: [], ys: [] }
}

export interface SnapResult {
  x: number
  y: number
  snapped: boolean
  /** When axis-alignment snapping is active, indicates which axes are aligned */
  alignedAxis?: 'x' | 'y' | 'xy'
}

/** Grid snap + element-edge magnetic snap + axis-alignment snap.
 *
 * Priority order:
 *   1. Exact point snap (corner / centre / midpoint) — strongest
 *   2. Axis-alignment snap (same X or Y as another element's edge) — assistive
 *   3. Grid snap — fallback
 */
export function snapPoint(
  wx: number,
  wy: number,
  gridStep: number,
  snapEnabled: boolean,
  elements: GardenElement[],
  excludeIds: string[] = []
): SnapResult {
  if (!snapEnabled) return { x: wx, y: wy, snapped: false }

  // 1. Try exact point snap
  let bestDist = EDGE_SNAP_THRESHOLD
  let bestPt: Point | null = null

  for (const el of elements) {
    if (excludeIds.includes(el.id)) continue
    for (const pt of elementSnapPoints(el)) {
      const d = Math.hypot(pt.x - wx, pt.y - wy)
      if (d < bestDist) {
        bestDist = d
        bestPt = pt
      }
    }
  }

  if (bestPt) return { x: bestPt.x, y: bestPt.y, snapped: true }

  // 2. Axis-alignment snap — snap X and/or Y independently to element edge axes.
  //    Intentionally uses only real edges (not centres/midpoints) so guide lines
  //    align to actual element boundaries.
  //    Uses a slightly larger threshold than exact-point snap to feel assistive.
  const axisThreshold = EDGE_SNAP_THRESHOLD * 1.5
  let snapX: number | null = null
  let snapY: number | null = null
  let bestXDist = axisThreshold
  let bestYDist = axisThreshold

  for (const el of elements) {
    if (excludeIds.includes(el.id)) continue
    const { xs, ys } = elementEdgeAxes(el)
    for (const ex of xs) {
      const dx = Math.abs(ex - wx)
      if (dx < bestXDist) { bestXDist = dx; snapX = ex }
    }
    for (const ey of ys) {
      const dy = Math.abs(ey - wy)
      if (dy < bestYDist) { bestYDist = dy; snapY = ey }
    }
  }

  if (snapX !== null || snapY !== null) {
    const rx = snapX ?? wx
    const ry = snapY ?? wy
    let alignedAxis: 'x' | 'y' | 'xy'
    if (snapX !== null && snapY !== null) {
      alignedAxis = 'xy'
    } else if (snapX !== null) {
      alignedAxis = 'x'
    } else {
      alignedAxis = 'y'
    }
    return { x: rx, y: ry, snapped: true, alignedAxis }
  }

  // 3. Fall back to grid snap
  const g = snapToGrid(wx, wy, gridStep)
  return { x: g.x, y: g.y, snapped: false }
}

// ── Rotation ─────────────────────────────────────────────────────────────────

export function rotatePoint(
  px: number,
  py: number,
  cx: number,
  cy: number,
  angle: number
): Point {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = px - cx
  const dy = py - cy
  return {
    x: cx + dx * cos - dy * sin,
    y: cy + dx * sin + dy * cos,
  }
}

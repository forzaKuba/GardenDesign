import type { GardenElement, Point } from '@/types/elements'
import type { ViewState } from '@/types/tools'
import { worldToScreen, rotatePoint } from './coordTransform'
import { HANDLE_RADIUS, ROTATION_HANDLE_OFFSET_M } from '@/constants/grid'

// ── Bounding box ─────────────────────────────────────────────────────────────

export interface Bbox {
  x: number
  y: number
  w: number
  h: number
}

export function getBbox(el: GardenElement): Bbox {
  if (el.type === 'rect') return { x: el.x, y: el.y, w: el.width, h: el.height }
  if (el.type === 'circle')
    return { x: el.cx - el.radius, y: el.cy - el.radius, w: el.radius * 2, h: el.radius * 2 }
  if (el.type === 'poly' || el.type === 'line') {
    const xs = el.points.map((p) => p.x)
    const ys = el.points.map((p) => p.y)
    const mnx = Math.min(...xs), mxx = Math.max(...xs)
    const mny = Math.min(...ys), mxy = Math.max(...ys)
    return { x: mnx, y: mny, w: mxx - mnx || 0.1, h: mxy - mny || 0.1 }
  }
  if (el.type === 'text') return { x: el.x, y: el.y, w: el.text.length * 0.4 + 0.3, h: 0.8 }
  if (el.type === 'image') return { x: el.x, y: el.y, w: el.width, h: el.height }
  if (el.type === 'symbol')
    return { x: el.cx - el.scale, y: el.cy - el.scale, w: el.scale * 2, h: el.scale * 2 }
  if (el.type === 'dimension') {
    const mnx = Math.min(el.x1, el.x2), mxx = Math.max(el.x1, el.x2)
    const mny = Math.min(el.y1, el.y2), mxy = Math.max(el.y1, el.y2)
    return { x: mnx, y: mny, w: mxx - mnx || 0.1, h: mxy - mny || 0.1 }
  }
  return { x: 0, y: 0, w: 1, h: 1 }
}

export function bboxCenter(b: Bbox): Point {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 }
}

// ── Point in polygon ─────────────────────────────────────────────────────────

function pointInPolygon(px: number, py: number, pts: Point[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x, yi = pts[i].y
    const xj = pts[j].x, yj = pts[j].y
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// ── Near line segment ────────────────────────────────────────────────────────

function nearSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  tol = 0.3
): boolean {
  const dx = bx - ax, dy = by - ay
  const l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2)) : 0
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy)) < tol
}

// ── Hit test ─────────────────────────────────────────────────────────────────

export function hitTestElement(wx: number, wy: number, el: GardenElement): boolean {
  if (el.locked || !el.visible) return false

  // Un-rotate the query point around the element center
  const b = getBbox(el)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  let px = wx, py = wy
  if (el.rotation !== 0) {
    const pt = rotatePoint(wx, wy, cx, cy, -el.rotation)
    px = pt.x
    py = pt.y
  }

  if (el.type === 'rect') return px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height
  if (el.type === 'circle') return Math.hypot(px - el.cx, py - el.cy) <= el.radius
  if (el.type === 'poly') {
    if (!el.closed) {
      const pts = el.points
      for (let i = 0; i < pts.length - 1; i++) {
        if (nearSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y)) return true
      }
      return false
    }
    return pointInPolygon(px, py, el.points)
  }
  if (el.type === 'line') {
    const pts = el.points
    for (let i = 0; i < pts.length - 1; i++) {
      if (nearSegment(px, py, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, el.strokeWidth / 2 + 0.2)) return true
    }
    return false
  }
  if (el.type === 'text') {
    const b2 = getBbox(el)
    return px >= b2.x && px <= b2.x + b2.w && py >= b2.y && py <= b2.y + b2.h
  }
  if (el.type === 'image') return px >= el.x && px <= el.x + el.width && py >= el.y && py <= el.y + el.height
  if (el.type === 'symbol') return Math.hypot(px - el.cx, py - el.cy) <= el.scale
  if (el.type === 'dimension') {
    return (
      nearSegment(px, py, el.x1, el.y1, el.x2, el.y2) ||
      nearSegment(px, py, el.x1, el.y1 - el.offset, el.x2, el.y2 - el.offset)
    )
  }
  return false
}

/** Returns topmost element (highest zIndex) at world position. */
export function topElementAt(wx: number, wy: number, elements: GardenElement[]): GardenElement | null {
  return [...elements]
    .filter((e) => e.visible && !e.locked)
    .sort((a, b) => b.zIndex - a.zIndex)
    .find((e) => hitTestElement(wx, wy, e)) ?? null
}

/** Returns all elements whose bbox overlaps the given screen-space drag rect. */
export function elementsInRect(
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
  elements: GardenElement[],
  view: ViewState
): GardenElement[] {
  const x1 = Math.min(rectX, rectX + rectW)
  const y1 = Math.min(rectY, rectY + rectH)
  const x2 = Math.max(rectX, rectX + rectW)
  const y2 = Math.max(rectY, rectY + rectH)

  return elements.filter((e) => {
    if (!e.visible || e.locked) return false
    const b = getBbox(e)
    const s1 = worldToScreen(b.x, b.y, view)
    const s2 = worldToScreen(b.x + b.w, b.y + b.h, view)
    return s1.x < x2 && s2.x > x1 && s1.y < y2 && s2.y > y1
  })
}

// ── Resize handles ───────────────────────────────────────────────────────────

export type HandleId =
  | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
  | 'rot'
  | 'p0' | 'p1' | string // poly vertex or line endpoint

export interface Handle {
  id: HandleId
  wx: number
  wy: number
  cursor: string
}

export function getHandles(el: GardenElement): Handle[] {
  if (el.type === 'poly') {
    return el.points.map((p, i) => ({ id: `p${i}` as HandleId, wx: p.x, wy: p.y, cursor: 'grab' }))
  }
  if (el.type === 'line') {
    return el.points.map((p, i) => ({ id: `p${i}` as HandleId, wx: p.x, wy: p.y, cursor: 'grab' }))
  }
  if (el.type === 'text') return []
  if (el.type === 'dimension') {
    return [
      { id: 'p0', wx: el.x1, wy: el.y1, cursor: 'grab' },
      { id: 'p1', wx: el.x2, wy: el.y2, cursor: 'grab' },
    ]
  }

  const b = getBbox(el)
  const cx = b.x + b.w / 2
  const cy = b.y + b.h / 2
  const rot = (el.rotation ?? 0)

  function rp(wx: number, wy: number): { wx: number; wy: number } {
    if (!rot) return { wx, wy }
    const p = rotatePoint(wx, wy, cx, cy, rot)
    return { wx: p.x, wy: p.y }
  }

  const corners: Handle[] = [
    { id: 'nw', ...rp(b.x, b.y), cursor: 'nw-resize' },
    { id: 'n', ...rp(b.x + b.w / 2, b.y), cursor: 'n-resize' },
    { id: 'ne', ...rp(b.x + b.w, b.y), cursor: 'ne-resize' },
    { id: 'e', ...rp(b.x + b.w, b.y + b.h / 2), cursor: 'e-resize' },
    { id: 'se', ...rp(b.x + b.w, b.y + b.h), cursor: 'se-resize' },
    { id: 's', ...rp(b.x + b.w / 2, b.y + b.h), cursor: 's-resize' },
    { id: 'sw', ...rp(b.x, b.y + b.h), cursor: 'sw-resize' },
    { id: 'w', ...rp(b.x, b.y + b.h / 2), cursor: 'w-resize' },
  ]

  // Rotation handle: above top-centre
  const rotPt = rp(b.x + b.w / 2, b.y - ROTATION_HANDLE_OFFSET_M)
  corners.push({ id: 'rot', ...rotPt, cursor: 'grab' })

  return corners
}

export function findHandleAt(
  sx: number,
  sy: number,
  el: GardenElement,
  view: ViewState
): Handle | null {
  for (const h of getHandles(el)) {
    const s = worldToScreen(h.wx, h.wy, view)
    if (Math.hypot(sx - s.x, sy - s.y) <= HANDLE_RADIUS + 3) return h
  }
  return null
}

// ── Resize application ────────────────────────────────────────────────────────

export function applyResize(
  _el: GardenElement,
  handleId: HandleId,
  dwx: number,
  dwy: number,
  _orig: GardenElement
): GardenElement {
  const c = { ..._orig } as GardenElement

  if (c.type === 'rect') {
    let { x, y, width: w, height: h } = c
    const id = handleId
    if (id.includes('n')) { y += dwy; h -= dwy }
    if (id.includes('s')) { h += dwy }
    if (id.includes('w')) { x += dwx; w -= dwx }
    if (id.includes('e')) { w += dwx }
    if (w < 0.1) { w = 0.1; if (!id.includes('e')) x = c.x + c.width - 0.1 }
    if (h < 0.1) { h = 0.1; if (!id.includes('s')) y = c.y + c.height - 0.1 }
    return { ...c, x, y, width: w, height: h }
  }

  if (c.type === 'circle') {
    const d = Math.hypot(dwx, dwy) * (dwx + dwy >= 0 ? 1 : -1)
    return { ...c, radius: Math.max(0.1, c.radius + d) }
  }

  if (c.type === 'image') {
    let { x, y, width: w, height: h } = c
    const id = handleId
    if (id.includes('n')) { y += dwy; h -= dwy }
    if (id.includes('s')) { h += dwy }
    if (id.includes('w')) { x += dwx; w -= dwx }
    if (id.includes('e')) { w += dwx }
    if (w < 0.1) w = 0.1
    if (h < 0.1) h = 0.1
    return { ...c, x, y, width: w, height: h }
  }

  if (c.type === 'symbol') {
    const d = Math.hypot(dwx, dwy) * (dwx + dwy >= 0 ? 1 : -1)
    return { ...c, scale: Math.max(0.1, c.scale + d) }
  }

  if (c.type === 'poly') {
    const idx = parseInt(handleId.replace('p', ''))
    if (!isNaN(idx) && idx < c.points.length) {
      const orig = _orig as typeof c
      const pts = [...c.points]
      pts[idx] = { x: orig.points[idx].x + dwx, y: orig.points[idx].y + dwy }
      return { ...c, points: pts }
    }
  }

  if (c.type === 'line') {
    const idx = parseInt(handleId.replace('p', ''))
    if (!isNaN(idx) && idx < c.points.length) {
      const orig = _orig as typeof c
      const pts = [...c.points]
      pts[idx] = { x: orig.points[idx].x + dwx, y: orig.points[idx].y + dwy }
      return { ...c, points: pts }
    }
  }

  if (c.type === 'dimension') {
    const orig = _orig as typeof c
    if (handleId === 'p0') return { ...c, x1: orig.x1 + dwx, y1: orig.y1 + dwy }
    if (handleId === 'p1') return { ...c, x2: orig.x2 + dwx, y2: orig.y2 + dwy }
  }

  return c
}

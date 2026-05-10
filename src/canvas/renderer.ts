import type { GardenElement } from '@/types/elements'
import type { ViewState } from '@/types/tools'
import type { GardenProject } from '@/types/project'
import { CATEGORIES } from '@/constants/categories'
import { SYMBOL_MAP } from '@/symbols/index'
import { worldToScreen } from './coordTransform'
import { getBbox, getHandles, Handle } from './hitTest'
import { HANDLE_RADIUS } from '@/constants/grid'

// ── Image cache ───────────────────────────────────────────────────────────────

const imageCache = new Map<string, HTMLImageElement>()

function getImage(el: { id: string; dataUrl: string }, onLoad: () => void): HTMLImageElement | null {
  const cached = imageCache.get(el.id)
  if (cached) return cached
  const img = new Image()
  img.onload = onLoad
  img.src = el.dataUrl
  imageCache.set(el.id, img)
  return img.complete ? img : null
}

// ── Renderer state ────────────────────────────────────────────────────────────

export interface RendererState {
  project: GardenProject
  view: ViewState
  selectedIds: string[]
  hoveredId: string | null
  dragSelectRect: { x: number; y: number; w: number; h: number } | null
  showGrid: boolean
  gridStep: number
  canvasBackground: 'light' | 'dark'
  previewElement: Partial<GardenElement> | null
  snapIndicator: { wx: number; wy: number } | null
}

// ── Main render ───────────────────────────────────────────────────────────────

export function render(
  ctx: CanvasRenderingContext2D,
  state: RendererState,
  scheduleRender: () => void
): void {
  const { project, view, selectedIds, hoveredId, dragSelectRect, previewElement, snapIndicator } = state
  const W = ctx.canvas.width / (window.devicePixelRatio || 1)
  const H = ctx.canvas.height / (window.devicePixelRatio || 1)
  const dpr = window.devicePixelRatio || 1

  ctx.save()
  ctx.scale(dpr, dpr)

  // 1. Background
  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = project.canvasBackground === 'dark' ? '#1a1a2e' : '#f0ede8'
  ctx.fillRect(0, 0, W, H)

  // 2. Grid
  if (project.showGrid) {
    drawGrid(ctx, view, W, H, project.gridStep, project.canvasBackground)
  }

  // 3. Elements (in layer order then z-order)
  const layerOrder = new Map(project.layers.map((l) => [l.id, l.order]))
  const visibleLayers = new Set(project.layers.filter((l) => l.visible).map((l) => l.id))

  const sortedEls = [...project.elements]
    .filter((e) => e.visible && visibleLayers.has(e.layerId))
    .sort((a, b) => {
      const lo = (layerOrder.get(a.layerId) ?? 0) - (layerOrder.get(b.layerId) ?? 0)
      return lo !== 0 ? lo : a.zIndex - b.zIndex
    })

  for (const el of sortedEls) {
    const isSelected = selectedIds.includes(el.id)
    const isHovered = hoveredId === el.id && !isSelected
    drawElement(ctx, el, view, isHovered, isSelected, false, scheduleRender)
  }

  // 4. Preview element (in-progress drawing ghost)
  if (previewElement) {
    ctx.globalAlpha = 0.55
    drawElement(ctx, previewElement as GardenElement, view, false, false, true, scheduleRender)
    ctx.globalAlpha = 1
  }

  // 5. Drag-select rect
  if (dragSelectRect) {
    ctx.strokeStyle = 'rgba(26,111,224,0.8)'
    ctx.fillStyle = 'rgba(26,111,224,0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.rect(
      dragSelectRect.x,
      dragSelectRect.y,
      dragSelectRect.w,
      dragSelectRect.h
    )
    ctx.fill()
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 6. Selection handles
  for (const id of selectedIds) {
    const el = project.elements.find((e) => e.id === id)
    if (el && el.visible) {
      drawSelectionHandles(ctx, el, view)
      drawDimensions(ctx, el, view)
    }
  }

  // 7. Snap indicator
  if (snapIndicator) {
    const s = worldToScreen(snapIndicator.wx, snapIndicator.wy, view)
    ctx.strokeStyle = 'rgba(26,111,224,0.7)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(s.x - 8, s.y)
    ctx.lineTo(s.x + 8, s.y)
    ctx.moveTo(s.x, s.y - 8)
    ctx.lineTo(s.x, s.y + 8)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 8. Compass + scale bar
  drawCompass(ctx, W - 44, 44)
  drawScaleBar(ctx, W, H, view)

  ctx.restore()
}

// ── Grid drawing ──────────────────────────────────────────────────────────────

function drawGrid(
  ctx: CanvasRenderingContext2D,
  view: ViewState,
  W: number,
  H: number,
  gridStep: number,
  bg: 'light' | 'dark'
): void {
  const dark = bg === 'dark'
  const minorColor = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'
  const majorColor = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.17)'

  // World coords of canvas corners
  const x0 = -view.panX / view.zoom
  const y0 = -view.panY / view.zoom
  const x1 = (W - view.panX) / view.zoom
  const y1 = (H - view.panY) / view.zoom

  ctx.save()
  ctx.lineWidth = 0.6

  // Minor lines
  ctx.strokeStyle = minorColor
  ctx.beginPath()
  for (let gx = Math.floor(x0 / gridStep) * gridStep; gx <= x1; gx += gridStep) {
    const sx = view.panX + gx * view.zoom
    ctx.moveTo(sx, 0)
    ctx.lineTo(sx, H)
  }
  for (let gy = Math.floor(y0 / gridStep) * gridStep; gy <= y1; gy += gridStep) {
    const sy = view.panY + gy * view.zoom
    ctx.moveTo(0, sy)
    ctx.lineTo(W, sy)
  }
  ctx.stroke()

  // Major lines (5× gridStep)
  const majorStep = gridStep * 5
  ctx.strokeStyle = majorColor
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let gx = Math.floor(x0 / majorStep) * majorStep; gx <= x1; gx += majorStep) {
    const sx = view.panX + gx * view.zoom
    ctx.moveTo(sx, 0)
    ctx.lineTo(sx, H)
  }
  for (let gy = Math.floor(y0 / majorStep) * majorStep; gy <= y1; gy += majorStep) {
    const sy = view.panY + gy * view.zoom
    ctx.moveTo(0, sy)
    ctx.lineTo(W, sy)
  }
  ctx.stroke()

  // Axis labels
  if (view.zoom >= 10) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.28)'
    ctx.font = `${Math.min(10, 10 * (view.zoom / 40))}px DM Mono, monospace`
    ctx.textAlign = 'center'
    for (let gx = Math.floor(x0 / majorStep) * majorStep; gx <= x1; gx += majorStep) {
      const sx = view.panX + gx * view.zoom
      if (sx > 18 && sx < W - 10) ctx.fillText(`${gx}m`, sx, 13)
    }
    ctx.textAlign = 'right'
    for (let gy = Math.floor(y0 / majorStep) * majorStep; gy <= y1; gy += majorStep) {
      const sy = view.panY + gy * view.zoom
      if (sy > 13 && sy < H - 5) ctx.fillText(`${gy}m`, 28, sy + 3)
    }
  }

  ctx.restore()
}

// ── Element drawing ───────────────────────────────────────────────────────────

function getCatStyle(el: GardenElement) {
  const cat = CATEGORIES[el.category]
  return {
    fill: el.fillColor ?? cat.fill,
    stroke: el.strokeColor ?? cat.stroke,
    dash: cat.dash,
  }
}

function drawElement(
  ctx: CanvasRenderingContext2D,
  el: GardenElement,
  view: ViewState,
  hov: boolean,
  sel: boolean,
  preview: boolean,
  scheduleRender: () => void
): void {
  if (!el.type) return
  ctx.save()
  ctx.globalAlpha = (ctx.globalAlpha * (el.opacity ?? 1))

  // Apply rotation around element center
  if (el.rotation) {
    const b = getBbox(el)
    const cx = view.panX + (b.x + b.w / 2) * view.zoom
    const cy = view.panY + (b.y + b.h / 2) * view.zoom
    ctx.translate(cx, cy)
    ctx.rotate(el.rotation)
    ctx.translate(-cx, -cy)
  }

  const lw = sel ? 2.5 : hov ? 2 : 1.5
  const style = getCatStyle(el)
  ctx.setLineDash(preview ? [6, 4] : style.dash)

  switch (el.type) {
    case 'rect': drawRect(ctx, el, view, style, lw); break
    case 'poly': drawPoly(ctx, el, view, style, lw); break
    case 'circle': drawCircle(ctx, el, view, style, lw); break
    case 'line': drawLine(ctx, el, view, style, lw); break
    case 'text': drawText(ctx, el, view, sel, hov); break
    case 'image': drawImage(ctx, el, view, scheduleRender); break
    case 'symbol': drawSymbol(ctx, el, view); break
    case 'dimension': drawDimensionEl(ctx, el, view); break
  }

  ctx.restore()
}

function drawRect(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'rect' },
  view: ViewState,
  style: ReturnType<typeof getCatStyle>,
  lw: number
): void {
  const s = worldToScreen(el.x, el.y, view)
  const sw = el.width * view.zoom
  const sh = el.height * view.zoom
  ctx.fillStyle = style.fill
  ctx.fillRect(s.x, s.y, sw, sh)
  ctx.strokeStyle = style.stroke
  ctx.lineWidth = lw
  ctx.strokeRect(s.x, s.y, sw, sh)

  // Label
  if (el.label && view.zoom >= 8) {
    drawLabel(ctx, el.label, s.x + sw / 2, s.y + sh / 2)
  }
  // Area label
  const area = el.width * el.height
  if (area >= 4 && sw > 60 && sh > 30 && view.zoom >= 8) {
    drawAreaLabel(ctx, area, s.x + sw / 2, s.y + sh / 2 + 14)
  }
}

function drawPoly(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'poly' },
  view: ViewState,
  style: ReturnType<typeof getCatStyle>,
  lw: number
): void {
  if (el.points.length < 2) return
  ctx.beginPath()
  const s0 = worldToScreen(el.points[0].x, el.points[0].y, view)
  ctx.moveTo(s0.x, s0.y)
  for (let i = 1; i < el.points.length; i++) {
    const s = worldToScreen(el.points[i].x, el.points[i].y, view)
    ctx.lineTo(s.x, s.y)
  }
  if (el.closed) ctx.closePath()
  ctx.fillStyle = style.fill
  ctx.fill()
  ctx.strokeStyle = style.stroke
  ctx.lineWidth = lw
  ctx.stroke()

  if (el.label && view.zoom >= 8) {
    const cx = el.points.reduce((s, p) => s + p.x, 0) / el.points.length
    const cy = el.points.reduce((s, p) => s + p.y, 0) / el.points.length
    const sc = worldToScreen(cx, cy, view)
    drawLabel(ctx, el.label, sc.x, sc.y)
  }
}

function drawCircle(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'circle' },
  view: ViewState,
  style: ReturnType<typeof getCatStyle>,
  lw: number
): void {
  const sc = worldToScreen(el.cx, el.cy, view)
  const sr = el.radius * view.zoom
  ctx.beginPath()
  ctx.arc(sc.x, sc.y, sr, 0, Math.PI * 2)
  ctx.fillStyle = style.fill
  ctx.fill()
  ctx.strokeStyle = style.stroke
  ctx.lineWidth = lw
  ctx.stroke()
  if (el.label && view.zoom >= 8) drawLabel(ctx, el.label, sc.x, sc.y)
}

function drawLine(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'line' },
  view: ViewState,
  style: ReturnType<typeof getCatStyle>,
  lw: number
): void {
  if (el.points.length < 2) return
  ctx.beginPath()
  const s0 = worldToScreen(el.points[0].x, el.points[0].y, view)
  ctx.moveTo(s0.x, s0.y)
  for (let i = 1; i < el.points.length; i++) {
    const s = worldToScreen(el.points[i].x, el.points[i].y, view)
    ctx.lineTo(s.x, s.y)
  }
  ctx.strokeStyle = style.stroke
  ctx.lineWidth = Math.max(lw, (el.strokeWidth ?? 0.1) * view.zoom)
  ctx.stroke()

  if (el.label && view.zoom >= 8) {
    const mid = Math.floor(el.points.length / 2)
    const sm = worldToScreen(el.points[mid].x, el.points[mid].y, view)
    ctx.setLineDash([])
    ctx.fillStyle = 'rgba(0,0,0,0.65)'
    ctx.font = `${Math.min(11, 11 * (view.zoom / 40))}px DM Sans, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(el.label, sm.x, sm.y - 4)
    ctx.textBaseline = 'alphabetic'
  }
}

function drawText(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'text' },
  view: ViewState,
  sel: boolean,
  hov: boolean
): void {
  const s = worldToScreen(el.x, el.y, view)
  const fs = Math.max(8, Math.min(32, (el.fontSize ?? 0.5) * view.zoom))
  ctx.font = `${el.fontWeight ?? 'normal'} ${fs}px ${el.fontFamily ?? 'DM Sans, sans-serif'}`
  ctx.fillStyle = sel ? '#1a6fe0' : hov ? '#3a8f20' : (el.fillColor ?? '#333')
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText(el.text, s.x, s.y)
  if (sel) {
    const tw = ctx.measureText(el.text).width
    ctx.setLineDash([3, 2])
    ctx.strokeStyle = '#1a6fe0'
    ctx.lineWidth = 1
    ctx.strokeRect(s.x - 2, s.y - 2, tw + 4, fs + 6)
    ctx.setLineDash([])
  }
  ctx.textBaseline = 'alphabetic'
}

function drawImage(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'image' },
  view: ViewState,
  scheduleRender: () => void
): void {
  const img = getImage(el, scheduleRender)
  if (!img) return
  const s = worldToScreen(el.x, el.y, view)
  const sw = el.width * view.zoom
  const sh = el.height * view.zoom
  ctx.drawImage(img, s.x, s.y, sw, sh)
}

function drawSymbol(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'symbol' },
  view: ViewState
): void {
  const sym = SYMBOL_MAP[el.symbolId]
  if (!sym) return
  const sc = worldToScreen(el.cx, el.cy, view)
  const cat = CATEGORIES[el.category] ?? CATEGORIES.tree
  const fill = el.fillColor ?? cat.fill
  const stroke = el.strokeColor ?? cat.stroke
  ctx.save()
  ctx.translate(sc.x, sc.y)
  const scale = (el.scale * view.zoom) / 20
  ctx.scale(scale, scale)
  sym.draw(ctx, 1, fill, stroke)
  ctx.restore()
}

function drawDimensionEl(
  ctx: CanvasRenderingContext2D,
  el: GardenElement & { type: 'dimension' },
  view: ViewState
): void {
  const s1 = worldToScreen(el.x1, el.y1, view)
  const s2 = worldToScreen(el.x2, el.y2, view)
  const dx = el.x2 - el.x1, dy = el.y2 - el.y1
  const len = Math.hypot(dx, dy)
  const nx = -dy / len, ny = dx / len
  const offsetPx = el.offset * view.zoom

  const mx1 = s1.x + nx * offsetPx, my1 = s1.y + ny * offsetPx
  const mx2 = s2.x + nx * offsetPx, my2 = s2.y + ny * offsetPx

  ctx.strokeStyle = 'rgba(30,80,200,0.8)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([])

  // Extension lines
  ctx.beginPath()
  ctx.moveTo(s1.x, s1.y)
  ctx.lineTo(mx1, my1)
  ctx.moveTo(s2.x, s2.y)
  ctx.lineTo(mx2, my2)
  ctx.stroke()

  // Annotation line with arrows
  ctx.beginPath()
  ctx.moveTo(mx1, my1)
  ctx.lineTo(mx2, my2)
  ctx.stroke()

  // Arrow heads
  const angle = Math.atan2(my2 - my1, mx2 - mx1)
  const aw = 8
  for (const [px, py, dir] of [[mx1, my1, angle + Math.PI], [mx2, my2, angle]] as [number, number, number][]) {
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + Math.cos(dir - 0.4) * aw, py + Math.sin(dir - 0.4) * aw)
    ctx.moveTo(px, py)
    ctx.lineTo(px + Math.cos(dir + 0.4) * aw, py + Math.sin(dir + 0.4) * aw)
    ctx.stroke()
  }

  // Label
  const distM = el.unit === 'm' ? `${len.toFixed(2)} m` : `${(len * 3.28084).toFixed(2)} ft`
  const lx = (mx1 + mx2) / 2, ly = (my1 + my2) / 2
  ctx.fillStyle = 'rgba(20,60,180,0.9)'
  ctx.font = 'bold 11px DM Mono, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(255,255,255,0.9)'
  ctx.shadowBlur = 4
  ctx.fillText(distM, lx, ly - 8)
  ctx.shadowBlur = 0
  ctx.textBaseline = 'alphabetic'
}

// ── Label helpers ─────────────────────────────────────────────────────────────

function drawLabel(ctx: CanvasRenderingContext2D, text: string, cx: number, cy: number): void {
  const fs = Math.min(12, Math.max(7, 12))
  ctx.save()
  ctx.setLineDash([])
  ctx.font = `500 ${fs}px DM Sans, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(255,255,255,0.85)'
  ctx.shadowBlur = 4
  ctx.fillStyle = 'rgba(20,20,20,0.88)'
  ctx.fillText(text, cx, cy)
  ctx.shadowBlur = 0
  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}

function drawAreaLabel(ctx: CanvasRenderingContext2D, area: number, cx: number, cy: number): void {
  ctx.save()
  ctx.setLineDash([])
  ctx.font = '400 9px DM Mono, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = 'rgba(40,40,40,0.55)'
  ctx.fillText(`${area.toFixed(1)} m²`, cx, cy)
  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}

// ── Selection handles ────────────────────────────────────────────────────────

function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  el: GardenElement,
  view: ViewState
): void {
  const handles = getHandles(el)

  ctx.save()
  ctx.setLineDash([])

  // Dashed selection outline for rect/circle/image/symbol
  if (['rect', 'circle', 'image', 'symbol'].includes(el.type)) {
    const b = getBbox(el)
    const tl = worldToScreen(b.x, b.y, view)
    const br = worldToScreen(b.x + b.w, b.y + b.h, view)
    ctx.save()
    if (el.rotation) {
      const cx = (tl.x + br.x) / 2
      const cy = (tl.y + br.y) / 2
      ctx.translate(cx, cy)
      ctx.rotate(el.rotation)
      ctx.translate(-cx, -cy)
    }
    ctx.strokeStyle = 'rgba(26,111,224,0.45)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y)
    ctx.setLineDash([])
    ctx.restore()
  }

  // Handles
  for (const h of handles) {
    const s = worldToScreen(h.wx, h.wy, view)
    const isRot = h.id === 'rot'
    ctx.beginPath()
    if (isRot) {
      ctx.arc(s.x, s.y, HANDLE_RADIUS + 1, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#e07020'
      ctx.lineWidth = 2
      ctx.stroke()
      // Draw rotation arrow hint
      ctx.beginPath()
      ctx.arc(s.x, s.y, HANDLE_RADIUS - 1, 0, Math.PI * 1.5)
      ctx.strokeStyle = '#e07020'
      ctx.lineWidth = 1.5
      ctx.stroke()
    } else {
      ctx.arc(s.x, s.y, HANDLE_RADIUS, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#1a6fe0'
      ctx.lineWidth = 1.5
      ctx.stroke()
    }
  }

  // Rotation stem line (from element top-centre to rotation handle)
  const rotH = handles.find((h: Handle) => h.id === 'rot')
  if (rotH) {
    const b = getBbox(el)
    const topCentre = worldToScreen(b.x + b.w / 2, b.y, view)
    const rotS = worldToScreen(rotH.wx, rotH.wy, view)
    ctx.beginPath()
    ctx.moveTo(topCentre.x, topCentre.y)
    ctx.lineTo(rotS.x, rotS.y)
    ctx.strokeStyle = 'rgba(224,112,32,0.5)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 2])
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.restore()
}

// ── Dimension display for selected elements ───────────────────────────────────

function drawDimensions(
  ctx: CanvasRenderingContext2D,
  el: GardenElement,
  view: ViewState
): void {
  if (view.zoom < 8) return
  const b = getBbox(el)

  ctx.save()
  ctx.setLineDash([])
  ctx.font = `400 ${Math.max(9, Math.min(11, 11 * (view.zoom / 40)))}px DM Mono, monospace`
  ctx.fillStyle = 'rgba(20,80,180,0.88)'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  if (el.type === 'rect' || el.type === 'image') {
    const sb = worldToScreen(b.x + b.w / 2, b.y + b.h, view)
    ctx.fillText(`${el.type === 'rect' ? el.width : el.width}m`, sb.x, sb.y + 4)
    const sr = worldToScreen(b.x + b.w, b.y + b.h / 2, view)
    ctx.save()
    ctx.translate(sr.x + 14, sr.y)
    ctx.rotate(Math.PI / 2)
    ctx.fillText(`${el.type === 'rect' ? el.height : el.height}m`, 0, 0)
    ctx.restore()
  } else if (el.type === 'circle') {
    const sb = worldToScreen(el.cx, el.cy + el.radius, view)
    ctx.fillText(`⌀${(el.radius * 2).toFixed(1)}m`, sb.x, sb.y + 4)
  } else if (el.type === 'line') {
    const pts = el.points
    if (pts.length >= 2) {
      const last = pts[pts.length - 1]
      const len = pts.reduce((s, _p, i) => {
        if (i === 0) return 0
        return s + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
      }, 0)
      const sm = worldToScreen((pts[0].x + last.x) / 2, (pts[0].y + last.y) / 2, view)
      ctx.fillText(`${len.toFixed(1)}m`, sm.x, sm.y - 14)
    }
  } else if (el.type === 'poly' && el.closed) {
    const sb = worldToScreen(b.x + b.w / 2, b.y + b.h, view)
    ctx.fillText(`${b.w.toFixed(1)}×${b.h.toFixed(1)}m`, sb.x, sb.y + 4)
  }

  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}

// ── Compass ───────────────────────────────────────────────────────────────────

function drawCompass(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  ctx.save()
  ctx.translate(cx, cy)
  // N (red)
  ctx.beginPath()
  ctx.moveTo(0, -17)
  ctx.lineTo(5, 0)
  ctx.lineTo(0, -5)
  ctx.lineTo(-5, 0)
  ctx.closePath()
  ctx.fillStyle = 'rgba(200,50,50,0.82)'
  ctx.fill()
  // S (grey)
  ctx.beginPath()
  ctx.moveTo(0, 17)
  ctx.lineTo(5, 0)
  ctx.lineTo(0, 5)
  ctx.lineTo(-5, 0)
  ctx.closePath()
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fill()
  // N label
  ctx.fillStyle = 'rgba(0,0,0,0.6)'
  ctx.font = 'bold 10px DM Sans, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.fillText('N', 0, -20)
  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}

// ── Scale bar ────────────────────────────────────────────────────────────────

function drawScaleBar(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  view: ViewState
): void {
  const barM = 5
  const barPx = barM * view.zoom
  if (barPx < 25 || barPx > 350) return
  const rx = W - 46, ry = H - 50
  ctx.save()
  ctx.fillStyle = 'rgba(0,0,0,0.55)'
  ctx.fillRect(rx - barPx, ry, barPx, 5)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillRect(rx - barPx, ry, barPx / 2, 5)
  ctx.fillStyle = 'rgba(0,0,0,0.65)'
  ctx.font = '9px DM Mono, monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('0', rx - barPx, ry + 7)
  ctx.fillText('5m', rx, ry + 7)
  ctx.textBaseline = 'alphabetic'
  ctx.restore()
}

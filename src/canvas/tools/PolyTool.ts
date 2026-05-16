import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { PolyElement, Point } from '@/types/elements'
import { nanoid } from 'nanoid'
import { applyAngleSnap } from '../angleSnap'

let points: Point[] = []
let mousePos: { wx: number; wy: number } | null = null

function getConstrainedMouse(e: CanvasPointerEvent): { wx: number; wy: number } {
  if (e.shiftKey && points.length > 0) {
    const last = points[points.length - 1]
    const snapped = applyAngleSnap(last.x, last.y, e.snappedWx, e.snappedWy)
    return { wx: snapped.x, wy: snapped.y }
  }
  return { wx: e.snappedWx, wy: e.snappedWy }
}

function updatePreview(ctx: ToolContext) {
  if (points.length < 1) {
    ctx.setPreviewElement(null)
    return
  }
  const pts = mousePos
    ? [...points, { x: mousePos.wx, y: mousePos.wy }]
    : points

  ctx.setPreviewElement({
    id: '__preview__',
    type: 'poly',
    category: ctx.getActiveCategoryKey() as PolyElement['category'],
    label: '',
    points: pts,
    closed: false,
    zIndex: 0,
    layerId: ctx.getActiveLayerId(),
    locked: false,
    visible: true,
    rotation: 0,
    opacity: 1,
  } as PolyElement)
}

function close(ctx: ToolContext) {
  if (points.length < 3) {
    points = []
    ctx.setPreviewElement(null)
    return
  }
  const cat = ctx.getActiveCategoryKey()
  const el: PolyElement = {
    id: nanoid(),
    type: 'poly',
    category: cat as PolyElement['category'],
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    points: [...points],
    closed: true,
    zIndex: ctx.getElements().length,
    layerId: ctx.getActiveLayerId(),
    locked: false,
    visible: true,
    rotation: 0,
    opacity: 1,
  }
  ctx.addElement(el)
  ctx.setSelectedIds([el.id])
  points = []
  mousePos = null
  ctx.setPreviewElement(null)
}

export const PolyTool: Tool = {
  name: 'poly',
  cursor: 'crosshair',

  onActivate() {
    points = []
    mousePos = null
  },

  onDeactivate(ctx: ToolContext) {
    points = []
    mousePos = null
    ctx.setPreviewElement(null)
  },

  onMouseDown(e: CanvasPointerEvent, ctx: ToolContext) {
    const pos = getConstrainedMouse(e)
    // Check if clicking near first point to close
    if (points.length >= 3) {
      const d = Math.hypot(pos.wx - points[0].x, pos.wy - points[0].y)
      if (d < 0.8) {
        close(ctx)
        return
      }
    }
    points.push({ x: pos.wx, y: pos.wy })
    updatePreview(ctx)
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    const pos = getConstrainedMouse(e)
    mousePos = pos
    updatePreview(ctx)
  },

  onMouseUp() {},

  onDblClick(_e: CanvasPointerEvent, ctx: ToolContext) {
    // Remove the last duplicate point added by dblclick mousedown
    if (points.length > 0) points.pop()
    close(ctx)
  },

  onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
    if (e.key === 'Escape') {
      points = []
      mousePos = null
      ctx.setPreviewElement(null)
    }
    if (e.key === 'Enter') {
      close(ctx)
    }
  },
}

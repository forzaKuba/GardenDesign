import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { LineElement } from '@/types/elements'
import { nanoid } from 'nanoid'
import { applyAngleSnap } from '../angleSnap'

let anchor: { wx: number; wy: number } | null = null

export const LineTool: Tool = {
  name: 'line',
  cursor: 'crosshair',

  onActivate() {
    anchor = null
  },

  onMouseDown(e: CanvasPointerEvent) {
    anchor = { wx: e.snappedWx, wy: e.snappedWy }
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!anchor) return
    const end = e.shiftKey
      ? applyAngleSnap(anchor.wx, anchor.wy, e.snappedWx, e.snappedWy)
      : { x: e.snappedWx, y: e.snappedWy }
    ctx.setPreviewElement({
      id: '__preview__',
      type: 'line',
      category: ctx.getActiveCategoryKey() as LineElement['category'],
      label: '',
      points: [
        { x: anchor.wx, y: anchor.wy },
        { x: end.x, y: end.y },
      ],
      strokeWidth: 0.1,
      zIndex: 0,
      layerId: ctx.getActiveLayerId(),
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    } as LineElement)
  },

  onMouseUp(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!anchor) return
    const end = e.shiftKey
      ? applyAngleSnap(anchor.wx, anchor.wy, e.snappedWx, e.snappedWy)
      : { x: e.snappedWx, y: e.snappedWy }
    const len = Math.hypot(end.x - anchor.wx, end.y - anchor.wy)
    const a = { ...anchor }
    anchor = null
    ctx.setPreviewElement(null)
    if (len < 0.15) return

    const cat = ctx.getActiveCategoryKey()
    const el: LineElement = {
      id: nanoid(),
      type: 'line',
      category: cat as LineElement['category'],
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      points: [
        { x: a.wx, y: a.wy },
        { x: end.x, y: end.y },
      ],
      strokeWidth: 0.1,
      zIndex: ctx.getElements().length,
      layerId: ctx.getActiveLayerId(),
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    }
    ctx.addElement(el)
    ctx.setSelectedIds([el.id])
  },
}

import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { RectElement } from '@/types/elements'
import { nanoid } from 'nanoid'

let anchor: { wx: number; wy: number } | null = null

export const RectTool: Tool = {
  name: 'rect',
  cursor: 'crosshair',

  onActivate() {
    anchor = null
  },

  onMouseDown(e: CanvasPointerEvent) {
    anchor = { wx: e.snappedWx, wy: e.snappedWy }
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!anchor) return
    const x = Math.min(anchor.wx, e.snappedWx)
    const y = Math.min(anchor.wy, e.snappedWy)
    const w = Math.abs(e.snappedWx - anchor.wx)
    const h = Math.abs(e.snappedWy - anchor.wy)
    if (w < 0.05 || h < 0.05) return

    ctx.setPreviewElement({
      id: '__preview__',
      type: 'rect',
      category: ctx.getActiveCategoryKey() as RectElement['category'],
      label: '',
      x,
      y,
      width: w,
      height: h,
      zIndex: 0,
      layerId: ctx.getActiveLayerId(),
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    } as RectElement)
  },

  onMouseUp(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!anchor) return
    const x = Math.min(anchor.wx, e.snappedWx)
    const y = Math.min(anchor.wy, e.snappedWy)
    const w = Math.abs(e.snappedWx - anchor.wx)
    const h = Math.abs(e.snappedWy - anchor.wy)
    anchor = null
    ctx.setPreviewElement(null)
    if (w < 0.15 || h < 0.15) return

    const cat = ctx.getActiveCategoryKey()
    const el: RectElement = {
      id: nanoid(),
      type: 'rect',
      category: cat as RectElement['category'],
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      x,
      y,
      width: w,
      height: h,
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

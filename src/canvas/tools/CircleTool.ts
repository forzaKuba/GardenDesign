import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { CircleElement } from '@/types/elements'
import { nanoid } from 'nanoid'

let anchor: { wx: number; wy: number } | null = null

export const CircleTool: Tool = {
  name: 'circle',
  cursor: 'crosshair',

  onActivate() {
    anchor = null
  },

  onMouseDown(e: CanvasPointerEvent) {
    anchor = { wx: e.snappedWx, wy: e.snappedWy }
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!anchor) return
    const r = Math.hypot(e.snappedWx - anchor.wx, e.snappedWy - anchor.wy)
    if (r < 0.05) return
    ctx.setPreviewElement({
      id: '__preview__',
      type: 'circle',
      category: ctx.getActiveCategoryKey() as CircleElement['category'],
      label: '',
      cx: anchor.wx,
      cy: anchor.wy,
      radius: r,
      zIndex: 0,
      layerId: ctx.getActiveLayerId(),
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    } as CircleElement)
  },

  onMouseUp(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!anchor) return
    const r = Math.hypot(e.snappedWx - anchor.wx, e.snappedWy - anchor.wy)
    const a = { ...anchor }
    anchor = null
    ctx.setPreviewElement(null)
    if (r < 0.15) return

    const cat = ctx.getActiveCategoryKey()
    const el: CircleElement = {
      id: nanoid(),
      type: 'circle',
      category: cat as CircleElement['category'],
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      cx: a.wx,
      cy: a.wy,
      radius: r,
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

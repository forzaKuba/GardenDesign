import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { DimensionElement } from '@/types/elements'
import { nanoid } from 'nanoid'

let p1: { wx: number; wy: number } | null = null

export const DimensionTool: Tool = {
  name: 'dimension',
  cursor: 'crosshair',

  onActivate() {
    p1 = null
  },

  onDeactivate(ctx: ToolContext) {
    p1 = null
    ctx.setPreviewElement(null)
  },

  onMouseDown(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!p1) {
      p1 = { wx: e.snappedWx, wy: e.snappedWy }
    } else {
      // Place dimension element
      const el: DimensionElement = {
        id: nanoid(),
        type: 'dimension',
        category: 'boundary',
        label: 'Dimension',
        x1: p1.wx,
        y1: p1.wy,
        x2: e.snappedWx,
        y2: e.snappedWy,
        offset: -1,
        unit: 'm',
        zIndex: ctx.getElements().length,
        layerId: ctx.getActiveLayerId(),
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
      }
      ctx.addElement(el)
      ctx.setSelectedIds([el.id])
      p1 = null
      ctx.setPreviewElement(null)
    }
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!p1) return
    ctx.setPreviewElement({
      id: '__preview__',
      type: 'dimension',
      category: 'boundary',
      label: '',
      x1: p1.wx,
      y1: p1.wy,
      x2: e.snappedWx,
      y2: e.snappedWy,
      offset: -1,
      unit: 'm',
      zIndex: 0,
      layerId: ctx.getActiveLayerId(),
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    } as DimensionElement)
  },

  onMouseUp() {},

  onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
    if (e.key === 'Escape') {
      p1 = null
      ctx.setPreviewElement(null)
    }
  },
}

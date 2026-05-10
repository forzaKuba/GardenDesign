import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { PolyElement, Point } from '@/types/elements'
import { nanoid } from 'nanoid'
import { rdp } from '../rdp'

let rawPoints: Point[] = []
let drawing = false

export const PencilTool: Tool = {
  name: 'pencil',
  cursor: 'crosshair',

  onActivate() {
    rawPoints = []
    drawing = false
  },

  onMouseDown(e: CanvasPointerEvent) {
    drawing = true
    rawPoints = [{ x: e.wx, y: e.wy }]
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    if (!drawing) return
    rawPoints.push({ x: e.wx, y: e.wy })

    // Show raw preview
    ctx.setPreviewElement({
      id: '__preview__',
      type: 'poly',
      category: ctx.getActiveCategoryKey() as PolyElement['category'],
      label: '',
      points: [...rawPoints],
      closed: false,
      zIndex: 0,
      layerId: ctx.getActiveLayerId(),
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    } as PolyElement)
  },

  onMouseUp(_e: CanvasPointerEvent, ctx: ToolContext) {
    drawing = false
    ctx.setPreviewElement(null)

    if (rawPoints.length < 3) {
      rawPoints = []
      return
    }

    // Simplify with RDP (epsilon 0.15m)
    const simplified = rdp(rawPoints, 0.15)
    rawPoints = []

    if (simplified.length < 2) return

    const cat = ctx.getActiveCategoryKey()
    const el: PolyElement = {
      id: nanoid(),
      type: 'poly',
      category: cat as PolyElement['category'],
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
      points: simplified,
      closed: simplified.length >= 3,
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

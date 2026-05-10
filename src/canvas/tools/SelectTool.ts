import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'
import type { GardenElement } from '@/types/elements'
import { topElementAt, elementsInRect, findHandleAt, applyResize, getBbox, Handle } from '../hitTest'

type State = 'idle' | 'dragging' | 'drag-selecting' | 'resizing' | 'rotating'

let state: State = 'idle'
let dragStart: { wx: number; wy: number } | null = null
let dragOriginals: GardenElement[] = []
let resizeHandle: Handle | null = null
let resizeOriginal: GardenElement | null = null
let rotateOriginal: GardenElement | null = null
let rotateCenter: { cx: number; cy: number } | null = null
let dragSelectStart: { x: number; y: number } | null = null

export const SelectTool: Tool = {
  name: 'select',
  cursor: 'default',

  onActivate() {
    state = 'idle'
    dragStart = null
    dragOriginals = []
    resizeHandle = null
    resizeOriginal = null
    rotateOriginal = null
    rotateCenter = null
    dragSelectStart = null
  },

  onMouseDown(e: CanvasPointerEvent, ctx: ToolContext) {
    const elements = ctx.getElements()
    const selectedIds = ctx.getSelectedIds()
    const view = ctx.getView()

    // Check resize/rotate handle on selected element
    if (selectedIds.length === 1) {
      const selEl = elements.find((el) => el.id === selectedIds[0])
      if (selEl) {
        const h = findHandleAt(e.x, e.y, selEl, view)
        if (h) {
          if (h.id === 'rot') {
            // Rotation
            state = 'rotating'
            rotateOriginal = JSON.parse(JSON.stringify(selEl)) as GardenElement
            const b = getBbox(selEl)
            rotateCenter = { cx: b.x + b.w / 2, cy: b.y + b.h / 2 }
          } else {
            // Resize
            state = 'resizing'
            resizeHandle = h
            resizeOriginal = JSON.parse(JSON.stringify(selEl)) as GardenElement
            dragStart = { wx: e.wx, wy: e.wy }
          }
          return
        }
      }
    }

    // Hit test
    const hit = topElementAt(e.wx, e.wy, elements)

    if (hit) {
      if (e.shiftKey) {
        // Shift-click: toggle selection
        if (selectedIds.includes(hit.id)) {
          ctx.setSelectedIds(selectedIds.filter((id) => id !== hit.id))
        } else {
          ctx.addToSelection(hit.id)
        }
      } else {
        // Select and start drag
        if (!selectedIds.includes(hit.id)) {
          ctx.setSelectedIds([hit.id])
        }
        state = 'dragging'
        dragStart = { wx: e.wx, wy: e.wy }
        const newSelectedIds = selectedIds.includes(hit.id)
          ? selectedIds
          : [hit.id]
        dragOriginals = elements
          .filter((el) => newSelectedIds.includes(el.id))
          .map((el) => JSON.parse(JSON.stringify(el)) as GardenElement)
      }
    } else {
      // Click empty → deselect + start drag-select
      if (!e.shiftKey) ctx.setSelectedIds([])
      state = 'drag-selecting'
      dragSelectStart = { x: e.x, y: e.y }
    }
  },

  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext) {
    if (state === 'dragging' && dragStart) {
      const dx = e.snappedWx - dragStart.wx
      const dy = e.snappedWy - dragStart.wy
      if (Math.abs(dx) < 0.001 && Math.abs(dy) < 0.001) return
      // Restore originals then apply delta (no history push during drag)
      for (const orig of dragOriginals) {
        const el = ctx.getElements().find((el) => el.id === orig.id)
        if (!el) continue
        const moved = JSON.parse(JSON.stringify(orig)) as GardenElement
        // Apply delta
        if (moved.type === 'rect' || moved.type === 'text' || moved.type === 'image') {
          moved.x = (orig as typeof moved).x + dx
          moved.y = (orig as typeof moved).y + dy
        } else if (moved.type === 'circle' || moved.type === 'symbol') {
          moved.cx = (orig as typeof moved).cx + dx
          moved.cy = (orig as typeof moved).cy + dy
        } else if (moved.type === 'poly' || moved.type === 'line') {
          moved.points = (orig as typeof moved).points.map((p) => ({ x: p.x + dx, y: p.y + dy }))
        } else if (moved.type === 'dimension') {
          moved.x1 = (orig as typeof moved).x1 + dx
          moved.y1 = (orig as typeof moved).y1 + dy
          moved.x2 = (orig as typeof moved).x2 + dx
          moved.y2 = (orig as typeof moved).y2 + dy
        }
        ctx.updateElement(orig.id, moved)
      }
    }

    if (state === 'resizing' && resizeHandle && resizeOriginal && dragStart) {
      const dwx = e.snappedWx - dragStart.wx
      const dwy = e.snappedWy - dragStart.wy
      const updated = applyResize(resizeOriginal, resizeHandle.id, dwx, dwy, resizeOriginal)
      ctx.updateElement(resizeOriginal.id, updated)
    }

    if (state === 'rotating' && rotateOriginal && rotateCenter) {
      const angle = Math.atan2(
        e.wy - rotateCenter.cy,
        e.wx - rotateCenter.cx
      ) + Math.PI / 2
      ctx.updateElement(rotateOriginal.id, { rotation: angle })
    }

    if (state === 'drag-selecting' && dragSelectStart) {
      ctx.setPreviewElement(null)
      // Update drag select rect in store via a different path
      // We use the canvas store directly
      const { setDragSelectRect } = (ctx as unknown as { setDragSelectRect?: (r: typeof dragSelectStart & { w: number; h: number }) => void })
      if (setDragSelectRect) {
        setDragSelectRect({
          x: Math.min(dragSelectStart.x, e.x),
          y: Math.min(dragSelectStart.y, e.y),
          w: Math.abs(e.x - dragSelectStart.x),
          h: Math.abs(e.y - dragSelectStart.y),
        })
      }
    }
  },

  onMouseUp(e: CanvasPointerEvent, ctx: ToolContext) {
    if (state === 'dragging') {
      ctx.pushHistory()
    }
    if (state === 'resizing') {
      ctx.pushHistory()
    }
    if (state === 'rotating') {
      ctx.pushHistory()
    }
    if (state === 'drag-selecting' && dragSelectStart) {
      // Select elements in rect
      const view = ctx.getView()
      const elements = ctx.getElements()
      const rx = Math.min(dragSelectStart.x, e.x)
      const ry = Math.min(dragSelectStart.y, e.y)
      const rw = Math.abs(e.x - dragSelectStart.x)
      const rh = Math.abs(e.y - dragSelectStart.y)
      if (rw > 4 && rh > 4) {
        const inRect = elementsInRect(rx, ry, rw, rh, elements, view)
        ctx.setSelectedIds(inRect.map((el) => el.id))
      }
      // Clear drag rect
      const store = (ctx as unknown as { clearDragRect?: () => void })
      if (store.clearDragRect) store.clearDragRect()
    }

    state = 'idle'
    dragStart = null
    dragOriginals = []
    resizeHandle = null
    resizeOriginal = null
    rotateOriginal = null
    rotateCenter = null
    dragSelectStart = null
  },

  onDblClick(e: CanvasPointerEvent, ctx: ToolContext) {
    const hit = topElementAt(e.wx, e.wy, ctx.getElements())
    if (!hit) return
    // Edit label via prompt
    const newLabel = window.prompt('Edit label:', hit.label ?? '')
    if (newLabel !== null) {
      ctx.pushHistory()
      ctx.updateElement(hit.id, {
        label: newLabel,
        ...(hit.type === 'text' ? { text: newLabel } : {}),
      })
    }
  },

  onKeyDown(e: KeyboardEvent, ctx: ToolContext) {
    const selectedIds = ctx.getSelectedIds()
    if (!selectedIds.length) return

    if (e.key === 'Delete' || e.key === 'Backspace') {
      ctx.deleteElements(selectedIds)
      e.preventDefault()
    }
    if (e.key === 'Escape') {
      ctx.setSelectedIds([])
    }
  },
}

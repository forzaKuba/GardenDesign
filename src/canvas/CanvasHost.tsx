import { useEffect, useRef, useState, useCallback } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { render, RendererState } from './renderer'
import { drawMinimap } from './minimap'
import { screenToWorld } from './coordTransform'
import { snapPoint } from './coordTransform'
import { topElementAt } from './hitTest'
import { toolRegistry } from './tools/index'
import { useRAFLoop } from '@/hooks/useRAFLoop'
import type { GardenElement } from '@/types/elements'
import type { LineElement, RectElement, CircleElement, PolyElement } from '@/types/elements'
import type { CanvasPointerEvent } from '@/types/tools'
import { MIN_ZOOM, MAX_ZOOM } from '@/constants/grid'

// ── Measurement tooltip helpers ───────────────────────────────────────────────

function formatLength(meters: number): string {
  if (meters < 0.005) return '0 cm'
  let m = Math.floor(meters)
  let cm = Math.round((meters - m) * 100)
  // Carry if rounding pushes cm to 100
  if (cm >= 100) { m += 1; cm = 0 }
  if (m === 0) return `${cm} cm`
  if (cm === 0) return `${m} m`
  return `${m} m ${cm} cm`
}

function getMeasurementText(
  el: Partial<GardenElement> | null,
  activeTool: string,
  pencilRunningLength?: number,
): string | null {
  if (!el) return null
  switch (el.type) {
    case 'line': {
      const pts = (el as Partial<LineElement>).points
      if (!pts || pts.length < 2) return null
      const len = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y)
      return formatLength(len)
    }
    case 'rect': {
      const r = el as Partial<RectElement>
      if (r.width == null || r.height == null) return null
      return `${formatLength(r.width)} × ${formatLength(r.height)}`
    }
    case 'circle': {
      const c = el as Partial<CircleElement>
      if (c.radius == null) return null
      return `r ${formatLength(c.radius)} ⌀ ${formatLength(c.radius * 2)}`
    }
    case 'poly': {
      const p = el as Partial<PolyElement>
      if (!p.points || p.points.length < 2) return null
      const pts = p.points
      // For pencil free-draw: use O(1) running total tracked by the caller
      if (activeTool === 'pencil') return formatLength(pencilRunningLength ?? 0)
      // For poly tool: show current segment length + running total
      const segLen = Math.hypot(
        pts[pts.length - 1].x - pts[pts.length - 2].x,
        pts[pts.length - 1].y - pts[pts.length - 2].y,
      )
      if (pts.length === 2) return formatLength(segLen)
      // Compute total only for committed poly points (small n, not pencil)
      let total = 0
      for (let i = 1; i < pts.length; i++) {
        total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)
      }
      return `${formatLength(segLen)} (${formatLength(total)} total)`
    }
    default:
      return null
  }
}

const MM_W = 180
const MM_H = 130
const MM_PAD = 12

export default function CanvasHost() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ w: 800, h: 600 })

  // Mutable refs — not React state, to avoid re-renders
  const isDirty = useRef(true)
  const previewEl = useRef<Partial<GardenElement> | null>(null)
  const snapIndicator = useRef<{ wx: number; wy: number } | null>(null)
  const spaceDown = useRef(false)
  const panStart = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const activeToolName = useRef(useGardenStore.getState().interaction.activeTool)
  const measureTooltipRef = useRef<HTMLDivElement>(null)
  // Pencil incremental length tracking — avoids O(n) scan on every pointermove
  const pencilRunningLength = useRef(0)
  const pencilPrevPointsLen = useRef(0)

  const store = useGardenStore

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ w: width, h: height })
      isDirty.current = true
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Subscribe to store changes → mark dirty
  useEffect(() => {
    return store.subscribe(() => {
      isDirty.current = true
      activeToolName.current = store.getState().interaction.activeTool
    })
  }, [store])

  const scheduleRender = useCallback(() => {
    isDirty.current = true
  }, [])

  // Build ToolContext for the active tool
  const getToolContext = useCallback(() => {
    const canvas = canvasRef.current!
    return {
      addElement: (el: GardenElement) => store.getState().addElement(el),
      updateElement: (id: string, patch: Partial<GardenElement>) =>
        store.getState().updateElement(id, patch),
      deleteElements: (ids: string[]) => store.getState().deleteElements(ids),
      pushHistory: () => store.getState().pushHistory(),
      getSelectedIds: () => store.getState().interaction.selectedIds,
      setSelectedIds: (ids: string[]) => store.getState().setSelectedIds(ids),
      addToSelection: (id: string) => store.getState().addToSelection(id),
      getElements: () => store.getState().project?.elements ?? [],
      getLayers: () => store.getState().project?.layers ?? [],
      getView: () => store.getState().view,
      isSnapEnabled: () => store.getState().interaction.snapEnabled,
      getGridStep: () => store.getState().project?.gridStep ?? 1,
      getActiveCategoryKey: () => store.getState().interaction.activeCategoryKey,
      getActiveLayerId: () => store.getState().interaction.activeLayerId,
      canvas,
      setPreviewElement: (el: Partial<GardenElement> | null) => {
        previewEl.current = el
        isDirty.current = true
        // Hide tooltip immediately when preview is cleared (e.g. Escape, tool switch)
        if (!el) {
          const tt = measureTooltipRef.current
          if (tt) tt.style.display = 'none'
          pencilRunningLength.current = 0
          pencilPrevPointsLen.current = 0
        }
      },
      scheduleRender,
      promptText: (pos: { wx: number; wy: number }) => {
        store.getState().setPendingTextPos(pos)
      },
    }
  }, [store, scheduleRender])

  // Build CanvasPointerEvent
  const buildPointerEvent = useCallback(
    (e: PointerEvent): CanvasPointerEvent => {
      const canvas = canvasRef.current!
      const rect = canvas.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const view = store.getState().view
      const { x: wx, y: wy } = screenToWorld(sx, sy, view)
      const state = store.getState()
      const elements = state.project?.elements ?? []
      const selectedIds = state.interaction.selectedIds
      const snap = snapPoint(
        wx,
        wy,
        state.project?.gridStep ?? 1,
        state.interaction.snapEnabled,
        elements,
        selectedIds
      )
      snapIndicator.current = snap.snapped ? { wx: snap.x, wy: snap.y } : null
      return {
        x: sx,
        y: sy,
        wx,
        wy,
        snappedWx: snap.x,
        snappedWy: snap.y,
        button: e.button,
        shiftKey: e.shiftKey,
        ctrlKey: e.ctrlKey || e.metaKey,
        altKey: e.altKey,
        originalEvent: e,
      }
    },
    [store]
  )

  // Attach canvas events
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function onPointerDown(e: PointerEvent) {
      canvas!.setPointerCapture(e.pointerId)
      const view = store.getState().view

      // Middle mouse or Space+LMB → pan
      if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
        panStart.current = { sx: e.clientX, sy: e.clientY, px: view.panX, py: view.panY }
        canvas!.style.cursor = 'grabbing'
        store.getState().setUI({ ...store.getState().ui })
        return
      }
      if (e.button !== 0) return

      const pe = buildPointerEvent(e)
      const tool = toolRegistry[activeToolName.current]
      tool?.onMouseDown(pe, getToolContext())
    }

    function onPointerMove(e: PointerEvent) {
      const view = store.getState().view

      // Update coordinate display
      const canvas2 = canvasRef.current!
      const rect = canvas2.getBoundingClientRect()
      const sx = e.clientX - rect.left
      const sy = e.clientY - rect.top
      const { x: wx, y: wy } = screenToWorld(sx, sy, view)
      store.getState().setUI({
        ...store.getState().ui,
        // We'll use a separate coord display — just mark dirty
      })
      // Store cursor world pos for status bar (via a DOM update outside React)
      const coord = document.getElementById('coord-display')
      if (coord) coord.textContent = `x: ${wx.toFixed(1)}m  y: ${wy.toFixed(1)}m`

      if (panStart.current) {
        const dx = e.clientX - panStart.current.sx
        const dy = e.clientY - panStart.current.sy
        store.getState().setView({ panX: panStart.current.px + dx, panY: panStart.current.py + dy })
        return
      }

      const pe = buildPointerEvent(e)
      const tool = toolRegistry[activeToolName.current]
      tool?.onMouseMove(pe, getToolContext())

      // Pencil: update running length incrementally (O(1) per move)
      if (activeToolName.current === 'pencil') {
        const ppts = (previewEl.current as Partial<PolyElement> | null)?.points
        const curLen = ppts?.length ?? 0
        if (curLen > pencilPrevPointsLen.current && ppts && ppts.length >= 2) {
          const last = ppts[ppts.length - 1]
          const prev = ppts[ppts.length - 2]
          pencilRunningLength.current += Math.hypot(last.x - prev.x, last.y - prev.y)
        }
        pencilPrevPointsLen.current = curLen
      }

      // Live measurement tooltip
      const tt = measureTooltipRef.current
      if (tt) {
        const text = getMeasurementText(previewEl.current, activeToolName.current, pencilRunningLength.current)
        if (text) {
          tt.textContent = text
          // Offset tooltip to the right and slightly above the cursor
          tt.style.left = `${sx + 18}px`
          tt.style.top = `${sy - 36}px`
          tt.style.display = 'block'
        } else {
          tt.style.display = 'none'
        }
      }

      // Hover detection (select tool only)
      if (activeToolName.current === 'select') {
        const elements = store.getState().project?.elements ?? []
        const hovered = topElementAt(pe.wx, pe.wy, elements)
        store.getState().setHovered(hovered?.id ?? null)
      }
    }

    function onPointerUp(e: PointerEvent) {
      // Hide measurement tooltip on release and reset pencil state
      const tt = measureTooltipRef.current
      if (tt) tt.style.display = 'none'
      pencilRunningLength.current = 0
      pencilPrevPointsLen.current = 0

      if (panStart.current) {
        panStart.current = null
        canvas!.style.cursor = spaceDown.current ? 'grab' : getCursorForTool(activeToolName.current)
        return
      }
      if (e.button !== 0) return
      const pe = buildPointerEvent(e)
      const tool = toolRegistry[activeToolName.current]
      tool?.onMouseUp(pe, getToolContext())
      snapIndicator.current = null
      isDirty.current = true
    }

    function onDblClick(e: MouseEvent) {
      const pe = buildPointerEvent(e as unknown as PointerEvent)
      const tool = toolRegistry[activeToolName.current]
      tool?.onDblClick?.(pe, getToolContext())
    }

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const rect = canvas!.getBoundingClientRect()
      const cx = e.clientX - rect.left
      const cy = e.clientY - rect.top
      const view = store.getState().view
      const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom * factor))
      store.getState().setView({
        zoom: nz,
        panX: cx - (cx - view.panX) * (nz / view.zoom),
        panY: cy - (cy - view.panY) * (nz / view.zoom),
      })
    }

    function onContextMenu(e: Event) {
      e.preventDefault()
    }

    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerup', onPointerUp)
    canvas.addEventListener('dblclick', onDblClick)
    canvas.addEventListener('wheel', onWheel, { passive: false })
    canvas.addEventListener('contextmenu', onContextMenu)

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerup', onPointerUp)
      canvas.removeEventListener('dblclick', onDblClick)
      canvas.removeEventListener('wheel', onWheel)
      canvas.removeEventListener('contextmenu', onContextMenu)
    }
  }, [store, buildPointerEvent, getToolContext])

  // Keyboard: space pan + tool key forwarding
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' && e.target === document.body) {
        spaceDown.current = true
        if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
        e.preventDefault()
        return
      }
      const tool = toolRegistry[activeToolName.current]
      if (tool?.onKeyDown && e.target === document.body) {
        tool.onKeyDown(e, getToolContext())
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === 'Space') {
        spaceDown.current = false
        if (canvasRef.current)
          canvasRef.current.style.cursor = getCursorForTool(activeToolName.current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [getToolContext])

  // RAF loop — render when dirty
  useRAFLoop(() => {
    if (!isDirty.current) return
    isDirty.current = false

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = store.getState()
    const project = state.project
    if (!project) return

    // Update canvas size (HiDPI)
    const dpr = window.devicePixelRatio || 1
    const targetW = size.w * dpr
    const targetH = size.h * dpr
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW
      canvas.height = targetH
    }

    const rendererState: RendererState = {
      project,
      view: state.view,
      selectedIds: state.interaction.selectedIds,
      hoveredId: state.interaction.hoveredId,
      dragSelectRect: state.interaction.dragSelectRect,
      showGrid: project.showGrid,
      gridStep: project.gridStep,
      canvasBackground: project.canvasBackground,
      previewElement: previewEl.current,
      snapIndicator: snapIndicator.current,
    }

    render(ctx, rendererState, scheduleRender)

    // Minimap overlay
    if (state.ui.showMinimap) {
      const mmX = size.w - MM_W - MM_PAD
      const mmY = size.h - MM_H - MM_PAD
      const dpr2 = window.devicePixelRatio || 1
      ctx.save()
      ctx.scale(dpr2, dpr2)
      drawMinimap(ctx, project.elements, state.view, size.w, size.h, mmX, mmY, MM_W, MM_H)
      ctx.restore()
    }

    // Cursor
    const cursor = panStart.current
      ? 'grabbing'
      : spaceDown.current
        ? 'grab'
        : getCursorForTool(state.interaction.activeTool)
    if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor
  })

  return (
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
      <canvas
        ref={canvasRef}
        style={{ width: size.w, height: size.h, display: 'block' }}
      />
      {/* Live measurement tooltip — positioned near cursor during drawing */}
      <div
        ref={measureTooltipRef}
        style={{ display: 'none', position: 'absolute', pointerEvents: 'none' }}
        className="bg-neutral-900/90 border border-neutral-600 text-white text-xs font-mono px-2 py-1 rounded shadow-lg whitespace-nowrap z-50"
      />
    </div>
  )
}

function getCursorForTool(tool: string): string {
  if (tool === 'select') return 'default'
  return 'crosshair'
}

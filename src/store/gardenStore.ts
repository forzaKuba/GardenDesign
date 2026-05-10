import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { GardenElement, CategoryKey } from '@/types/elements'
import type { Layer } from '@/types/layers'
import type { GardenProject } from '@/types/project'
import type { ToolName, ViewState } from '@/types/tools'
import { PX_PER_M, MIN_ZOOM, MAX_ZOOM } from '@/constants/grid'
import { saveProject } from '@/lib/localStorageDb'

// ── Helpers ──────────────────────────────────────────────────────────────────

function cloneProject(p: GardenProject): GardenProject {
  return JSON.parse(JSON.stringify(p)) as GardenProject
}

function now(): string {
  return new Date().toISOString()
}

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// ── Default project (LOK nr 1) ────────────────────────────────────────────────

const DEFAULT_LAYER_ID = 'layer-default'

function createLokNr1(): GardenProject {
  const layerId = DEFAULT_LAYER_ID
  return {
    id: nanoid(),
    name: 'LOK nr 1',
    createdAt: now(),
    updatedAt: now(),
    canvasBackground: 'light',
    gridStep: 1,
    showGrid: true,
    layers: [{ id: layerId, name: 'Default Layer', visible: true, locked: false, order: 0 }],
    elements: [
      {
        id: 'e_bnd',
        type: 'poly',
        category: 'boundary',
        label: 'Granica działki',
        zIndex: 0,
        layerId,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 22, y: 2 },
          { x: 22, y: 14 },
          { x: 20, y: 16 },
          { x: 0, y: 16 },
        ],
        closed: true,
      },
      {
        id: 'e_lawn',
        type: 'poly',
        category: 'lawn',
        label: 'Trawnik / ogród',
        zIndex: 1,
        layerId,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
        points: [
          { x: 0, y: 0 },
          { x: 20, y: 0 },
          { x: 22, y: 2 },
          { x: 22, y: 14 },
          { x: 20, y: 16 },
          { x: 0, y: 16 },
        ],
        closed: true,
      },
      {
        id: 'e_bld',
        type: 'rect',
        category: 'structure',
        label: 'LOK 304',
        zIndex: 2,
        layerId,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
        x: 6,
        y: 0.5,
        width: 10,
        height: 8,
      },
      {
        id: 'e_ent',
        type: 'rect',
        category: 'structure',
        label: 'Wejście',
        zIndex: 3,
        layerId,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
        x: 8.5,
        y: 8.5,
        width: 5,
        height: 2,
      },
      {
        id: 'e_pth',
        type: 'rect',
        category: 'path',
        label: 'Chodnik',
        zIndex: 4,
        layerId,
        locked: false,
        visible: true,
        rotation: 0,
        opacity: 1,
        x: 0,
        y: 9,
        width: 8.5,
        height: 2,
      },
    ],
  }
}

// ── State interfaces ──────────────────────────────────────────────────────────

interface InteractionState {
  activeTool: ToolName
  activeCategoryKey: CategoryKey
  activeLayerId: string
  selectedIds: string[]
  hoveredId: string | null
  dragSelectRect: { x: number; y: number; w: number; h: number } | null
  isPanning: boolean
  snapEnabled: boolean
  pendingTextPos: { wx: number; wy: number } | null
  activeSymbolId: string | null
}

interface UIState {
  showCommandPalette: boolean
  showProjectManager: boolean
  showOnboarding: boolean
  showMinimap: boolean
  showLayerPanel: boolean
  showElementList: boolean
}

export interface GardenStoreState {
  project: GardenProject | null
  _history: GardenProject[]
  _future: GardenProject[]
  view: ViewState
  interaction: InteractionState
  ui: UIState
}

export interface GardenStoreActions {
  // Project lifecycle
  initProject(): void
  newProject(name: string): void
  loadProject(project: GardenProject): void
  renameProject(name: string): void

  // History
  pushHistory(): void
  undo(): void
  redo(): void
  canUndo(): boolean
  canRedo(): boolean

  // Elements
  addElement(el: GardenElement): void
  updateElement(id: string, patch: Partial<GardenElement>): void
  deleteElements(ids: string[]): void
  duplicateElements(ids: string[]): void
  groupMove(ids: string[], dx: number, dy: number): void
  bringForward(id: string): void
  sendBackward(id: string): void

  // Layers
  addLayer(name: string): string
  updateLayer(id: string, patch: Partial<Layer>): void
  deleteLayer(id: string): void
  reorderLayer(fromOrder: number, toOrder: number): void

  // Interaction
  setActiveTool(tool: ToolName): void
  setActiveCategoryKey(cat: CategoryKey): void
  setSelectedIds(ids: string[]): void
  addToSelection(id: string): void
  removeFromSelection(id: string): void
  setHovered(id: string | null): void
  setDragSelectRect(rect: { x: number; y: number; w: number; h: number } | null): void
  setPendingTextPos(pos: { wx: number; wy: number } | null): void
  setActiveSymbolId(id: string | null): void
  setSnapEnabled(enabled: boolean): void

  // View
  setView(patch: Partial<ViewState>): void
  zoomToFit(canvasWidth: number, canvasHeight: number): void
  resetView(): void
  zoomBy(factor: number, cx: number, cy: number): void

  // UI
  setUI(patch: Partial<UIState>): void

  // Project settings
  setCanvasBackground(bg: 'light' | 'dark'): void
  setGridStep(step: 0.5 | 1 | 2): void
  setShowGrid(show: boolean): void
}

export type GardenStore = GardenStoreState & GardenStoreActions

// ── Store creation ────────────────────────────────────────────────────────────

const debouncedSave = debounce(saveProject, 500)

export const useGardenStore = create<GardenStore>((set, get) => ({
  project: null,
  _history: [],
  _future: [],

  view: { panX: 80, panY: 70, zoom: PX_PER_M },

  interaction: {
    activeTool: 'select',
    activeCategoryKey: 'lawn',
    activeLayerId: DEFAULT_LAYER_ID,
    selectedIds: [],
    hoveredId: null,
    dragSelectRect: null,
    isPanning: false,
    snapEnabled: true,
    pendingTextPos: null,
    activeSymbolId: null,
  },

  ui: {
    showCommandPalette: false,
    showProjectManager: false,
    showOnboarding: false,
    showMinimap: true,
    showLayerPanel: true,
    showElementList: false,
  },

  // ── Project lifecycle ────────────────────────────────────────────────────────

  initProject() {
    const p = createLokNr1()
    set({
      project: p,
      _history: [cloneProject(p)],
      _future: [],
      interaction: {
        ...get().interaction,
        activeLayerId: DEFAULT_LAYER_ID,
        selectedIds: [],
      },
    })
  },

  newProject(name) {
    const layerId = nanoid()
    const p: GardenProject = {
      id: nanoid(),
      name,
      createdAt: now(),
      updatedAt: now(),
      canvasBackground: 'light',
      gridStep: 1,
      showGrid: true,
      layers: [{ id: layerId, name: 'Default Layer', visible: true, locked: false, order: 0 }],
      elements: [],
    }
    set({
      project: p,
      _history: [cloneProject(p)],
      _future: [],
      interaction: { ...get().interaction, activeLayerId: layerId, selectedIds: [] },
    })
    debouncedSave(p)
  },

  loadProject(project) {
    const p = cloneProject(project)
    const firstLayerId = p.layers.sort((a, b) => a.order - b.order)[0]?.id ?? ''
    set({
      project: p,
      _history: [cloneProject(p)],
      _future: [],
      interaction: { ...get().interaction, activeLayerId: firstLayerId, selectedIds: [] },
    })
  },

  renameProject(name) {
    const { project } = get()
    if (!project) return
    const p = { ...project, name, updatedAt: now() }
    set({ project: p })
    debouncedSave(p)
  },

  // ── History ──────────────────────────────────────────────────────────────────

  pushHistory() {
    const { project, _history } = get()
    if (!project) return
    const stack = [..._history, cloneProject(project)].slice(-100)
    set({ _history: stack, _future: [] })
  },

  undo() {
    const { project, _history, _future } = get()
    if (_history.length < 2 || !project) return
    const newHistory = _history.slice(0, -1)
    const restored = cloneProject(newHistory[newHistory.length - 1])
    set({
      _history: newHistory,
      _future: [cloneProject(project), ..._future].slice(0, 100),
      project: restored,
      interaction: { ...get().interaction, selectedIds: [] },
    })
  },

  redo() {
    const { project, _history, _future } = get()
    if (!_future.length || !project) return
    const [next, ...rest] = _future
    set({
      _history: [..._history, cloneProject(project)].slice(-100),
      _future: rest,
      project: cloneProject(next),
      interaction: { ...get().interaction, selectedIds: [] },
    })
  },

  canUndo: () => get()._history.length > 1,
  canRedo: () => get()._future.length > 0,

  // ── Elements ─────────────────────────────────────────────────────────────────

  addElement(el) {
    const { project } = get()
    if (!project) return
    get().pushHistory()
    const p = {
      ...project,
      elements: [...project.elements, el],
      updatedAt: now(),
    }
    set({ project: p })
    debouncedSave(p)
  },

  updateElement(id, patch) {
    const { project } = get()
    if (!project) return
    const p = {
      ...project,
      elements: project.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as GardenElement) : e)),
      updatedAt: now(),
    }
    set({ project: p })
    debouncedSave(p)
  },

  deleteElements(ids) {
    const { project } = get()
    if (!project) return
    get().pushHistory()
    const p = {
      ...project,
      elements: project.elements.filter((e) => !ids.includes(e.id)),
      updatedAt: now(),
    }
    set({
      project: p,
      interaction: {
        ...get().interaction,
        selectedIds: get().interaction.selectedIds.filter((id) => !ids.includes(id)),
      },
    })
    debouncedSave(p)
  },

  duplicateElements(ids) {
    const { project, interaction } = get()
    if (!project) return
    get().pushHistory()
    const maxZ = Math.max(0, ...project.elements.map((e) => e.zIndex))
    let zi = maxZ + 1
    const newEls: GardenElement[] = []
    for (const id of ids) {
      const src = project.elements.find((e) => e.id === id)
      if (!src) continue
      const clone = JSON.parse(JSON.stringify(src)) as GardenElement
      clone.id = nanoid()
      clone.zIndex = zi++
      // Offset by 1m
      if (clone.type === 'rect' || clone.type === 'text' || clone.type === 'image') {
        clone.x += 1
        clone.y += 1
      } else if (clone.type === 'circle' || clone.type === 'symbol') {
        clone.cx += 1
        clone.cy += 1
      } else if (clone.type === 'poly') {
        clone.points = clone.points.map((pt) => ({ x: pt.x + 1, y: pt.y + 1 }))
      } else if (clone.type === 'line') {
        clone.points = clone.points.map((pt) => ({ x: pt.x + 1, y: pt.y + 1 }))
      } else if (clone.type === 'dimension') {
        clone.x1 += 1
        clone.y1 += 1
        clone.x2 += 1
        clone.y2 += 1
      }
      newEls.push(clone)
    }
    const p = {
      ...project,
      elements: [...project.elements, ...newEls],
      updatedAt: now(),
    }
    set({
      project: p,
      interaction: { ...interaction, selectedIds: newEls.map((e) => e.id) },
    })
    debouncedSave(p)
  },

  groupMove(ids, dx, dy) {
    const { project } = get()
    if (!project) return
    const p = {
      ...project,
      elements: project.elements.map((e) => {
        if (!ids.includes(e.id)) return e
        const c = { ...e } as GardenElement
        if (c.type === 'rect' || c.type === 'text' || c.type === 'image') {
          c.x += dx
          c.y += dy
        } else if (c.type === 'circle' || c.type === 'symbol') {
          c.cx += dx
          c.cy += dy
        } else if (c.type === 'poly') {
          c.points = c.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }))
        } else if (c.type === 'line') {
          c.points = c.points.map((pt) => ({ x: pt.x + dx, y: pt.y + dy }))
        } else if (c.type === 'dimension') {
          c.x1 += dx
          c.y1 += dy
          c.x2 += dx
          c.y2 += dy
        }
        return c
      }),
      updatedAt: now(),
    }
    set({ project: p })
    // No debouncedSave here — called on every mouse move; save on mouseup via pushHistory
  },

  bringForward(id) {
    const { project } = get()
    if (!project) return
    get().pushHistory()
    const maxZ = Math.max(0, ...project.elements.map((e) => e.zIndex))
    const p = {
      ...project,
      elements: project.elements.map((e) =>
        e.id === id ? { ...e, zIndex: maxZ + 1 } : e
      ),
      updatedAt: now(),
    }
    set({ project: p })
    debouncedSave(p)
  },

  sendBackward(id) {
    const { project } = get()
    if (!project) return
    get().pushHistory()
    const minZ = Math.min(0, ...project.elements.map((e) => e.zIndex))
    const p = {
      ...project,
      elements: project.elements.map((e) =>
        e.id === id ? { ...e, zIndex: minZ - 1 } : e
      ),
      updatedAt: now(),
    }
    set({ project: p })
    debouncedSave(p)
  },

  // ── Layers ───────────────────────────────────────────────────────────────────

  addLayer(name) {
    const { project } = get()
    if (!project) return ''
    const id = nanoid()
    const maxOrder = Math.max(0, ...project.layers.map((l) => l.order))
    const layer: Layer = { id, name, visible: true, locked: false, order: maxOrder + 1 }
    const p = { ...project, layers: [...project.layers, layer], updatedAt: now() }
    set({ project: p })
    debouncedSave(p)
    return id
  },

  updateLayer(id, patch) {
    const { project } = get()
    if (!project) return
    const p = {
      ...project,
      layers: project.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
      updatedAt: now(),
    }
    set({ project: p })
    debouncedSave(p)
  },

  deleteLayer(id) {
    const { project } = get()
    if (!project || project.layers.length <= 1) return
    const fallback = project.layers.find((l) => l.id !== id)!.id
    get().pushHistory()
    const p = {
      ...project,
      layers: project.layers.filter((l) => l.id !== id),
      elements: project.elements.map((e) =>
        e.layerId === id ? { ...e, layerId: fallback } : e
      ),
      updatedAt: now(),
    }
    set({ project: p, interaction: { ...get().interaction, activeLayerId: fallback } })
    debouncedSave(p)
  },

  reorderLayer(fromOrder, toOrder) {
    const { project } = get()
    if (!project) return
    const layers = [...project.layers]
    const a = layers.find((l) => l.order === fromOrder)
    const b = layers.find((l) => l.order === toOrder)
    if (!a || !b) return
    const p = {
      ...project,
      layers: layers.map((l) => {
        if (l.order === fromOrder) return { ...l, order: toOrder }
        if (l.order === toOrder) return { ...l, order: fromOrder }
        return l
      }),
      updatedAt: now(),
    }
    set({ project: p })
    debouncedSave(p)
  },

  // ── Interaction ──────────────────────────────────────────────────────────────

  setActiveTool: (tool) =>
    set((s) => ({ interaction: { ...s.interaction, activeTool: tool, selectedIds: [] } })),
  setActiveCategoryKey: (cat) =>
    set((s) => ({ interaction: { ...s.interaction, activeCategoryKey: cat } })),
  setSelectedIds: (ids) =>
    set((s) => ({ interaction: { ...s.interaction, selectedIds: ids } })),
  addToSelection: (id) =>
    set((s) => ({
      interaction: {
        ...s.interaction,
        selectedIds: s.interaction.selectedIds.includes(id)
          ? s.interaction.selectedIds
          : [...s.interaction.selectedIds, id],
      },
    })),
  removeFromSelection: (id) =>
    set((s) => ({
      interaction: {
        ...s.interaction,
        selectedIds: s.interaction.selectedIds.filter((i) => i !== id),
      },
    })),
  setHovered: (id) =>
    set((s) => ({ interaction: { ...s.interaction, hoveredId: id } })),
  setDragSelectRect: (rect) =>
    set((s) => ({ interaction: { ...s.interaction, dragSelectRect: rect } })),
  setPendingTextPos: (pos) =>
    set((s) => ({ interaction: { ...s.interaction, pendingTextPos: pos } })),
  setActiveSymbolId: (id) =>
    set((s) => ({ interaction: { ...s.interaction, activeSymbolId: id } })),
  setSnapEnabled: (enabled) =>
    set((s) => ({ interaction: { ...s.interaction, snapEnabled: enabled } })),

  // ── View ─────────────────────────────────────────────────────────────────────

  setView: (patch) => set((s) => ({ view: { ...s.view, ...patch } })),

  zoomToFit(canvasWidth, canvasHeight) {
    const { project } = get()
    if (!project || !project.elements.length) {
      set({ view: { panX: 80, panY: 70, zoom: PX_PER_M } })
      return
    }
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity
    for (const e of project.elements) {
      const b = elementBbox(e)
      mnx = Math.min(mnx, b.x)
      mny = Math.min(mny, b.y)
      mxx = Math.max(mxx, b.x + b.w)
      mxy = Math.max(mxy, b.y + b.h)
    }
    const mg = 60
    const zx = (canvasWidth - mg * 2) / ((mxx - mnx) * PX_PER_M)
    const zy = (canvasHeight - mg * 2) / ((mxy - mny) * PX_PER_M)
    const zoom = Math.min(zx, zy, MAX_ZOOM / PX_PER_M) * PX_PER_M
    set({
      view: {
        zoom,
        panX: mg - mnx * zoom,
        panY: mg - mny * zoom,
      },
    })
  },

  resetView() {
    get().zoomToFit(
      window.innerWidth - 300,
      window.innerHeight - 44
    )
  },

  zoomBy(factor, cx, cy) {
    const { view } = get()
    const nz = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, view.zoom * factor))
    set({
      view: {
        zoom: nz,
        panX: cx - (cx - view.panX) * (nz / view.zoom),
        panY: cy - (cy - view.panY) * (nz / view.zoom),
      },
    })
  },

  // ── UI ───────────────────────────────────────────────────────────────────────

  setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

  // ── Project settings ─────────────────────────────────────────────────────────

  setCanvasBackground(bg) {
    const { project } = get()
    if (!project) return
    const p = { ...project, canvasBackground: bg, updatedAt: now() }
    set({ project: p })
    debouncedSave(p)
  },

  setGridStep(step) {
    const { project } = get()
    if (!project) return
    const p = { ...project, gridStep: step, updatedAt: now() }
    set({ project: p })
    debouncedSave(p)
  },

  setShowGrid(show) {
    const { project } = get()
    if (!project) return
    const p = { ...project, showGrid: show, updatedAt: now() }
    set({ project: p })
    debouncedSave(p)
  },
}))

// ── Bbox helper used internally ───────────────────────────────────────────────

function elementBbox(el: GardenElement): { x: number; y: number; w: number; h: number } {
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
  if (el.type === 'text') return { x: el.x, y: el.y, w: el.text.length * 0.35 + 0.5, h: 1.2 }
  if (el.type === 'image') return { x: el.x, y: el.y, w: el.width, h: el.height }
  if (el.type === 'symbol')
    return {
      x: el.cx - el.scale,
      y: el.cy - el.scale,
      w: el.scale * 2,
      h: el.scale * 2,
    }
  if (el.type === 'dimension') {
    const mnx = Math.min(el.x1, el.x2), mxx = Math.max(el.x1, el.x2)
    const mny = Math.min(el.y1, el.y2), mxy = Math.max(el.y1, el.y2)
    return { x: mnx, y: mny, w: mxx - mnx || 0.1, h: mxy - mny || 0.1 }
  }
  return { x: 0, y: 0, w: 1, h: 1 }
}

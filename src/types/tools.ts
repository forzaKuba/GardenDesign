import type { GardenElement } from './elements'
import type { Layer } from './layers'

export type ToolName =
  | 'select'
  | 'hand'
  | 'rect'
  | 'poly'
  | 'circle'
  | 'line'
  | 'text'
  | 'pencil'
  | 'dimension'
  | 'image'
  | 'symbol'

export interface ViewState {
  panX: number
  panY: number
  zoom: number // pixels per metre
}

export interface CanvasPointerEvent {
  x: number // screen px
  y: number
  wx: number // world metres
  wy: number
  snappedWx: number // after grid + edge snap
  snappedWy: number
  button: number
  shiftKey: boolean
  ctrlKey: boolean
  altKey: boolean
  originalEvent: PointerEvent
}

/** Minimal store surface that tools need — avoids circular imports. */
export interface ToolContext {
  // Element mutations (each calls pushHistory internally)
  addElement(el: GardenElement): void
  updateElement(id: string, patch: Partial<GardenElement>): void
  deleteElements(ids: string[]): void
  pushHistory(): void
  // Interaction state
  getSelectedIds(): string[]
  setSelectedIds(ids: string[]): void
  addToSelection(id: string): void
  getElements(): GardenElement[]
  getLayers(): Layer[]
  getView(): ViewState
  isSnapEnabled(): boolean
  getGridStep(): number
  getActiveCategoryKey(): string
  getActiveLayerId(): string
  // Canvas comms
  canvas: HTMLCanvasElement
  setPreviewElement(el: Partial<GardenElement> | null): void
  scheduleRender(): void
  // For text tool: show input UI
  promptText(position: { wx: number; wy: number }): void
}

export interface Tool {
  name: ToolName
  cursor: string
  onActivate?(ctx: ToolContext): void
  onDeactivate?(ctx: ToolContext): void
  onMouseDown(e: CanvasPointerEvent, ctx: ToolContext): void
  onMouseMove(e: CanvasPointerEvent, ctx: ToolContext): void
  onMouseUp(e: CanvasPointerEvent, ctx: ToolContext): void
  onDblClick?(e: CanvasPointerEvent, ctx: ToolContext): void
  onKeyDown?(e: KeyboardEvent, ctx: ToolContext): void
}

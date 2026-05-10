export type CategoryKey =
  | 'lawn'
  | 'flowerbed'
  | 'vegetable'
  | 'tree'
  | 'path'
  | 'water'
  | 'structure'
  | 'boundary'
  | 'fence'

export type ElementType =
  | 'rect'
  | 'poly'
  | 'circle'
  | 'line'
  | 'text'
  | 'image'
  | 'symbol'
  | 'dimension'

export interface Point {
  x: number
  y: number
}

interface BaseElement {
  id: string
  type: ElementType
  category: CategoryKey
  label: string
  zIndex: number
  layerId: string
  locked: boolean
  visible: boolean
  rotation: number // radians
  fillColor?: string // hex — undefined = use category default
  strokeColor?: string // hex
  opacity: number // 0–1
}

export interface RectElement extends BaseElement {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export interface PolyElement extends BaseElement {
  type: 'poly'
  points: Point[]
  closed: boolean
}

export interface CircleElement extends BaseElement {
  type: 'circle'
  cx: number
  cy: number
  radius: number
}

export interface LineElement extends BaseElement {
  type: 'line'
  points: Point[]
  strokeWidth: number
}

export interface TextElement extends BaseElement {
  type: 'text'
  x: number
  y: number
  text: string
  fontSize: number // metres (world scale) — renderer converts to screen px
  fontWeight: 'normal' | 'bold'
  fontFamily: string
}

export interface ImageElement extends BaseElement {
  type: 'image'
  x: number
  y: number
  width: number
  height: number
  dataUrl: string // base64 data URL
}

export interface SymbolElement extends BaseElement {
  type: 'symbol'
  cx: number
  cy: number
  symbolId: string
  scale: number // metres (radius / half-size)
}

export interface DimensionElement extends BaseElement {
  type: 'dimension'
  x1: number
  y1: number
  x2: number
  y2: number
  offset: number // perpendicular offset in metres
  unit: 'm' | 'ft'
}

export type GardenElement =
  | RectElement
  | PolyElement
  | CircleElement
  | LineElement
  | TextElement
  | ImageElement
  | SymbolElement
  | DimensionElement

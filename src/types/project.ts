import type { GardenElement } from './elements'
import type { Layer } from './layers'

export interface GardenProject {
  id: string
  name: string
  createdAt: string // ISO 8601
  updatedAt: string
  layers: Layer[]
  elements: GardenElement[]
  canvasBackground: 'light' | 'dark'
  gridStep: 0.5 | 1 | 2 // metres
  showGrid: boolean
}

export interface ProjectMeta {
  id: string
  name: string
  updatedAt: string
  elementCount: number
}

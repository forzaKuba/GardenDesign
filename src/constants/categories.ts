import type { CategoryKey } from '@/types/elements'

export interface CategoryDef {
  label: string
  icon: string
  fill: string
  stroke: string
  dash: number[]
}

export const CATEGORIES: Record<CategoryKey, CategoryDef> = {
  lawn: {
    label: 'Lawn',
    icon: '🌿',
    fill: 'rgba(120,195,95,0.5)',
    stroke: '#3a8a20',
    dash: [],
  },
  flowerbed: {
    label: 'Flower Bed',
    icon: '🌸',
    fill: 'rgba(230,140,200,0.5)',
    stroke: '#b83090',
    dash: [],
  },
  vegetable: {
    label: 'Veg Patch',
    icon: '🥕',
    fill: 'rgba(195,155,75,0.55)',
    stroke: '#9a6a15',
    dash: [],
  },
  tree: {
    label: 'Tree',
    icon: '🌳',
    fill: 'rgba(38,115,38,0.78)',
    stroke: '#185018',
    dash: [],
  },
  path: {
    label: 'Path/Patio',
    icon: '🪨',
    fill: 'rgba(200,188,158,0.65)',
    stroke: '#8a7040',
    dash: [],
  },
  water: {
    label: 'Water',
    icon: '💧',
    fill: 'rgba(75,158,225,0.5)',
    stroke: '#1868b0',
    dash: [],
  },
  structure: {
    label: 'Structure',
    icon: '🏠',
    fill: 'rgba(200,148,88,0.78)',
    stroke: '#a06020',
    dash: [],
  },
  boundary: {
    label: 'Boundary',
    icon: '📏',
    fill: 'rgba(0,0,0,0)',
    stroke: '#e07020',
    dash: [8, 5],
  },
  fence: {
    label: 'Fence',
    icon: '🪵',
    fill: 'rgba(0,0,0,0)',
    stroke: '#7a5030',
    dash: [4, 3],
  },
}

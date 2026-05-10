import type { CategoryKey } from './elements'

export interface SymbolDef {
  id: string
  label: string
  category: CategoryKey
  defaultSize: number // metres (radius / half-size used when placing)
  draw(
    ctx: CanvasRenderingContext2D,
    scale: number, // metres — how large to draw
    fillColor: string,
    strokeColor: string
  ): void
}

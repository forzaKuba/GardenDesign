import { nanoid } from 'nanoid'
import type { Tool, ToolName } from '@/types/tools'
import { SelectTool } from './SelectTool'
import { HandTool } from './HandTool'
import { RectTool } from './RectTool'
import { PolyTool } from './PolyTool'
import { CircleTool } from './CircleTool'
import { LineTool } from './LineTool'
import { TextTool } from './TextTool'
import { PencilTool } from './PencilTool'
import { DimensionTool } from './DimensionTool'

export const toolRegistry: Record<ToolName, Tool> = {
  select: SelectTool,
  hand: HandTool,
  rect: RectTool,
  poly: PolyTool,
  circle: CircleTool,
  line: LineTool,
  text: TextTool,
  pencil: PencilTool,
  dimension: DimensionTool,
  image: {
    name: 'image',
    cursor: 'crosshair',
    onMouseDown(_e, ctx) {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = reader.result as string
          const img = new Image()
          img.onload = () => {
            const aspectRatio = img.width / img.height
            const w = 4
            const h = w / aspectRatio
            ctx.addElement({
              id: nanoid(),
              type: 'image',
              category: 'structure',
              label: file.name,
              x: _e.snappedWx - w / 2,
              y: _e.snappedWy - h / 2,
              width: w,
              height: h,
              dataUrl,
              zIndex: ctx.getElements().length,
              layerId: ctx.getActiveLayerId(),
              locked: false,
              visible: true,
              rotation: 0,
              opacity: 1,
            })
          }
          img.src = dataUrl
        }
        reader.readAsDataURL(file)
      }
      input.click()
    },
    onMouseMove() {},
    onMouseUp() {},
  },
  symbol: {
    name: 'symbol',
    cursor: 'crosshair',
    onMouseDown(_e, ctx) {
      // Symbol tool places via SymbolLibraryPanel drag — direct click uses active symbol
      void ctx
    },
    onMouseMove() {},
    onMouseUp() {},
  },
}

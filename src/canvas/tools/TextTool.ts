import type { Tool, CanvasPointerEvent, ToolContext } from '@/types/tools'

export const TextTool: Tool = {
  name: 'text',
  cursor: 'text',

  onMouseDown(e: CanvasPointerEvent, ctx: ToolContext) {
    ctx.promptText({ wx: e.snappedWx, wy: e.snappedWy })
  },

  onMouseMove() {},
  onMouseUp() {},
}

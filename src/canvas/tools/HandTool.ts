import type { Tool } from '@/types/tools'

/**
 * Hand / pan tool — click and drag to scroll the canvas.
 * Panning is handled at the CanvasHost level; this tool signals intent
 * via its name so CanvasHost treats pointer-down as a pan start.
 */
export const HandTool: Tool = {
  name: 'hand',
  cursor: 'grab',
  onMouseDown() {},
  onMouseMove() {},
  onMouseUp() {},
}

import type { ToolName } from '@/types/tools'

export const TOOL_KEYS: Partial<Record<string, ToolName>> = {
  v: 'select',
  r: 'rect',
  p: 'poly',
  c: 'circle',
  l: 'line',
  t: 'text',
  b: 'pencil',
  d: 'dimension',
}

export interface ShortcutDef {
  label: string
  shortcut: string
}

export const TOOL_SHORTCUTS: Record<ToolName, string> = {
  select: 'V',
  rect: 'R',
  poly: 'P',
  circle: 'C',
  line: 'L',
  text: 'T',
  pencil: 'B',
  dimension: 'D',
  image: 'I',
  symbol: 'S',
}

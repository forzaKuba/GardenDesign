import { useGardenStore } from '@/store/gardenStore'
import type { ToolName } from '@/types/tools'
import { Tooltip } from './ui/Tooltip'
import { TOOL_SHORTCUTS } from '@/constants/keyboard'

interface ToolDef {
  id: ToolName
  icon: string
  label: string
}

const TOOLS: ToolDef[] = [
  { id: 'select', icon: '↖', label: 'Select / Move' },
  { id: 'hand', icon: '✋', label: 'Pan / Hand' },
  { id: 'rect', icon: '▭', label: 'Rectangle' },
  { id: 'poly', icon: '⬡', label: 'Polygon' },
  { id: 'circle', icon: '○', label: 'Circle / Tree' },
  { id: 'line', icon: '╱', label: 'Line / Fence' },
  { id: 'pencil', icon: '✏', label: 'Freehand Draw' },
  { id: 'text', icon: 'Aa', label: 'Text Label' },
  { id: 'dimension', icon: '↔', label: 'Dimension Line' },
  { id: 'image', icon: '🖼', label: 'Place Image' },
]

const EDIT_ACTIONS = [
  {
    icon: '🗑',
    label: 'Delete selected',
    shortcut: 'Del',
    action: () => {
      const { interaction, deleteElements } = useGardenStore.getState()
      if (interaction.selectedIds.length) deleteElements(interaction.selectedIds)
    },
  },
  {
    icon: '⧉',
    label: 'Duplicate',
    shortcut: 'Ctrl+D',
    action: () => {
      const { interaction, duplicateElements } = useGardenStore.getState()
      if (interaction.selectedIds.length) duplicateElements(interaction.selectedIds)
    },
  },
  {
    icon: '▲',
    label: 'Bring Forward',
    shortcut: ']',
    action: () => {
      const { interaction, bringForward } = useGardenStore.getState()
      if (interaction.selectedIds[0]) bringForward(interaction.selectedIds[0])
    },
  },
  {
    icon: '▼',
    label: 'Send Backward',
    shortcut: '[',
    action: () => {
      const { interaction, sendBackward } = useGardenStore.getState()
      if (interaction.selectedIds[0]) sendBackward(interaction.selectedIds[0])
    },
  },
]

export default function Toolbar() {
  const activeTool = useGardenStore((s) => s.interaction.activeTool)
  const { setActiveTool } = useGardenStore()

  return (
    <div className="w-13 bg-neutral-900 border-r border-neutral-800 flex flex-col items-center py-1.5 gap-0 flex-shrink-0 overflow-y-auto">
      {/* Tool buttons */}
      <div className="flex flex-col items-center gap-0.5 pb-2 border-b border-neutral-800 w-full px-1.5 mb-1">
        <span className="text-[8px] text-neutral-600 uppercase tracking-wider mb-0.5">Draw</span>
        {TOOLS.map((t) => (
          <Tooltip key={t.id} content={t.label} shortcut={TOOL_SHORTCUTS[t.id]} side="right">
            <button
              onClick={() => setActiveTool(t.id)}
              className={`w-10 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 text-base transition-all border
                ${activeTool === t.id
                  ? 'bg-green-700 text-white border-transparent shadow-[0_0_0_2px_rgba(92,158,92,0.3)]'
                  : 'text-neutral-500 border-transparent hover:bg-neutral-800 hover:text-neutral-200'
                }`}
            >
              <span>{t.icon}</span>
              <span className="text-[8px] font-mono opacity-60 leading-none">
                {TOOL_SHORTCUTS[t.id]}
              </span>
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Edit actions */}
      <div className="flex flex-col items-center gap-0.5 w-full px-1.5">
        <span className="text-[8px] text-neutral-600 uppercase tracking-wider mb-0.5">Edit</span>
        {EDIT_ACTIONS.map((a) => (
          <Tooltip key={a.label} content={a.label} shortcut={a.shortcut} side="right">
            <button
              onClick={a.action}
              className="w-10 h-9 rounded-lg flex flex-col items-center justify-center gap-0.5 text-base
                text-neutral-500 border border-transparent hover:bg-neutral-800 hover:text-neutral-200 transition-all"
            >
              {a.icon}
            </button>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

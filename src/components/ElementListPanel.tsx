import { useGardenStore } from '@/store/gardenStore'
import { CATEGORIES } from '@/constants/categories'

export default function ElementListPanel() {
  const elements = useGardenStore((s) => s.project?.elements ?? [])
  const selectedIds = useGardenStore((s) => s.interaction.selectedIds)
  const ui = useGardenStore((s) => s.ui)
  const { setSelectedIds, setUI, updateElement } = useGardenStore()

  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex)

  return (
    <div className="flex flex-col border-t border-neutral-800">
      <div
        className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-neutral-800/50"
        onClick={() => setUI({ ...ui, showElementList: !ui.showElementList })}
      >
        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">
          Elements ({elements.length})
        </span>
        <span className="text-neutral-600 text-xs">{ui.showElementList ? '▲' : '▼'}</span>
      </div>

      {ui.showElementList && (
        <div className="max-h-48 overflow-y-auto px-1.5 pb-1">
          {sorted.map((el) => {
            const cat = CATEGORIES[el.category]
            const isSel = selectedIds.includes(el.id)
            return (
              <div
                key={el.id}
                onClick={() => setSelectedIds([el.id])}
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer group
                  ${isSel ? 'bg-green-900/30 border border-green-800/40' : 'hover:bg-neutral-800/60'}`}
              >
                <span className="text-xs">{cat.icon}</span>
                <span className="flex-1 text-xs text-neutral-300 truncate min-w-0">
                  {el.label || el.type}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }) }}
                  className={`text-[10px] ${el.visible ? 'text-neutral-600' : 'text-neutral-800'} opacity-0 group-hover:opacity-100`}
                >
                  {el.visible ? '👁' : '🚫'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !el.locked }) }}
                  className={`text-[10px] ${el.locked ? 'text-amber-500' : 'text-neutral-700'} opacity-0 group-hover:opacity-100`}
                >
                  {el.locked ? '🔒' : '🔓'}
                </button>
              </div>
            )
          })}
          {!elements.length && (
            <div className="text-xs text-neutral-600 text-center py-3">No elements</div>
          )}
        </div>
      )}
    </div>
  )
}

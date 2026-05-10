import { useGardenStore } from '@/store/gardenStore'
import { DragList } from './ui/DragList'
import type { Layer } from '@/types/layers'

export default function LayerPanel() {
  const layers = useGardenStore((s) => s.project?.layers ?? [])
  const activeLayerId = useGardenStore((s) => s.interaction.activeLayerId)
  const { addLayer, updateLayer, deleteLayer, reorderLayer, setUI, ui } = useGardenStore()

  const sorted = [...layers].sort((a, b) => b.order - a.order) // top of list = highest order

  function handleReorder(fromIdx: number, toIdx: number) {
    const a = sorted[fromIdx]
    const b = sorted[toIdx]
    if (a && b) reorderLayer(a.order, b.order)
  }

  return (
    <div className="flex flex-col border-t border-neutral-800">
      <div
        className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-neutral-800/50"
        onClick={() => setUI({ ...ui, showLayerPanel: !ui.showLayerPanel })}
      >
        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">Layers</span>
        <span className="text-neutral-600 text-xs">{ui.showLayerPanel ? '▲' : '▼'}</span>
      </div>

      {ui.showLayerPanel && (
        <div className="px-1.5 pb-2">
          <DragList
            items={sorted}
            keyFn={(l) => l.id}
            onReorder={handleReorder}
            renderItem={(layer: Layer, dragProps) => (
              <div
                className={`flex items-center gap-1.5 px-1.5 py-1 rounded group cursor-pointer
                  ${activeLayerId === layer.id ? 'bg-green-900/30 border border-green-800/40' : 'hover:bg-neutral-800/60'}`}
                onClick={() => useGardenStore.getState().setUI({
                  ...useGardenStore.getState().ui
                })}
              >
                {/* Drag handle */}
                <span
                  {...dragProps}
                  className="text-neutral-700 cursor-grab hover:text-neutral-500 text-xs select-none"
                >
                  ⠿
                </span>

                {/* Eye toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
                  className={`text-xs ${layer.visible ? 'text-neutral-400' : 'text-neutral-700'}`}
                  title="Toggle visibility"
                >
                  {layer.visible ? '👁' : '🚫'}
                </button>

                {/* Lock toggle */}
                <button
                  onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }}
                  className={`text-xs ${layer.locked ? 'text-amber-500' : 'text-neutral-700'}`}
                  title="Toggle lock"
                >
                  {layer.locked ? '🔒' : '🔓'}
                </button>

                {/* Name */}
                <span
                  className="flex-1 text-xs text-neutral-300 truncate"
                  onDoubleClick={(e) => {
                    e.stopPropagation()
                    const name = window.prompt('Rename layer:', layer.name)
                    if (name) updateLayer(layer.id, { name })
                  }}
                >
                  {layer.name}
                </span>

                {/* Delete */}
                {layers.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`Delete layer "${layer.name}"?`)) deleteLayer(layer.id)
                    }}
                    className="text-neutral-700 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          />

          <button
            onClick={() => {
              const name = window.prompt('Layer name:', 'New Layer')
              if (name) addLayer(name)
            }}
            className="w-full mt-1.5 py-1 text-xs text-neutral-600 hover:text-neutral-300 border border-dashed
              border-neutral-800 hover:border-neutral-600 rounded transition-colors"
          >
            + Add Layer
          </button>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { SYMBOL_LIBRARY, SYMBOL_MAP } from '@/symbols/index'
import type { SymbolDef } from '@/types/symbols'
import { CATEGORIES } from '@/constants/categories'
import { nanoid } from 'nanoid'

function SymbolPreview({ sym }: { sym: SymbolDef }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, 48, 48)
    const cat = CATEGORIES[sym.category]
    ctx.save()
    ctx.translate(24, 24)
    sym.draw(ctx, 1, cat.fill, cat.stroke)
    ctx.restore()
  }, [sym])

  return <canvas ref={ref} width={48} height={48} className="w-12 h-12" />
}

export default function SymbolLibraryPanel() {
  const activeSymbolId = useGardenStore((s) => s.interaction.activeSymbolId)
  const { setActiveSymbolId, setActiveTool } = useGardenStore()

  function placeDrop(symbolId: string, wx: number, wy: number) {
    const sym = SYMBOL_MAP[symbolId]
    if (!sym) return
    const cat = CATEGORIES[sym.category]
    useGardenStore.getState().addElement({
      id: nanoid(),
      type: 'symbol',
      category: sym.category,
      label: sym.label,
      cx: wx,
      cy: wy,
      symbolId,
      scale: sym.defaultSize,
      zIndex: useGardenStore.getState().project?.elements.length ?? 0,
      layerId: useGardenStore.getState().interaction.activeLayerId,
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
      fillColor: cat.fill,
      strokeColor: cat.stroke,
    })
  }

  // Group by category
  const grouped: Record<string, SymbolDef[]> = {}
  for (const sym of SYMBOL_LIBRARY) {
    const group = sym.category
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(sym)
  }

  const groupLabels: Record<string, string> = {
    tree: 'Trees',
    structure: 'Structures',
    vegetable: 'Garden',
    path: 'Hardscape',
    water: 'Water',
    fence: 'Hardscape',
    boundary: 'Garden',
  }

  const uniqueGroups: { label: string; items: SymbolDef[] }[] = []
  const seenLabels = new Set<string>()
  for (const [cat, items] of Object.entries(grouped)) {
    const label = groupLabels[cat] ?? cat
    const existing = uniqueGroups.find((g) => g.label === label)
    if (existing) {
      existing.items.push(...items)
    } else {
      uniqueGroups.push({ label, items })
      seenLabels.add(label)
    }
  }

  return (
    <div className="flex flex-col border-t border-neutral-800">
      <div className="px-2.5 py-1.5">
        <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">Symbol Library</span>
      </div>
      <div className="overflow-y-auto max-h-72 px-1.5 pb-2">
        {uniqueGroups.map(({ label, items }) => (
          <div key={label} className="mb-2">
            <div className="text-[9px] uppercase tracking-wider text-neutral-600 px-1 mb-1">{label}</div>
            <div className="grid grid-cols-3 gap-1">
              {items.map((sym) => (
                <button
                  key={sym.id}
                  title={sym.label}
                  onClick={() => {
                    setActiveSymbolId(sym.id)
                    setActiveTool('symbol')
                  }}
                  draggable
                  onDragEnd={(e) => {
                    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
                    if (!canvas) return
                    const rect = canvas.getBoundingClientRect()
                    const view = useGardenStore.getState().view
                    const sx = e.clientX - rect.left
                    const sy = e.clientY - rect.top
                    const wx = (sx - view.panX) / view.zoom
                    const wy = (sy - view.panY) / view.zoom
                    if (sx >= 0 && sx <= rect.width && sy >= 0 && sy <= rect.height) {
                      placeDrop(sym.id, wx, wy)
                    }
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1 rounded border transition-all
                    ${activeSymbolId === sym.id
                      ? 'border-green-600 bg-green-900/30'
                      : 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/60'
                    }`}
                >
                  <SymbolPreview sym={sym} />
                  <span className="text-[8px] text-neutral-500 text-center leading-tight truncate w-full">
                    {sym.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

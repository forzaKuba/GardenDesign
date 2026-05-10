import { useGardenStore } from '@/store/gardenStore'
import type { GardenElement, CategoryKey } from '@/types/elements'
import { CATEGORIES } from '@/constants/categories'
import { ColorPicker } from './ColorPicker'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">{label}</div>
      {children}
    </div>
  )
}

function Input({
  value,
  onChange,
  type = 'text',
  step,
  min,
}: {
  value: string | number
  onChange: (v: string) => void
  type?: string
  step?: string
  min?: string
}) {
  return (
    <input
      type={type}
      value={value}
      step={step}
      min={min}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1
        text-xs text-neutral-200 outline-none focus:border-green-600"
    />
  )
}

function GeometryInputs({ el }: { el: GardenElement }) {
  const { updateElement } = useGardenStore()

  function num(id: string, val: number) {
    updateElement(el.id, { [id]: val } as Partial<GardenElement>)
  }

  if (el.type === 'rect') {
    return (
      <>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <Field label="Width m">
            <Input type="number" step="0.1" min="0.1" value={el.width.toFixed(2)}
              onChange={(v) => num('width', parseFloat(v))} />
          </Field>
          <Field label="Height m">
            <Input type="number" step="0.1" min="0.1" value={el.height.toFixed(2)}
              onChange={(v) => num('height', parseFloat(v))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <Field label="X pos">
            <Input type="number" step="0.1" value={el.x.toFixed(2)}
              onChange={(v) => num('x', parseFloat(v))} />
          </Field>
          <Field label="Y pos">
            <Input type="number" step="0.1" value={el.y.toFixed(2)}
              onChange={(v) => num('y', parseFloat(v))} />
          </Field>
        </div>
      </>
    )
  }
  if (el.type === 'circle') {
    return (
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <Field label="Radius m">
          <Input type="number" step="0.1" min="0.1" value={el.radius.toFixed(2)}
            onChange={(v) => num('radius', parseFloat(v))} />
        </Field>
        <Field label="Diameter m">
          <Input type="number" step="0.1" min="0.1" value={(el.radius * 2).toFixed(2)}
            onChange={(v) => num('radius', parseFloat(v) / 2)} />
        </Field>
      </div>
    )
  }
  if (el.type === 'text') {
    return (
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <Field label="Font size">
          <Input type="number" step="0.05" min="0.1" value={el.fontSize.toFixed(2)}
            onChange={(v) => num('fontSize', parseFloat(v))} />
        </Field>
        <Field label="Weight">
          <select
            value={el.fontWeight}
            onChange={(e) => updateElement(el.id, { fontWeight: e.target.value as 'normal' | 'bold' })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1
              text-xs text-neutral-200 outline-none focus:border-green-600"
          >
            <option value="normal">Normal</option>
            <option value="bold">Bold</option>
          </select>
        </Field>
      </div>
    )
  }
  if (el.type === 'symbol') {
    return (
      <Field label="Scale m">
        <Input type="number" step="0.1" min="0.1" value={el.scale.toFixed(2)}
          onChange={(v) => num('scale', parseFloat(v))} />
      </Field>
    )
  }
  if (el.type === 'image') {
    return (
      <div className="grid grid-cols-2 gap-1.5 mb-2">
        <Field label="Width m">
          <Input type="number" step="0.1" min="0.1" value={el.width.toFixed(2)}
            onChange={(v) => num('width', parseFloat(v))} />
        </Field>
        <Field label="Height m">
          <Input type="number" step="0.1" min="0.1" value={el.height.toFixed(2)}
            onChange={(v) => num('height', parseFloat(v))} />
        </Field>
      </div>
    )
  }
  return null
}

export default function PropertiesPanel() {
  const selectedIds = useGardenStore((s) => s.interaction.selectedIds)
  const elements = useGardenStore((s) => s.project?.elements ?? [])
  const layers = useGardenStore((s) => s.project?.layers ?? [])
  const activeCat = useGardenStore((s) => s.interaction.activeCategoryKey)
  const snap = useGardenStore((s) => s.interaction.snapEnabled)
  const gridStep = useGardenStore((s) => s.project?.gridStep ?? 1)
  const canvasBg = useGardenStore((s) => s.project?.canvasBackground ?? 'light')
  const { updateElement, setActiveCategoryKey, setSnapEnabled, setGridStep, setCanvasBackground } = useGardenStore()

  const selected = elements.filter((e) => selectedIds.includes(e.id))
  const el = selected.length === 1 ? selected[0] : null

  if (!el && selected.length === 0) {
    // Document settings
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-2.5 border-b border-neutral-800 text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
          Active Category
        </div>
        <div className="p-2.5 grid grid-cols-2 gap-1.5 border-b border-neutral-800">
          {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => {
            const cat = CATEGORIES[key]
            return (
              <button
                key={key}
                onClick={() => setActiveCategoryKey(key)}
                className={`px-1.5 py-1.5 rounded text-[9px] flex flex-col items-center gap-1 border transition-all
                  ${activeCat === key
                    ? 'text-white border-transparent font-semibold'
                    : 'text-neutral-500 border-neutral-800 hover:text-neutral-300 hover:border-neutral-700'
                  }`}
                style={activeCat === key ? { background: cat.stroke, borderColor: cat.stroke } : {}}
              >
                <span className="text-xs">{cat.icon}</span>
                {cat.label}
              </button>
            )
          })}
        </div>

        <div className="p-2.5 border-b border-neutral-800">
          <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold mb-2">Canvas</div>
          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={canvasBg === 'dark'}
              onChange={(e) => setCanvasBackground(e.target.checked ? 'dark' : 'light')}
              className="accent-green-600"
            />
            Dark canvas background
          </label>
          <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">Grid step</div>
          <div className="flex gap-1">
            {([0.5, 1, 2] as const).map((s) => (
              <button
                key={s}
                onClick={() => setGridStep(s)}
                className={`flex-1 py-1 rounded text-xs border transition-all
                  ${gridStep === s
                    ? 'bg-green-700 text-white border-transparent'
                    : 'text-neutral-500 border-neutral-700 hover:border-neutral-500'
                  }`}
              >
                {s}m
              </button>
            ))}
          </div>
        </div>

        <div className="p-2.5">
          <label className="flex items-center gap-2 text-xs text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={snap}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="accent-green-600"
            />
            Grid snap
          </label>
        </div>
      </div>
    )
  }

  if (selected.length > 1) {
    return (
      <div className="p-3 text-xs text-neutral-400">
        <div className="mb-3 font-medium text-neutral-200">{selected.length} elements selected</div>
        <button
          onClick={() => useGardenStore.getState().deleteElements(selectedIds)}
          className="w-full py-1.5 rounded border border-red-800 text-red-400 hover:bg-red-900/30 text-xs mb-2"
        >
          🗑 Delete all
        </button>
        <button
          onClick={() => useGardenStore.getState().duplicateElements(selectedIds)}
          className="w-full py-1.5 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-700/30 text-xs"
        >
          ⧉ Duplicate all
        </button>
      </div>
    )
  }

  if (!el) return null

  const catDef = CATEGORIES[el.category]

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-2.5">
        {/* Info box */}
        <div className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 font-mono text-[10px] text-neutral-500 mb-2.5">
          {catDef.icon} <span className="text-green-400">{el.type.toUpperCase()}</span> · {catDef.label}
        </div>

        <Field label="Label">
          <Input
            value={el.label ?? ''}
            onChange={(v) => {
              updateElement(el.id, { label: v, ...(el.type === 'text' ? { text: v } : {}) })
            }}
          />
        </Field>

        <Field label="Category">
          <select
            value={el.category}
            onChange={(e) => updateElement(el.id, { category: e.target.value as CategoryKey })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1
              text-xs text-neutral-200 outline-none focus:border-green-600"
          >
            {(Object.keys(CATEGORIES) as CategoryKey[]).map((k) => (
              <option key={k} value={k}>{CATEGORIES[k].icon} {CATEGORIES[k].label}</option>
            ))}
          </select>
        </Field>

        {el.type !== 'image' && (
          <>
            <ColorPicker
              label="Fill"
              color={el.fillColor ?? catDef.fill}
              onChange={(c) => updateElement(el.id, { fillColor: c })}
            />
            <ColorPicker
              label="Stroke"
              color={el.strokeColor ?? catDef.stroke}
              onChange={(c) => updateElement(el.id, { strokeColor: c })}
            />
          </>
        )}

        <ColorPicker
          label="Opacity"
          color={el.fillColor ?? catDef.fill}
          opacity={el.opacity}
          onChange={(c) => updateElement(el.id, { fillColor: c })}
          onOpacityChange={(o) => updateElement(el.id, { opacity: o })}
        />

        <Field label="Layer">
          <select
            value={el.layerId}
            onChange={(e) => updateElement(el.id, { layerId: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1
              text-xs text-neutral-200 outline-none focus:border-green-600"
          >
            {layers.map((l) => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Rotation °">
          <Input
            type="number"
            step="1"
            value={Math.round((el.rotation ?? 0) * (180 / Math.PI))}
            onChange={(v) => updateElement(el.id, { rotation: parseFloat(v) * (Math.PI / 180) })}
          />
        </Field>

        <div className="flex gap-2 mb-3">
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={el.locked}
              onChange={(e) => updateElement(el.id, { locked: e.target.checked })}
              className="accent-green-600"
            />
            Locked
          </label>
          <label className="flex items-center gap-1.5 text-xs text-neutral-400 cursor-pointer">
            <input
              type="checkbox"
              checked={el.visible}
              onChange={(e) => updateElement(el.id, { visible: e.target.checked })}
              className="accent-green-600"
            />
            Visible
          </label>
        </div>

        <div className="h-px bg-neutral-800 my-2" />
        <GeometryInputs el={el} />

        <div className="h-px bg-neutral-800 my-2" />

        {/* Actions */}
        <button
          onClick={() => useGardenStore.getState().duplicateElements([el.id])}
          className="w-full py-1.5 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-700/30 text-xs mb-1.5"
        >
          ⧉ Duplicate
        </button>
        <button
          onClick={() => useGardenStore.getState().bringForward(el.id)}
          className="w-full py-1.5 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-700/30 text-xs mb-1.5"
        >
          ▲ Bring Forward
        </button>
        <button
          onClick={() => useGardenStore.getState().sendBackward(el.id)}
          className="w-full py-1.5 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-700/30 text-xs mb-1.5"
        >
          ▼ Send Backward
        </button>
        <button
          onClick={() => useGardenStore.getState().deleteElements([el.id])}
          className="w-full py-1.5 rounded border border-red-800 text-red-400 hover:bg-red-900/30 text-xs"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  )
}

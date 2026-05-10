interface ColorPickerProps {
  label: string
  color: string // hex, e.g. '#4CAF50'
  opacity?: number // 0–1
  onChange: (color: string) => void
  onOpacityChange?: (opacity: number) => void
}

export function ColorPicker({ label, color, opacity, onChange, onOpacityChange }: ColorPickerProps) {
  return (
    <div className="mb-2">
      <div className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={color.startsWith('#') ? color.slice(0, 7) : '#888888'}
          onChange={(e) => onChange(e.target.value)}
          className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <input
          type="text"
          value={color.startsWith('#') ? color.slice(0, 7) : color}
          onChange={(e) => {
            const v = e.target.value
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v)
          }}
          className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1
            text-xs font-mono text-neutral-200 outline-none focus:border-green-600"
        />
      </div>
      {onOpacityChange !== undefined && opacity !== undefined && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[9px] text-neutral-500 w-12">Opacity</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
            className="flex-1 accent-green-600"
          />
          <span className="text-[10px] text-neutral-400 w-8 text-right">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

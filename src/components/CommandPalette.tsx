import { useEffect, useRef, useState } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { fuzzySearch, SearchItem } from '@/lib/fuzzySearch'

function buildCommands(): SearchItem[] {
  const store = useGardenStore.getState()
  const cmds: SearchItem[] = [
    // Tools
    { label: 'Select Tool', shortcut: 'V', action: () => store.setActiveTool('select') },
    { label: 'Rectangle Tool', shortcut: 'R', action: () => store.setActiveTool('rect') },
    { label: 'Polygon Tool', shortcut: 'P', action: () => store.setActiveTool('poly') },
    { label: 'Circle Tool', shortcut: 'C', action: () => store.setActiveTool('circle') },
    { label: 'Line Tool', shortcut: 'L', action: () => store.setActiveTool('line') },
    { label: 'Text Tool', shortcut: 'T', action: () => store.setActiveTool('text') },
    { label: 'Pencil Tool', shortcut: 'B', action: () => store.setActiveTool('pencil') },
    { label: 'Dimension Tool', shortcut: 'D', action: () => store.setActiveTool('dimension') },
    // View
    { label: 'Zoom to Fit', shortcut: '0', action: () => store.resetView() },
    { label: 'Toggle Grid', shortcut: 'G', action: () => store.setShowGrid(!store.project?.showGrid) },
    { label: 'Toggle Snap', action: () => store.setSnapEnabled(!store.interaction.snapEnabled) },
    { label: 'Toggle Minimap', action: () => store.setUI({ ...store.ui, showMinimap: !store.ui.showMinimap }) },
    { label: 'Dark Canvas Background', action: () => store.setCanvasBackground('dark') },
    { label: 'Light Canvas Background', action: () => store.setCanvasBackground('light') },
    // History
    { label: 'Undo', shortcut: 'Ctrl+Z', action: () => store.undo() },
    { label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => store.redo() },
    // Selection
    { label: 'Select All', shortcut: 'Ctrl+A', action: () => store.setSelectedIds(store.project?.elements.map(e => e.id) ?? []) },
    { label: 'Deselect All', shortcut: 'Esc', action: () => store.setSelectedIds([]) },
    { label: 'Delete Selected', action: () => store.deleteElements(store.interaction.selectedIds) },
    { label: 'Duplicate Selected', action: () => store.duplicateElements(store.interaction.selectedIds) },
    // Projects
    { label: 'Project Manager', action: () => store.setUI({ ...store.ui, showProjectManager: true }) },
    { label: 'New Project', action: () => { const n = window.prompt('Project name:'); if (n) store.newProject(n) } },
    // Grid steps
    { label: 'Grid Step: 0.5m', action: () => store.setGridStep(0.5) },
    { label: 'Grid Step: 1m', action: () => store.setGridStep(1) },
    { label: 'Grid Step: 2m', action: () => store.setGridStep(2) },
  ]

  // Elements
  for (const el of store.project?.elements ?? []) {
    cmds.push({
      label: el.label || el.type,
      sublabel: `${el.type} · ${el.category}`,
      action: () => store.setSelectedIds([el.id]),
    })
  }

  return cmds
}

export default function CommandPalette() {
  const visible = useGardenStore((s) => s.ui.showCommandPalette)
  const { setUI, ui } = useGardenStore()
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = buildCommands()
  const results = fuzzySearch(query, commands)

  useEffect(() => {
    if (visible) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [visible])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  function close() {
    setUI({ ...ui, showCommandPalette: false })
  }

  function run(idx: number) {
    results[idx]?.action()
    close()
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-24"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl w-[480px] overflow-hidden">
        <div className="flex items-center px-3 py-2.5 border-b border-neutral-700 gap-2">
          <span className="text-neutral-500 text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions and elements…"
            className="flex-1 bg-transparent text-neutral-100 text-sm outline-none placeholder:text-neutral-600"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { setActiveIdx((i) => Math.min(i + 1, results.length - 1)); e.preventDefault() }
              if (e.key === 'ArrowUp') { setActiveIdx((i) => Math.max(i - 1, 0)); e.preventDefault() }
              if (e.key === 'Enter') run(activeIdx)
              if (e.key === 'Escape') close()
            }}
          />
          <kbd className="text-[10px] text-neutral-600 bg-neutral-900 px-1.5 py-0.5 rounded">Esc</kbd>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {results.map((item, i) => (
            <button
              key={i}
              onClick={() => run(i)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors
                ${i === activeIdx ? 'bg-neutral-700' : 'hover:bg-neutral-750'}`}
            >
              <span className="flex-1 text-sm text-neutral-200">{item.label}</span>
              {item.sublabel && <span className="text-xs text-neutral-500">{item.sublabel}</span>}
              {item.shortcut && (
                <kbd className="text-[10px] text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded font-mono">
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
          {results.length === 0 && (
            <div className="text-center text-neutral-600 text-sm py-6">No results</div>
          )}
        </div>
      </div>
    </div>
  )
}

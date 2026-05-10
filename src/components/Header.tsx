import { useState } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { exportPng } from '@/lib/exportPng'
import { exportPdf } from '@/lib/exportPdf'
import { exportProjectJson, importProjectJson, readFileAsText } from '@/lib/exportJson'

export default function Header() {
  const project = useGardenStore((s) => s.project)
  const canUndo = useGardenStore((s) => s._history.length > 1)
  const canRedo = useGardenStore((s) => s._future.length > 0)
  const showGrid = useGardenStore((s) => s.project?.showGrid ?? true)
  const snap = useGardenStore((s) => s.interaction.snapEnabled)
  const { undo, redo, setShowGrid, setSnapEnabled, setUI, ui, resetView } = useGardenStore()
  const [exporting, setExporting] = useState<'pdf' | 'png' | null>(null)

  async function handleExportPdf() {
    if (!project || exporting) return
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    setExporting('pdf')
    try {
      await exportPdf(canvas, project, 'landscape')
    } finally {
      setExporting(null)
    }
  }

  async function handleExportPng() {
    if (exporting) return
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    setExporting('png')
    try {
      exportPng(canvas, `${project?.name ?? 'garden'}.png`)
    } finally {
      setExporting(null)
    }
  }

  function handleExportJson() {
    if (project) exportProjectJson(project)
  }

  async function handleImportJson() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.garden.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await readFileAsText(file)
        const imported = importProjectJson(text)
        useGardenStore.getState().loadProject(imported)
      } catch (err) {
        alert(String(err))
      }
    }
    input.click()
  }

  return (
    <header className="h-11 bg-neutral-900 border-b border-neutral-800 flex items-center px-3 gap-2 flex-shrink-0 z-10">
      {/* Logo */}
      <div className="text-sm font-semibold text-green-400 flex items-center gap-1.5 whitespace-nowrap mr-1">
        <span>🌿</span>
        <span>Garden Planner</span>
        {project && (
          <span className="text-neutral-500 font-normal text-xs ml-1">— {project.name}</span>
        )}
      </div>

      <div className="w-px h-5 bg-neutral-700 mx-1" />

      {/* Undo / Redo */}
      <button
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
        className="hbtn disabled:opacity-30"
      >
        ↩ Undo
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
        className="hbtn disabled:opacity-30"
      >
        ↪ Redo
      </button>

      <div className="w-px h-5 bg-neutral-700 mx-1" />

      <button onClick={resetView} title="Fit all (0)" className="hbtn">⊡ Fit</button>
      <button
        onClick={() => setShowGrid(!showGrid)}
        className={`hbtn ${showGrid ? '' : 'opacity-50'}`}
        title="Toggle grid (G)"
      >
        ⊞ Grid
      </button>
      <button
        onClick={() => setSnapEnabled(!snap)}
        className={`hbtn ${snap ? '' : 'opacity-50'}`}
        title="Toggle snap"
      >
        ⊹ Snap
      </button>

      <div className="w-px h-5 bg-neutral-700 mx-1" />

      <button onClick={() => setUI({ ...ui, showProjectManager: true })} className="hbtn">
        📁 Projects
      </button>

      {/* Spacer */}
      <div className="ml-auto flex items-center gap-2">
        <span
          id="coord-display"
          className="font-mono text-[11px] text-neutral-500 min-w-[140px] text-right"
        >
          x: 0.0m  y: 0.0m
        </span>

        <div className="w-px h-5 bg-neutral-700 mx-1" />

        {/* Export menu */}
        <div className="relative group">
          <button className="hbtn hbtn-primary">⬇ Export</button>
          <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700
            rounded-lg shadow-xl w-44 py-1 hidden group-hover:block z-50">
            <button onClick={handleExportPng} disabled={!!exporting} className="menu-item disabled:opacity-50">
              {exporting === 'png' ? '⏳ Exporting…' : '📸 Export PNG'}
            </button>
            <button onClick={handleExportPdf} disabled={!!exporting} className="menu-item disabled:opacity-50">
              {exporting === 'pdf' ? '⏳ Exporting…' : '📄 Export PDF (A4)'}
            </button>
            <div className="h-px bg-neutral-700 my-1" />
            <button onClick={handleExportJson} className="menu-item">💾 Save as JSON</button>
            <button onClick={handleImportJson} className="menu-item">📂 Import JSON</button>
          </div>
        </div>
      </div>
    </header>
  )
}

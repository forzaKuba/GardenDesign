import { useState, useEffect } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { listProjects, loadProject, deleteProject } from '@/lib/localStorageDb'
import { exportProjectJson, importProjectJson, readFileAsText } from '@/lib/exportJson'
import { Modal } from './ui/Modal'
import type { ProjectMeta } from '@/types/project'

export default function ProjectManager() {
  const visible = useGardenStore((s) => s.ui.showProjectManager)
  const { setUI, ui, newProject, loadProject: storeLoad } = useGardenStore()
  const [projects, setProjects] = useState<ProjectMeta[]>([])

  useEffect(() => {
    if (visible) setProjects(listProjects())
  }, [visible])

  function close() {
    setUI({ ...ui, showProjectManager: false })
  }

  function handleOpen(id: string) {
    const p = loadProject(id)
    if (p) { storeLoad(p); close() }
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete project "${name}"?`)) return
    deleteProject(id)
    setProjects(listProjects())
  }

  function handleNew() {
    const name = window.prompt('New project name:', 'My Garden')
    if (name) { newProject(name); close() }
  }

  async function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await readFileAsText(file)
        const imported = importProjectJson(text)
        storeLoad(imported)
        close()
      } catch (err) {
        alert(String(err))
      }
    }
    input.click()
  }

  function handleExportCurrent() {
    const p = useGardenStore.getState().project
    if (p) exportProjectJson(p)
  }

  if (!visible) return null

  return (
    <Modal title="Projects" onClose={close} width="w-96">
      <div className="flex gap-2 mb-4">
        <button onClick={handleNew}
          className="flex-1 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-medium">
          + New Project
        </button>
        <button onClick={handleImport}
          className="py-1.5 px-3 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-700 text-xs">
          Import JSON
        </button>
        <button onClick={handleExportCurrent}
          className="py-1.5 px-3 rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-700 text-xs">
          Export Current
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="text-neutral-500 text-sm text-center py-6">No saved projects</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {projects.map((p) => (
            <div key={p.id}
              className="flex items-center gap-2 p-2.5 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-neutral-200 truncate font-medium">{p.name}</div>
                <div className="text-[10px] text-neutral-600">
                  {p.elementCount} elements · {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button onClick={() => handleOpen(p.id)}
                className="text-xs text-green-400 hover:text-green-300 px-2 py-1 rounded hover:bg-green-900/30">
                Open
              </button>
              <button onClick={() => handleDelete(p.id, p.name)}
                className="text-xs text-red-500 hover:text-red-400 px-1">×</button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

import { useEffect } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { TOOL_KEYS } from '@/constants/keyboard'

export function useKeyboardShortcuts() {
  const store = useGardenStore

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const ctrl = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      // Cmd+K → command palette
      if (ctrl && key === 'k') {
        e.preventDefault()
        const s = store.getState()
        s.setUI({ ...s.ui, showCommandPalette: true })
        return
      }

      // Cmd+Z / Cmd+Y / Cmd+Shift+Z → undo/redo
      if (ctrl && key === 'z' && !e.shiftKey) { e.preventDefault(); store.getState().undo(); return }
      if (ctrl && (key === 'y' || (key === 'z' && e.shiftKey))) { e.preventDefault(); store.getState().redo(); return }

      // Cmd+A → select all
      if (ctrl && key === 'a') {
        e.preventDefault()
        const elements = store.getState().project?.elements ?? []
        store.getState().setSelectedIds(elements.map((el) => el.id))
        return
      }

      // Cmd+D → duplicate
      if (ctrl && key === 'd') {
        e.preventDefault()
        const ids = store.getState().interaction.selectedIds
        if (ids.length) store.getState().duplicateElements(ids)
        return
      }

      if (ctrl) return // don't intercept other Ctrl combos

      // Tool shortcuts
      const toolName = TOOL_KEYS[key]
      if (toolName) {
        store.getState().setActiveTool(toolName)
        return
      }

      // View
      if (key === 'g') { const s = store.getState(); s.setShowGrid(!s.project?.showGrid); return }
      if (key === '0') { store.getState().resetView(); return }
      if (key === '+' || key === '=') { store.getState().zoomBy(1.2, window.innerWidth / 2, window.innerHeight / 2); return }
      if (key === '-') { store.getState().zoomBy(1 / 1.2, window.innerWidth / 2, window.innerHeight / 2); return }

      // Z-order
      if (e.key === ']') {
        const ids = store.getState().interaction.selectedIds
        if (ids[0]) store.getState().bringForward(ids[0])
        return
      }
      if (e.key === '[') {
        const ids = store.getState().interaction.selectedIds
        if (ids[0]) store.getState().sendBackward(ids[0])
        return
      }

      // Delete
      if ((key === 'delete' || key === 'backspace') && e.target === document.body) {
        e.preventDefault()
        const ids = store.getState().interaction.selectedIds
        if (ids.length) store.getState().deleteElements(ids)
        return
      }

      // Escape
      if (key === 'escape') {
        store.getState().setSelectedIds([])
        store.getState().setActiveTool('select')
        return
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [store])
}

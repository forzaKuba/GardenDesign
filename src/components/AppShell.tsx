import { useEffect } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { hasCompletedOnboarding } from '@/lib/localStorageDb'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import Header from './Header'
import Toolbar from './Toolbar'
import PropertiesPanel from './PropertiesPanel'
import LayerPanel from './LayerPanel'
import ElementListPanel from './ElementListPanel'
import SymbolLibraryPanel from './SymbolLibraryPanel'
import CommandPalette from './CommandPalette'
import ProjectManager from './ProjectManager'
import OnboardingOverlay from './OnboardingOverlay'
import TextInputModal from './TextInputModal'
import CanvasHost from '@/canvas/CanvasHost'

export default function AppShell() {
  const { initProject, setUI } = useGardenStore()

  useKeyboardShortcuts()

  useEffect(() => {
    initProject()
    if (!hasCompletedOnboarding()) {
      setUI({ ...useGardenStore.getState().ui, showOnboarding: true })
    }
  }, [initProject, setUI])

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-neutral-950 text-neutral-200">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Toolbar */}
        <Toolbar />

        {/* Centre: Canvas */}
        <CanvasHost />

        {/* Right: Panels */}
        <div className="w-56 bg-neutral-900 border-l border-neutral-800 flex flex-col overflow-hidden flex-shrink-0">
          <div className="px-2.5 py-1.5 border-b border-neutral-800">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">Properties</span>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            <PropertiesPanel />
          </div>

          <SymbolLibraryPanel />
          <LayerPanel />
          <ElementListPanel />
        </div>
      </div>

      {/* Modals */}
      <CommandPalette />
      <ProjectManager />
      <OnboardingOverlay />
      <TextInputModal />
    </div>
  )
}

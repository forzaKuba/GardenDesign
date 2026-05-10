import { useEffect, useRef } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { nanoid } from 'nanoid'
import type { TextElement } from '@/types/elements'

export default function TextInputModal() {
  const pendingPos = useGardenStore((s) => s.interaction.pendingTextPos)
  const { setPendingTextPos, addElement, setSelectedIds, interaction, project } = useGardenStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (pendingPos) setTimeout(() => inputRef.current?.focus(), 50)
  }, [pendingPos])

  function close() {
    setPendingTextPos(null)
  }

  function confirm() {
    const val = inputRef.current?.value.trim()
    if (!val || !pendingPos) { close(); return }

    const el: TextElement = {
      id: nanoid(),
      type: 'text',
      category: 'boundary',
      label: val,
      text: val,
      x: pendingPos.wx,
      y: pendingPos.wy,
      fontSize: 0.5,
      fontWeight: 'normal',
      fontFamily: 'DM Sans, sans-serif',
      zIndex: project?.elements.length ?? 0,
      layerId: interaction.activeLayerId,
      locked: false,
      visible: true,
      rotation: 0,
      opacity: 1,
    }
    addElement(el)
    setSelectedIds([el.id])
    close()
  }

  if (!pendingPos) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className="bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl w-72 p-4">
        <h3 className="text-sm font-semibold text-neutral-100 mb-3">Add Label</h3>
        <input
          ref={inputRef}
          type="text"
          placeholder="Label text…"
          className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2
            text-sm text-neutral-200 outline-none focus:border-green-600 mb-3"
          onKeyDown={(e) => {
            if (e.key === 'Enter') confirm()
            if (e.key === 'Escape') close()
          }}
        />
        <div className="flex gap-2 justify-end">
          <button onClick={close} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-300">Cancel</button>
          <button onClick={confirm} className="px-4 py-1.5 text-xs bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium">
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

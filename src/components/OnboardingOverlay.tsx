import { useState } from 'react'
import { useGardenStore } from '@/store/gardenStore'
import { setOnboardingComplete } from '@/lib/localStorageDb'

const STEPS = [
  {
    title: 'Welcome to Garden Planner 🌿',
    body: 'Design your perfect garden with a professional-grade canvas tool. Draw beds, place trees, measure distances, and export your plan.',
  },
  {
    title: 'Drawing Tools',
    body: 'Use the toolbar on the left to draw rectangles, polygons, circles, and lines. Press V, R, P, C, L, T, B, or D to switch tools instantly.',
  },
  {
    title: 'Grid & Snap',
    body: 'The canvas grid is measured in metres. With snapping on, elements align perfectly to the grid (0.5m, 1m, or 2m step). Toggle in the header or panel.',
  },
  {
    title: 'Layers',
    body: 'Organise your design into layers — hide or lock a layer to work on specific elements without interference.',
  },
  {
    title: 'Symbol Library',
    body: 'Drag trees, benches, raised beds, and more from the symbol panel onto your canvas. Each renders as a clean vector path.',
  },
  {
    title: 'Export & Save',
    body: 'Your plan auto-saves to your browser. Export as PNG, PDF (A4), or JSON. Use the Projects menu to manage multiple plans.',
  },
]

export default function OnboardingOverlay() {
  const visible = useGardenStore((s) => s.ui.showOnboarding)
  const { setUI, ui } = useGardenStore()
  const [step, setStep] = useState(0)

  function finish() {
    setOnboardingComplete()
    setUI({ ...ui, showOnboarding: false })
  }

  if (!visible) return null

  const s = STEPS[step]

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
      <div className="bg-neutral-800 border border-neutral-700 rounded-2xl shadow-2xl w-[420px] p-6">
        {/* Step dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-green-500 w-4' : 'bg-neutral-700'}`}
            />
          ))}
        </div>

        <h2 className="text-lg font-semibold text-neutral-100 mb-3 text-center">{s.title}</h2>
        <p className="text-sm text-neutral-400 text-center leading-relaxed mb-6">{s.body}</p>

        <div className="flex gap-3">
          <button
            onClick={finish}
            className="flex-1 py-2 rounded-lg border border-neutral-700 text-neutral-400 hover:text-neutral-200 text-sm"
          >
            Skip
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={finish}
              className="flex-1 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium"
            >
              Start Designing 🌱
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

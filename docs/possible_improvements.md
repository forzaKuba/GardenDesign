# Possible Improvements

This document catalogues realistic, high-value improvements for the Garden Planner application. Items are prioritised by impact and feasibility.

---

## UX Improvements

### Drawing & Interaction
- **Keyboard nudge for selected elements** — Arrow-key movement in 1 cm / 1 grid-step increments for precise positioning without touch-drag.
- **Multi-segment dimension display** — Show individual segment lengths alongside the running total during poly drawing.
- **Confirm-on-click for poly/pencil tools** — Display a visible "close polygon" indicator (snap ring) when the cursor is near the first vertex.
- **Contextual right-click menu** — Show "Duplicate", "Delete", "Bring to Front" etc. in a context menu on right-click over an element, reducing toolbar round-trips.
- **Zoom to selection** — Pressing `F` or double-clicking the fit button when elements are selected should zoom to the bounding box of the selection.
- **Snap toggle indicator** — Surface the snap on/off state visually in the canvas status bar so users know why snapping isn't happening.
- **Hover preview for symbol library** — Show a small preview of the symbol before placing it to reduce trial-and-error.

### Properties & Editing
- **Numeric dimension input in Properties Panel** — Allow users to type exact values for width/height/radius instead of only dragging resize handles.
- **Colour picker improvements** — Support named palette swatches (grass green, gravel grey, water blue) alongside the full colour picker.
- **Layer visibility keyboard shortcut** — Toggle individual layer visibility without opening the layer panel.

---

## Performance Optimisations

- **Spatial indexing for hit-testing** — The current linear scan (`topElementAt`) degrades at ~500+ elements. A simple grid-based spatial index or R-tree would keep hit-test time constant.
- **Canvas dirty-region tracking** — Currently the whole canvas redraws on every RAF tick when dirty. Clip redraw regions to the bounding box of changed elements to reduce paint cost on large canvases.
- **Image element caching** — Image elements are re-decoded on every render call. Ensure the off-screen image cache is also keyed on the element's `dataUrl` hash rather than `id` so swapped images are invalidated correctly.
- **Minimap throttling** — The minimap redraws every frame. Throttling it to ~15 fps saves measurable GPU time on complex plans.
- **Web Worker for geometry** — Move snapping and hit-test calculations off the main thread for responsive pan/zoom on low-powered devices.

---

## Geometry Engine Enhancements

- **Polygon area calculation** — Display accurate polygon area (shoelace formula) for closed poly elements, not just bounding-box area.
- **Curved border support** — Add a Bézier-curve poly variant for natural-looking garden borders.
- **Polygon boolean operations** — Let users subtract/intersect paths (e.g. cut a path through a lawn zone) using Sutherland–Hodgman or polybool.
- **Rotation snap** — Snap rotation to 15° or 45° increments when Shift is held.
- **Perimeter calculation for poly** — Show total perimeter length for closed polygons in the Properties Panel (useful for calculating fence material).
- **Collision overlap detection** — Warn (not prevent) when two filled elements fully overlap, helping users spot accidental duplicates.

---

## Future Feature Ideas

- **Plant database integration** — A searchable library of real plant species with typical dimensions, season colour swatches, and spacing recommendations.
- **Sun & shade simulation** — Overlay seasonal sun-angle shadows on the garden plan based on plot coordinates.
- **Material quantity estimator** — Given a paving/gravel area, calculate the volume of material required based on user-entered depth.
- **Version history / named snapshots** — Let users name and restore historical states beyond the linear undo stack.
- **Collaborative editing** — Real-time multi-user canvas via WebSockets (CRDT-based updates).
- **Print layout designer** — Choose scale, paper size, and legend placement before export rather than always exporting at screen resolution.
- **Measurement unit toggle** — Support feet/inches globally alongside metres, converting all displayed values.

---

## Known Technical Debt

- **`CanvasHost.tsx` is still large** — At ~450 lines it mixes event wiring, RAF loop, measurement tooltip logic, and pointer-event building. Extracting `useCanvasEvents` and `useMeasurementTooltip` custom hooks would improve testability.
- **Inline `coordTransform` in store context** — `buildPointerEvent` duplicates some view math already in `coordTransform.ts`. A single call should suffice.
- **`drawDimensions` inside renderer** — The selection-dimension overlay in `renderer.ts` is tightly coupled to rendering internals. Moving it to a dedicated overlay pass would make it easier to style independently.
- **Missing TypeScript strictness** — Several `as unknown as` casts exist (e.g. `onDblClick` in `CanvasHost`). Stricter event types would eliminate these.
- **No error boundaries** — A runtime error in the canvas RAF loop currently freezes the whole UI. An error boundary around `CanvasHost` with a recovery prompt would improve resilience.
- **`gardenStore.ts` is monolithic** — The store file exceeds 500 lines. Splitting into domain slices (project, interaction, view, history) using Zustand's `combine` or `immer` slice pattern would improve maintainability.

---

## Accessibility Improvements

- **Keyboard-only drawing** — Current tools require pointer input. Arrow-key controlled drawing (place points with Enter) would make the app usable without a mouse.
- **Screen-reader labels for canvas** — The `<canvas>` element has no `aria-label` or live-region for element counts. An offscreen status paragraph updated on selection changes would help.
- **Focus-visible styles on toolbar buttons** — The toolbar buttons lack visible `:focus-visible` outlines. Adding a consistent ring style ensures keyboard navigation is discoverable.
- **Colour contrast for dimension labels** — Some overlay text (e.g. area labels) falls below WCAG AA contrast on light backgrounds. Increase opacity or add a stronger text shadow.
- **Keyboard shortcut discoverability** — The Command Palette is a good start; adding a dedicated "Keyboard shortcuts" modal (accessible via `?`) would help new users.

---

## Mobile & Tablet Interaction

- **Touch pan and pinch-to-zoom** — The current wheel-zoom and pointer-pan logic doesn't handle multi-touch. `PointerEvent` coalescing and a two-finger gesture handler would enable tablet use.
- **Larger tap targets** — Toolbar buttons are 40×36 px, below the 44 px WCAG guideline for touch targets. Increasing them improves usability on tablets.
- **Responsive side panels** — The left toolbar and right properties panel are fixed-width. On small screens they should collapse to an icon rail / bottom sheet.
- **Apple Pencil / stylus support** — `PointerEvent.pointerType === 'pen'` can be used to provide higher-precision drawing and disable accidental palm input.
- **Offline-first PWA** — The app already uses localStorage. Adding a Service Worker manifest would make it installable and fully offline-capable.

---

## Testing Gaps

- **No unit tests for geometry utilities** — `coordTransform.ts`, `hitTest.ts`, and `rdp.ts` contain non-trivial geometry logic with no test coverage. Vitest unit tests would prevent regressions during refactoring.
- **No formatter tests** — `formatDistance` and `formatArea` in `features/measurements/` need tests covering edge cases (zero, sub-centimetre, large values).
- **No interaction tests for export menu** — The export popup state change is untested. A React Testing Library test for open/close behaviour would catch regressions.
- **No E2E tests** — There are no Playwright/Cypress tests covering the core drawing workflow (draw rect, select, delete, undo). These are the highest-value integration tests to add.
- **No visual regression tests** — Canvas rendering changes are invisible to unit tests. Percy or Playwright screenshot comparison would catch accidental rendering regressions.

---

## Scalability Concerns

- **Bundle size** — `jsPDF` is a heavy dependency (~350 KB gzipped). Lazy-loading it behind a dynamic `import()` on first export would reduce initial bundle size significantly.
- **LocalStorage capacity** — Large projects with many image elements can approach the ~5 MB browser localStorage limit. Migrating to IndexedDB (via `idb` or `localforage`) would remove this ceiling.
- **Single project state** — The store holds one active project. Multi-project support requires either per-project state slices or a lightweight project-switching architecture.
- **RAF loop at full frame rate** — The dirty-flag pattern is efficient but the RAF loop still runs at 60+ fps. At very high element counts this wastes battery on mobile. A debounced render with explicit flush would be more power-efficient.

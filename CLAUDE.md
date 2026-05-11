# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Vite dev server (HMR)
npm run build     # tsc --noEmit && vite build → dist/
npm run preview   # serve built dist/
```

There is no test runner, linter, or formatter configured. Type-checking happens via `tsc` inside `npm run build`. To type-check without producing a bundle, run `npx tsc --noEmit`.

`tsconfig.json` enables `strict`, `noUnusedLocals`, and `noUnusedParameters` — unused locals/params will fail the build. Path alias `@/*` → `src/*`.

Deployment: push to `main` triggers `.github/workflows/deploy-pages.yml`, which builds and publishes `dist/` to GitHub Pages. `vite.config.ts` uses `base: './'` so the build works from any sub-path on Pages.

## Architecture

This is a single-page React + Vite app: a 2D garden / landscape planner that draws to an HTML `<canvas>`. There is **no backend** — projects persist in `localStorage` via `src/lib/localStorageDb.ts` under the `garden-planner:` key prefix.

### Two worlds: React and Canvas

The app deliberately splits responsibilities between React and an imperative canvas renderer:

- **React (`src/components/`)** renders only the UI chrome — Header, Toolbar, panels (Properties, Layers, Symbol Library, Element List), and modals (Command Palette, Project Manager, Onboarding, Text Input). Layout is driven by `AppShell.tsx`.
- **Canvas (`src/canvas/`)** renders the design itself. `CanvasHost.tsx` is the bridge: it owns the `<canvas>` ref, listens to pointer/wheel/keyboard events, and drives an RAF loop (`useRAFLoop`) that calls `renderer.ts → render()` only when a dirty flag is set.

`CanvasHost` does **not** trigger React re-renders on pointer moves. Live drawing state (preview element, snap indicator, pencil running length, pan start, space-down flag) is held in `useRef`s. The store subscribe callback simply flips `isDirty.current = true`. This is the performance contract — when editing this file, do **not** route per-frame state through `useState`.

### State: Zustand store (`src/store/gardenStore.ts`)

A single `useGardenStore` holds:

- `project: GardenProject | null` — current document (layers, elements, grid settings)
- `_history`, `_future` — undo/redo stacks of cloned project snapshots (cap 100)
- `view: { panX, panY, zoom }` — camera; `zoom` is **pixels per metre**, starting at `PX_PER_M = 40`
- `interaction` — active tool, selection, hover, snap toggle, etc.
- `ui` — modal visibility flags

Key invariants:
- **World coordinates are metres.** Conversions live in `canvas/coordTransform.ts` (`worldToScreen`, `screenToWorld`).
- Mutating actions that should be undoable call `pushHistory()` **before** mutating. Continuous actions (`groupMove` during drag) deliberately skip history and save; history is pushed once on `pointerdown`, and `debouncedSave` (500ms) handles localStorage persistence.
- All element mutations clone via `JSON.parse(JSON.stringify(...))` — there is no Immer-style proxy despite immer being a dependency.

### Tool system (`src/canvas/tools/`)

Drawing modes are implemented as `Tool` objects (see `types/tools.ts`) registered in `tools/index.ts`. Each tool implements `onMouseDown / Move / Up` plus optional `onKeyDown / onDblClick`, and receives a `ToolContext` that exposes a curated slice of the store (element CRUD, selection, view, snap state) plus `setPreviewElement(el)` for live drawing previews and `scheduleRender()`.

To add a new tool: define a `Tool` in `src/canvas/tools/`, add the name to `ToolName` in `types/tools.ts`, register it in `tools/index.ts`, and (optionally) add a keybinding in `constants/keyboard.ts`. The Toolbar reads `TOOL_SHORTCUTS` for hint labels.

### Coordinate transforms & snapping

`coordTransform.ts → snapPoint()` is the single entry point for snapping. Priority is: (1) exact point snap to other elements' corners/centres/midpoints within `EDGE_SNAP_THRESHOLD` (0.3 m), (2) axis-alignment snap to element **edges only** (so guides line up to real boundaries, not interior reference points), (3) fall through to grid snap. The returned `alignedAxis` ('x' | 'y' | 'xy') drives the snap-guide rendering.

`CanvasPointerEvent` always exposes both raw (`wx, wy`) and snapped (`snappedWx, snappedWy`) world coords — tools should use the snapped values when placing geometry.

### Element model (`src/types/elements.ts`)

A `GardenElement` is a discriminated union over `type` (`rect | poly | circle | line | text | image | symbol | dimension`). Every element carries `id`, `category` (`lawn`, `path`, `structure`, …), `layerId`, `zIndex`, `rotation` (radians), `opacity`, optional `fillColor` / `strokeColor`.

Rendering order in `renderer.ts`: filter to visible elements on visible layers → sort by `(layer.order, element.zIndex)`. New elements default to `zIndex = elements.length`; `bringForward` / `sendBackward` adjust to max+1 / min−1.

### Symbol library (`src/symbols/`)

Symbols are static `SymbolDef` records (trees, structures, garden items, hardscape) registered in `symbols/index.ts` via `SYMBOL_LIBRARY` and looked up by id through `SYMBOL_MAP`. Placed symbols become `SymbolElement` instances with `symbolId`, `cx/cy`, and `scale` (radius in metres).

### Measurement formatting

`src/features/measurements/formatDistance.ts` is the canonical place for human-readable metres/cm conversion. Reuse `formatDistance` / `formatArea` rather than ad-hoc `toFixed` calls so the live measurement tooltip, dimension labels, and properties panel stay consistent.

## Working notes

- The default project ("LOK nr 1") is hard-coded in `gardenStore.ts → createLokNr1()`. The app calls `initProject()` on mount and shows the onboarding overlay on first run (gated by `localStorage` flag `garden-planner:onboarded`).
- Some user-facing labels are Polish (e.g. "Granica działki", "Trawnik / ogród"). Preserve existing strings unless explicitly asked to translate.
- `docs/possible_improvements.md` is an ideas backlog, not a spec — treat as low-authority hints, not requirements.

# GardenDesign — Copilot Instructions

## Stack

- **React 18** + **TypeScript 5** (strict mode) — all new files must be `.tsx`/`.ts`
- **Vite 5** — build tool; path alias `@/` maps to `src/`
- **Zustand 4** — single store in `src/store/gardenStore.ts`
- **Tailwind CSS 3** — utility-first styling, dark-first theme
- **Canvas 2D API** — all drawing is done imperatively in `src/canvas/renderer.ts` via a dirty-flag + RAF loop; never use React to render canvas content
- **nanoid** — always use `nanoid()` for generating element and layer IDs
- **jsPDF** — lazy-load via dynamic `import()` at export time; do not import at module top level

## Architecture

```
src/
  store/          ← single Zustand store (project + view + interaction + UI state)
  canvas/         ← Canvas2D rendering, RAF loop, coordinate transforms, tool registry
    tools/        ← Tool objects implementing the Tool interface (not classes)
  components/     ← React UI (panels, modals, toolbar); no canvas drawing here
  types/          ← TypeScript discriminated unions for elements, layers, tools
  constants/      ← grid, categories, keyboard shortcuts
  lib/            ← stateless utilities (export, localStorage)
  symbols/        ← static symbol definitions
  features/       ← domain logic slices (e.g. measurements/formatDistance)
```

## State Management

- All mutable app state lives in `useGardenStore` (`src/store/gardenStore.ts`).
- State is organised into four sub-objects: `project`, `view`, `interaction`, `ui`.
- In React components use selector hooks: `useGardenStore((s) => s.interaction.selectedIds)`.
- In canvas / non-React code use `useGardenStore.getState()` for synchronous reads and direct action calls.
- Immutable updates — always spread and override; never mutate in-place:
  ```ts
  const p = { ...project, elements: [...project.elements, el], updatedAt: now() }
  set({ project: p })
  ```
- Call `pushHistory()` before any mutation that should be undoable (add, delete, duplicate, geometry edits). Skip it for transient moves (`groupMove` is called on every mousemove; save on mouseup instead).
- Persist via `debouncedSave(project)` after state changes that should survive reload.

## Canvas & Rendering

- The RAF loop in `CanvasHost.tsx` only renders when `isDirty.current === true`. Set `isDirty.current = true` (or call `scheduleRender()`) whenever visual state changes.
- All element geometry is stored in **world space (meters)**. Convert to screen pixels using `PX_PER_M` and the `view` transform (`coordTransform.ts`).
- Snap via `snapPoint()` from `coordTransform.ts` — always pass the result's `snappedWx`/`snappedWy` to tools, not the raw world coords.
- HiDPI: canvas `.width`/`.height` are set to `size * devicePixelRatio`; CSS size is the logical size.

## Tool System

- Tools are plain objects (`const MyTool: Tool = { ... }`) registered in `src/canvas/tools/index.ts`.
- Implement: `onMouseDown`, `onMouseMove`, `onMouseUp`, and optionally `onDblClick`, `onKeyDown`.
- Use `ToolContext` methods (`addElement`, `updateElement`, `setPreviewElement`, `pushHistory`, etc.) — never import the store directly inside a tool file.
- Preview elements are stored in `previewEl.current` (a mutable ref in `CanvasHost`), not in the store.

## TypeScript Conventions

- Elements are a discriminated union on `type` (`src/types/elements.ts`). Use type narrowing (`el.type === 'rect'`) instead of casts.
- Avoid `as unknown as X` casts — fix the underlying types instead.
- Export types from `src/types/`; do not co-locate type definitions in component or store files unless they are purely local.
- Use `Partial<GardenElement>` for `updateElement` patches; avoid full element replacement when only one field changes.

## Styling

- Use **Tailwind utility classes** exclusively — no CSS modules, no inline `style` objects except for dynamic values that can't be expressed as classes (e.g. canvas positioning, dynamic colours).
- Dark theme baseline: `neutral-950` backgrounds, `neutral-900` panels, `neutral-800` borders, `neutral-200` text.
- Primary accent: `green-600` / `green-700`.
- Panel section labels: `text-[9px] font-semibold uppercase tracking-wider text-neutral-500`.
- Focus styles: `focus:border-green-600 outline-none`.

## Code Style

- Section dividers in long files use the `// ── Section Name ─────` comment style.
- Helper functions local to a file go above the component/export they serve.
- Prefer named exports for sub-components within a file (e.g. `Field`, `Input` in `PropertiesPanel.tsx`).
- `now()` utility returns `new Date().toISOString()` — use it for `createdAt`/`updatedAt`.

## Build & Dev

```bash
npm run dev      # start Vite dev server
npm run build    # tsc type-check + Vite production build
npm run preview  # preview production build
```

There is currently no test setup. When adding tests, use **Vitest** (compatible with Vite). Priority areas: `coordTransform.ts`, `hitTest.ts`, `rdp.ts`, `formatDistance.ts`.

## Key Constraints

- **No React in canvas rendering** — `CanvasHost` manages a `<canvas>` element; all drawing goes through `renderer.ts`.
- **World coords in meters** — never store pixel values in element geometry.
- **Single store** — do not introduce a second state management solution.
- **localStorage persistence** — keep using `localStorageDb.ts`; consider IndexedDB only if the 5 MB limit becomes a real problem.
- **jsPDF lazy import** — the library is ~350 KB; always dynamic-import it at export time to keep the initial bundle small.

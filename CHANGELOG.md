# Changelog

All notable changes to the **fuderu** drawing library will be documented in this file.

---

## [1.3.0] - 2026-07-28

- **First-Class Document Persistence API**
  - **`canvas.exportDocument(options?: { bitmap?: 'png' | 'jpeg' | 'webp', quality?: number })`**: Export full document state into a versioned, typed JSON payload including canvas dimensions, layer metadata (id, name, order, opacity, blendMode, visibility), active layer ID, and serialized layer bitmaps.
  - **`canvas.importDocument(document: FuderuDocument)`**: Atomically load saved documents, recreating layers, loading bitmap graphics asynchronously, preserving active layer state, and re-initializing brush and history stacks.
  - **`canvas.exportPNG(options?: { includeBackground?: boolean, quality?: number })`**: High-level helper for exporting a flattened composite PNG image of the artwork with optional solid background compositing.
- **LayerManager Batch Layer Replacement** – Added `LayerManager.replaceAllLayers(layers, activeLayerId)` for atomic layer state swaps during document loading.
- **Observable State Model & Change Event System**
  - **`canvas.on(event, listener)` / `canvas.off(event, listener)`**: Typed event subscription mechanism. `on()` returns an unsubscribe callback.
  - **`canvas.getSnapshot()`**: Synchronous snapshot of the current canvas state (`documentWidth`, `documentHeight`, `layers`, `activeLayerId`, `history`) for UI bindings like `useSyncExternalStore`.
  - **`change` Event**: Emits a `CanvasSnapshot` whenever canvas layers, selection, history, document dimensions, or artwork content change.
  - **`stroke:start` & `stroke:end` Events**: Emits stroke lifecycle details (`layerId`, `point`, `bounds`, array of recorded `points`).
  - **`history:change` Event**: Emits history stack metrics (`canUndo`, `canRedo`, `index`, `length`).
  - **`layer:change` Event**: Emits updated layer lists and active layer ID.
- **Public & Extended History API**
  - **`canvas.history.getEntries()`**: Returns readonly summaries (`HistoryEntrySummary[]`) of all undo/redo history steps in the current timeline.
  - **`canvas.history.goTo(index: number)`**: Enables jumping directly to any point in the history timeline by auto-calculating required undo/redo operations.
  - **`canvas.history.pushPatch(...)`**: Allows external raster operations (text tools, filters, vector shapes, bucket fill) to register undoable patches using Fuderu's sparse bounding-box optimization. Supports both options objects (`PushPatchOptions`) and positional arguments.
  - **Automatic Event Integration**: History state navigation and patch registration trigger `history:change` and `change` events.
- **Native Commands for Common Raster Operations**
  - **Flood Fill / Bucket**: `canvas.floodFill(x, y, color, tolerance)` – Scanline flood fill algorithm on active layer with customizable color matching tolerance, producing optimized sparse history patches.
  - **Vector Primitives**: `canvas.drawRectangle(...)`, `canvas.drawEllipse(...)`, `canvas.drawLine(...)` – Built-in vector drawing primitives supporting fill, stroke, stroke width, corner radius, and rotation.
  - **Text Rasterization**: `canvas.drawText(text, x, y, style)` – Direct text rendering onto active layer with custom font size, family, weight, style, color, alignment, baseline, and optional maximum width.
  - **Eyedropper / Color Sampler**: `canvas.getColorAt(x, y, scope: 'activeLayer' | 'composite')` – Pixel color sampling returning RGBA channels, normalized hex, and CSS color strings.
  - **Layer Utility Actions**: `canvas.clearActiveLayer()`, `canvas.fillActiveLayer(color)` – High-level layer clearing and bucket filling commands with automatic undo history tracking.
- **Advanced Layer Controls**
  - **Alpha Lock**: `layer.alphaLock = true` (and `options.alphaLock`) – Restricts brush strokes, vector primitive drawing (`drawRectangle`, `drawEllipse`, `drawLine`, `drawText`), `fillActiveLayer`, and `floodFill` strictly to existing non-transparent pixels on the layer using `source-atop` compositing.
  - **Layer Lock**: `layer.locked = true` (and `options.locked`) – Protects layers from accidental modification or deletion. Blocks pointer stroke initiation, active layer clearing, bucket fills, flood fills, vector drawing, and layer deletion attempts (`deleteLayer`).
  - **Direct Layer Methods on Canvas**: Added `canvas.getLayers()`, `canvas.getLayerById(id)`, and `canvas.reorderLayers(ids)` to provide clean, typed access for reading, finding, and reordering document layers without relying on direct `canvas.layers` access.
  - **History & State Event Integration**: Property updates for `alphaLock` and `locked` support full undo/redo state tracking via `LayerPropertyHistoryEntry` and automatically emit `layer:change` and `change` state updates.

---

## [1.2.2] - 2026-07-24

### Fixed

- **`structuredClone` Drawing Overhead** – Replaced expensive native `structuredClone` calls during point rendering in `Brush.ts` with a lightweight config clone helper, avoiding structured serialization latency and web worker compatibility bottlenecks.
- **Star Brush Rotation & Color Normalization** – Fixed double rotation bug on star brush tips by separating canvas rotation from context ellipse angle. Resolved color matching issues when comparing raw vs normalized hex color strings.
- **Layer History Reinsertion Index** – `LayerCreatedHistoryEntry` now records the exact index position of new/duplicated layers, ensuring undo and redo preserve the precise layer stack order.
- **Layer Resizing Performance & Fidelity** – Switched `Layer.resize()` from pixel-buffer `getImageData`/`putImageData` transfers to hardware-accelerated canvas `drawImage` resizing. Eliminates alpha premultiplication artifacts and out-of-bounds clipping errors.
- **Document Dimension Sync in LayerManager** – Fixed `LayerManager.createLayer` to use tracked manager width/height instead of reading from `layers[0]`, preventing incorrect layer dimensions when resizing or clearing layers.
- **Pattern Canvas Auto-Resizing** – Automatically resizes pattern and blend contexts in `modules/pattern.ts` whenever the stroke canvas dimensions change, avoiding pattern misalignment or scaling artifacts.

---

## [1.2.1] - 2026-07-21

### Fixed

- **Layout Thrashing Fix on Pointer Move** – Query `this.canvas.getBoundingClientRect()` exactly once per pointer event frame inside `handlePointerDown` and `handlePointerMove`. Caches and passes the `rect` down to any coalesced sub-events, entirely avoiding redundant layout queries and preventing forced synchronous layout thrashing during drawing.
- **`setDocumentSize` UX/API Inconsistency** – Harmonized the public API by introducing an optional third parameter: `setDocumentSize(width, height, clearArtwork = false)`. Updated API comments and added test coverage. By default, it preserves existing layer artwork (lossless crop/pad) but resets the undo stack, with an option to clear all artwork.

---

## [1.2.0] - 2026-07-19

### Added

- **Sparse Bounding-Box History Tracking** – Rather than pushing a full-canvas `ImageData` snapshot on every completed stroke, `Canvas` now tracks drawing stroke boundaries (`strokeMinX`, `strokeMinY`, `strokeMaxX`, `strokeMaxY`) in real-time. It then captures and stores only a localized sub-image (padded dynamically by brush size). Reduces history memory footprints by 90-95%.
- **Offscreen Layer Compositing Cache** – Re-compositing all layer canvases sequentially on every animated frame caused CPU/GPU lag with deep layer stacks. Added an offscreen pre-composited `cacheBelowCanvas`. During active drawing strokes, static layers below the active layer are drawn in a single fast cached call, scaling rendering from $O(N)$ down to $O(1)$ calls for bottom-layers, maintaining a silky-smooth 60 FPS.
- **Robust Pointer Capture** – Improved cross-environment robustness by wrapping pointer capture methods (`setPointerCapture`, `hasPointerCapture`, `releasePointerCapture`) with feature detection and protective try-catch handling.
- **Comprehensive Unit Tests** – Created new vitest suite covering history entries, sparse bounding boxes, compositing cache mechanisms, pointer event simulations, and state resets.

---

## [1.1.0] - 2026-07-16

### Added

- **Decoupled History Architecture** – Introduced a dedicated `HistoryManager` decoupled from the low-level `Brush` engine. This manages historical actions independently on the `Canvas` wrapper level using modular action entries (`CanvasStateHistoryEntry`, `LayerCreatedHistoryEntry`, `LayerDeletedHistoryEntry`, `LayerPropertyHistoryEntry`, `MoveLayerHistoryEntry`).

### Fixed

- **Layer-Switching History Wipe** – Resolved a high-severity bug where switching active layers cleared the undo/redo stacks. Since history is now managed globally and decoupled from the individual active drawing target, user operations (drawing, adding/removing layers, reordering layers, changing opacity) remain fully undoable/redoable across context switches.

---

## [1.0.1] - 2026-07-15

### Fixed

- **Browser Compatibility** – Added fallback UUID generation for environments where `crypto.randomUUID()` is not available (e.g., older browsers, non-secure contexts). The library now gracefully degrades to a deterministic UUID v4-like generator while preserving the existing behavior where native support exists.

---

## [1.0.0] - 2026-07-10

### Added

- **Stable Core Baseline** – Released the official stable `1.0.0` version covering the core brush engine, layer system, history stack (undo/redo), and canvas wrapper.
- **Resilient Input Lifecycle** – Hardened pointer event handlers to robustly handle interrupted gestures, pointer cancellation, and pointer capture recovery across browser platforms.
- **Improved Context Reloading** – Standardized and fixed drawing-context and stroke-state reset behaviors when clearing the canvas or reloading dynamic configurations.

### Changed

- **API Realignment** – Refined the public API signatures to align with production usage, deprecating non-standard experimental methods.
- **Documentation Redesign** – Rewrote and upgraded the documentation suite in `/docs` to target stable production patterns and assist developers of all levels.

---

## Pre-1.0.0 Development History (Summary)

Prior to the stable `1.0.0` release, **fuderu** underwent active iteration to design, build, and optimize its specialized canvas drawing engine. Below is a summary of the key milestones achieved during the experimental phase (`0.8.x` series):

### Core Architectural Features Introduced

- **Professional Layer System (`v0.8.8`)**
  - Integrated a complete layer manager (`LayerManager`) supporting layer creation, renaming, reordering, visibility toggling, opacity modification, and duplications.
  - Implemented 16 full canvas-layer blending modes (including `source-over`, `multiply`, `screen`, `overlay`, `difference`, and more).
  - Developed seamless brush-to-layer integration allowing direct input drawing onto active layers, coupled with precise layer-based compositing and thumbnail rendering.
- **High-Performance Brush Engine (`v0.8.1` - `v0.8.7`)**
  - Established bezier interpolation and adaptive brush spacing algorithms for buttery-smooth brush strokes.
  - Implemented high-DPI scaling (`window.devicePixelRatio`) to prevent pixelation on modern screens.
  - Added full pressure-sensitivity support (utilizing real Wacom/Apple/Stylus pointer pressure) alongside configurable mouse/touch simulation.
  - Built robust support for custom Image Brushes, including source image loading, live recoloring, and rotation configurations (fixed, path-following flow, or jitter).
- **Extensible Module System (`v0.8.2`)**
  - Created a plugin-like module architecture allowing developers to extend brush behaviors dynamically.
  - Shipped four built-in modules:
    - `DynamicShapeModule` – Adjusts size, angle, and roundness dynamically or with pressure.
    - `DynamicTransparencyModule` – Controls opacity and flow dynamics.
    - `SpreadModule` – Scatters and stamps pointer inputs across multiple coordinates.
    - `PatternModule` – Applies pattern-based stamp texture styling.
- **Undo/Redo History Stack**
  - Implemented client-side snapshot state history for undoing and redoing actions accurately across multiple layers.

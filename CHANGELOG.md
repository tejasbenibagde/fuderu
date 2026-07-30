# Changelog

All notable changes to the **fuderu** drawing library will be documented in this file.

---

## [1.3.0] - 2026-07-28

- **First-Class Document Persistence API**
  - **`canvas.exportDocument(options?: { bitmap?: 'png' | 'jpeg' | 'webp', quality?: number })`**: Export full document state into a versioned, typed JSON payload including canvas dimensions, layer metadata (id, name, order, opacity, blendMode, visibility, alphaLock, locked), active layer ID, and serialized layer bitmaps.
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

## Pre-1.3.0 Release History (Summary)

### v1.2.x Series

- **Performance & Drawing Optimizations**: Replaced `structuredClone` overhead with lightweight config cloning, throttled DOM `getBoundingClientRect` queries during active gestures, and implemented hardware-accelerated canvas `drawImage` layer scaling.
- **Sparse Bounding-Box History**: Switched undo/redo tracking from full canvas snapshots to localized changed pixel bounds, reducing memory usage by 90–95%.
- **Offscreen Compositing Cache**: Pre-composites static layers below the active drawing layer to reduce compositing calls from $O(N)$ to $O(1)$ during strokes.
- **Robust Pointer Capture & Size Controls**: Fallback-safe pointer capture for uninterrupted input, and lossless document resizing via `setDocumentSize(w, h, clearArtwork)`.

### v1.1.x Series

- **Decoupled Global History Engine**: Independent `HistoryManager` preserving undo/redo timelines across active layer switches.
- **Undoable Layer Properties**: Complete state tracking for layer property changes (opacity, name, visibility, blending).

### v1.0.x Series

- **Stable Core Baseline**: Official stable release establishing the primary `Canvas`, `Brush`, `LayerManager`, and `HistoryManager` architecture.
- **Input Gesture Safety & Fallbacks**: Hardened pointer lifecycle handlers and browser fallbacks for UUID generation.

### Pre-1.0.0 Experimental Releases (0.8.x)

- **Core Layer Stack**: Initial layer manager, layer stack reordering, and 16 blend modes.
- **Brush Engine & Pressure**: Bezier path smoothing, adaptive spacing, stylus pressure sensitivity, and custom image brushes with flow/rotation.
- **Module Architecture**: Extensible brush plugins including `DynamicShapeModule`, `DynamicTransparencyModule`, `SpreadModule`, and `PatternModule`.

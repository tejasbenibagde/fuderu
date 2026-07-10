# Changelog

## 1.0.0

### Added

- Stable 1.0.0 release for the core canvas, brush, layers, and undo/redo experience.
- Hardened pointer lifecycle handling for interrupted input, including pointer cancellation and pointer capture recovery.
- Improved stroke reset behavior when the drawing context is reloaded or the canvas is cleared.

### Changed

- Documentation and examples now focus on the stable core API instead of the earlier experimental framing.
- The public API is now positioned as the baseline for production use.

## 0.8.8

### Added

- Added coalesced pointer event support in `Canvas.handlePointerMove` for smoother pen and stylus drawing.
- **Professional Layer System** – Full layer stack with creation, deletion, duplication, reordering, and active layer selection.
- **Layer Properties** – Per-layer visibility, opacity (0-100%), and blend modes (16 modes including Multiply, Screen, Overlay, etc.).
- **Layer Manager API** – `createLayer()`, `deleteLayer()`, `duplicateLayer()`, `moveLayer()`, `updateLayer()`, `getLayers()`, `getActiveLayer()`, `setActiveLayer()`.
- **Layer Compositing** – `renderLayers()` composites all visible layers onto the canvas respecting opacity and blend modes.
- **Brush-to-Layer Integration** – Brush now draws directly into the active layer's canvas.
- **`onRender` callback** – Called after each render frame, enabling layer compositing hooks.
- **Coalesced pointer events** – Smoother pen and stylus drawing via `getCoalescedEvents()`.

### Changed

- `Canvas` now owns a `LayerManager` instance (`canvas.layers`).
- `Brush.loadContext()` now accepts any canvas, enabling dynamic layer switching.
- `Canvas` constructor now initializes layers before the brush.
- `resize()` now resizes all layers and reinitializes the brush context.
- `setDocumentSize()` now resizes layers and preserves the layer stack.

### Fixed

- Layer thumbnails no longer flicker on interaction.
- Active layer switching now correctly updates the brush target.
- Undo/redo now works correctly with layer-based rendering.
- Blend mode dropdown and layer name input no longer close prematurely.

## 0.8.7

### Improved

- Added spacing-aware flow normalization, so low flow values remain visually meaningful even when brush stamps are very densely spaced.
- Updated flow rendering to preserve the user-facing flow value for modules while using a normalized per-stamp alpha internally.

### Fixed

- Fixed pointer coordinate scaling in the `Canvas` wrapper when the visible canvas size differs from the logical document buffer.

## 0.8.6

### Fixed

- Improved canvas resize handling so the rendered canvas can stay aligned with the visible element size.

## 0.8.5

### Fixed

- Fixed an initial stroke gap when drawing fast, so the first stamp now connects correctly to the following segment.

## 0.8.4

### Fixed

- Fixed low-opacity dense stroke rendering when spacing is reduced, so 30% brushes stay visually consistent.
- Fixed stale stroke opacity state leaking into subsequent strokes after completion.
- Fixed brush rendering instability after stroke finalization and reinitialization.

## 0.8.3

### Added

- Added eraser mode support to the brush engine with proper `destination-out` compositing.

## 0.8.2

### Added

- Added pressure-aware drawing support, including real pointer pressure and mouse/touch pressure simulation.
- Added image brush rotation controls with `fixed`, `flow`, and `random` modes.
- Added rotation smoothing, offset, jitter, and path-following stamp behavior.
- Added built-in brush modules for dynamic shape, dynamic transparency, spread, and pattern textures.
- Added runtime module registration/removal support through the brush engine.

### Improved

- Improved image brush direction tracking across curved strokes.
- Improved rotation continuity during faster or more complex strokes.
- Improved brush image rendering and alpha compositing behavior.

### Fixed

- Fixed incorrect first-stamp rotation behavior.
- Fixed rotation desync during fast strokes.
- Fixed brush image angle inconsistencies.
- Fixed image brush alpha compositing issues.

### Still Experimental

- Module API shape and execution order.
- Large-canvas performance and dense stroke behavior.
- Worker/OffscreenCanvas rendering exploration.
- Future WASM/Rust acceleration.

## 0.8.1

### Breaking

- Reworked canvas initialization.
- Changed pointer coordinate normalization.
- Added automatic device-pixel-ratio scaling.
- Updated internal rendering flow.

### Added

- Added the high-level `Canvas` wrapper.
- Added high-DPI canvas rendering.
- Added brush interpolation and adaptive spacing.
- Added runtime brush configuration.
- Added image brush support.
- Added undo/redo history.
- Added flow, opacity, angle, and roundness support.
- Added runtime smoothing and spacing toggles.
- Added cleanup lifecycle handling.

### Improved

- Improved pointer event handling.
- Improved framework-agnostic browser usage paths.
- Improved canvas setup for touch interaction.

### Fixed

- Fixed cursor/brush offset issues.
- Fixed Retina scaling inconsistencies.
- Fixed touch interaction issues.
- Fixed brush spacing inconsistencies.
- Fixed rendering cleanup issues.

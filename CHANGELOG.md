# Changelog

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

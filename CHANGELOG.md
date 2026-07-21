# Changelog

All notable changes to the **fuderu** drawing library will be documented in this file.

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

# Changelog

All notable changes to the **fuderu** drawing library will be documented in this file.

---

## [1.0.0] - 2026-07-15

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

<p align="center">
  <img
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.webp"
    alt="Fuderu Logo"
    width="420"
  />
</p>

<p align="center">
  Stable 1.3.0 canvas drawing engine for the web.
</p>

<p align="center">
  interpolation | adaptive spacing | pressure | image brushes | modules
</p>

---

[![npm version](https://img.shields.io/npm/v/fuderu.svg)](https://www.npmjs.com/package/fuderu)
[![Downloads](https://img.shields.io/npm/dm/fuderu?style=flat)](https://www.npmjs.com/package/fuderu)
[![License](https://img.shields.io/npm/l/fuderu.svg)](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)
[![Docs](https://img.shields.io/badge/docs-live-blue?style=flat)](https://fuderu.vercel.app/)

## Features

- **Document Persistence API** – Export and import complete canvas state as versioned JSON with layer metadata and serialized bitmaps (`exportDocument`, `importDocument`, `exportPNG`).
- **Layer System** – A focused layer stack with visibility, opacity, and 16 blend modes.
- **Canvas API** – A dependable `Canvas` wrapper for pointer drawing and layer-based composition.
- **Standalone Brush** – `Brush` engine for custom integrations and advanced render pipelines.
- **Smooth Interpolation** – Adaptive brush spacing and Bezier smoothing for natural stroke flow.
- **Pressure Support** – Real pen pressure with optional mouse/touch simulation.
- **Runtime Configuration** – Update brush properties on the fly.
- **Undo/Redo** – A practical history stack for iterative drawing workflows.
- **Module System** – Extensible brush behavior with built-in modules for dynamics and patterns.
- **TypeScript-First** – Full type safety with a framework-agnostic design.

## Release Focus

For the first stable release, Fuderu is intentionally narrowing the scope around a cohesive core:

- reliable brush rendering
- layer-based compositing with blend modes
- document import/export and image persistence
- undo/redo and a clear canvas wrapper
- optional advanced modules without overcomplicating the API

If you are evaluating Fuderu for production, start with those primitives and treat the more experimental effects as additive.

## Latest Release

### 1.3.0

- **First-Class Document Persistence API**: Native `exportDocument()` and `importDocument()` with typed, versioned document data (`width`, `height`, `layers`, `activeLayerId`, and serialized bitmaps).
- **Asynchronous Layer Bitmap Loading**: `importDocument()` recreates layer structures and asynchronously restores layer bitmaps.
- **Flattened Image Export**: Added `exportPNG()` helper with optional solid background compositing (`includeBackground: true`).
- **Atomic Layer Replacement**: Introduced `LayerManager.replaceAllLayers()` for seamless document loading.

### 1.2.2

- **Point-Drawing Optimization**: Replaced `structuredClone` with lightweight configuration cloning during stroke point rendering, removing serialization latency during fast drawing.
- **Star Brush & Color Fixes**: Corrected double rotation on star brush tips and unified hex color string comparisons in brush shape contexts.
- **Layer History Index Retention**: Layer creation and duplication history entries now preserve exact stack index order for precise undo/redo behavior.
- **Hardware-Accelerated Layer Resizing**: Switched `Layer.resize()` to HTMLCanvas `drawImage` scaling, avoiding pixel-buffer transfer overhead and alpha premultiplication artifacts.
- **Robust Layer & Pattern Resizing**: `LayerManager` now retains master document dimensions when creating new layers, and `modules/pattern.ts` auto-resizes pattern buffers when stroke dimensions change.

### 1.2.1

- **Layout Thrashing Fix**: Throttles expensive DOM `getBoundingClientRect()` queries during active stylus/mouse pointer moves. Caches the dimensions/offsets per event frame and shares them across coalesced events, eliminating layout recalcs and lag on high-poll rate pointers.
- **`setDocumentSize` Flexibility**: Added support for lossless cropping/padding vs complete clearing of layers. Now supports an optional parameter: `setDocumentSize(width, height, clearArtwork = false)` where `clearArtwork` defaults to `false` (lossless preserve layout) or `true` (clear everything).

### 1.2.0

- **Sparse Bounding-Box History Tracking**: Upgraded undo/redo mechanics. Tracks exact pixel-changed bounds instead of taking full-canvas snapshots. Cuts undo memory usage by 90-95% on large and high-DPI canvases.
- **Offscreen Layer Compositing Cache**: Drastically speeds up multi-layer blending. Static layers below the active drawing layer are pre-composited, reducing draw calls from $O(N)$ to $O(1)$ and ensuring smooth 60 FPS drawing on deep stacks.
- **Robust Pointer Capture**: Highly robust, fallback-safe wrapper around `setPointerCapture` and `releasePointerCapture` with feature detection.
- **Hardened Test Coverage**: Extended comprehensive unit test coverage with Vitest.

### 1.1.0

- Modular, low-overhead undo/redo engine (`HistoryManager` with `HistoryEntry` interfaces).
- Layer property changes (opacity, name, visibility, blending) fully undoable.
- Dynamic bounding-box calculation setup for optimized undo states.

### 1.0.0

- Stable 1.0.0 baseline for the core canvas, brush, layer, and undo/redo APIs.
- Hardened pointer lifecycle handling for cancelled or interrupted input gestures.
- Improved stroke reset behavior after clearing or reloading the drawing context.
- A focused public API around reliable brush rendering, layer-based compositing, and extensible modules.

## Installation

```bash
npm install fuderu
```

## Quick Start

```ts
import { Canvas } from "fuderu";

const painter = new Canvas({
  canvas: "#canvas",
  document: {
    width: 1536,
    height: 1536,
  },
  pressureSimulation: true,
  brush: {
    color: "#000000",
    size: 20,
    spacing: 0.5,
  },
});

// Layer management
const layer = painter.createLayer("Sketch");
painter.setActiveLayer(layer.id);

painter.loadConfig({
  color: "#ff6b6b",
  size: 32,
  eraser: false,
});

painter.undo();
painter.redo();
painter.clear();
```

## Layer System

Fuderu includes a full layer stack with Photoshop-like capabilities.

### Layer Management

```tsx
// Create a layer
const sketch = painter.createLayer("Sketch");

// Get all layers
const layers = painter.getLayers();

// Get active layer
const active = painter.getActiveLayer();

// Set active layer
painter.setActiveLayer(sketch.id);

// Update layer properties
painter.updateLayer(sketch.id, {
  name: "Final Sketch",
  visible: true,
  opacity: 0.8,
  blendMode: "multiply",
});

// Duplicate a layer
const copy = painter.duplicateLayer(sketch.id);

// Move layer (stack order)
painter.moveLayer(sketch.id, 0); // Move to bottom

// Delete a layer
painter.deleteLayer(sketch.id);
```

## Blend Modes

Currently available blend modes:

| Mode        | Description                          |
| ----------- | ------------------------------------ |
| source-over | Normal                               |
| multiply    | Darkens with underlying colors       |
| screen      | Lightens with underlying colors      |
| overlay     | Combines multiply and screen         |
| darken      | Keeps darker colors                  |
| lighten     | Keeps lighter colors                 |
| color-dodge | Brightens underlying colors          |
| color-burn  | Darkens underlying colors            |
| hard-light  | Strong overlay effect                |
| soft-light  | Soft overlay effect                  |
| difference  | Subtracts colors                     |
| exclusion   | Similar to difference but softer     |
| hue         | Uses hue of top layer                |
| saturation  | Uses saturation of top layer         |
| color       | Uses hue and saturation of top layer |
| luminosity  | Uses luminosity of top layer         |

## Flow And Opacity

- **Opacity** – Stroke-level ceiling (0-1). Applied once per stroke.
- **Flow** – Per-stamp alpha buildup. Lower flow = slower paint buildup.
- **Spacing-Aware Flow** – Automatically compensates for dense stamp spacing.

## Image Brushes

```ts
await painter.loadImage("/brushes/star.png");

painter.loadConfig({
  rotation: {
    mode: "flow",
    smoothing: 0.15,
  },
});
```

Transparent images can be used as brush stamps with recoloring and rotation.

## Modules

```ts
import { Brush, DynamicShapeModule, SpreadModule } from "fuderu";

const brush = new Brush(canvas, {
  color: "#111111",
  size: 24,
});

brush.useModule(
  new DynamicShapeModule({
    sizeJitter: 0.4,
    sizeJitterTrigger: "pressure",
  }),
);

brush.useModule(
  new SpreadModule({
    spreadRange: 0.3,
    count: 3,
  }),
);
```

### Built-in modules:

- **DynamicShapeModule** – Size, angle, and roundness jitter
- **DynamicTransparencyModule** – Opacity and flow jitter
- **SpreadModule** – Position scatter
- **PatternModule** – Pattern-based stamping

## Status

Fuderu 1.2.2 is now the stable baseline for the core brush, canvas, pressure, image, eraser, and module systems.

The library is fully verified with robust unit testing via Vitest, browser-style canvas rendering tests, and various local playground environments across multiple web frameworks.

For full detailed guides and API documentations, check out the live documentation portal or look under the `/docs` folder.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

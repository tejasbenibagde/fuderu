<p align="center">
  <img
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.webp"
    alt="Fuderu Logo"
    width="420"
  />
</p>

<p align="center">
  Stable 1.2.0 canvas drawing engine for the web.
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
- undo/redo and a clear canvas wrapper
- optional advanced modules without overcomplicating the API

If you are evaluating Fuderu for production, start with those primitives and treat the more experimental effects as additive.

## Latest Release

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

Fuderu 1.2.0 is now the stable baseline for the core brush, canvas, pressure, image, eraser, and module systems.

The library is fully verified with robust unit testing via Vitest, browser-style canvas rendering tests, and various local playground environments across multiple web frameworks.

For full detailed guides and API documentations, check out the live documentation portal or look under the `/docs` folder.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

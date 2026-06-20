<p align="center">
  <img
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.webp"
    alt="Fuderu Logo"
    width="420"
  />
</p>

<p align="center">
  Lightweight, extensible canvas drawing engine for the web.
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

- **Layer System** – Full layer stack with visibility, opacity, and 16 blend modes.
- **Canvas API** – Built-in `Canvas` wrapper for pointer drawing with layer support.
- **Standalone Brush** – `Brush` engine for custom integrations.
- **Smooth Interpolation** – Adaptive brush spacing and Bezier smoothing.
- **Pressure Support** – Real pen pressure with optional mouse/touch simulation.
- **Device-Pixel-Ratio Aware** – Automatic HiDPI scaling with explicit document sizing.
- **Runtime Configuration** – Update brush properties on the fly.
- **Image Brushes** – PNG/WebP stamps with recoloring and rotation.
- **Rotation Modes** – `fixed`, `flow`, and `random` with smoothing, offset, and jitter.
- **Brush Dynamics** – Opacity, flow, angle, roundness, blend mode, and filter support.
- **Eraser Mode** – Built-in eraser with runtime toggle.
- **Undo/Redo** – Full history stack with configurable depth.
- **Module System** – Extensible with built-in dynamic shape, transparency, spread, and pattern modules.
- **TypeScript-First** – Full type safety with framework-agnostic design.

## Latest Release

### 0.8.8

- Added professional layer stack with create, delete, duplicate, reorder, and active layer selection.
- Per-layer visibility, opacity, and 16 blend modes (Normal, Multiply, Screen, Overlay, etc.).
- Brush now draws directly into the active layer's canvas.
- Layer compositing with `renderLayers()` hook.
- Fixed layer UI interactions (no more dropdown/input flicker).

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

Fuderu is currently pre-`1.0`. The core brush, canvas, pressure, image, eraser, and module systems are implemented, but public APIs may still change while the library stabilizes.

Validated with Vitest and jsdom tests.

See [ROADMAP.md](./ROADMAP.md) for the current stabilization plan.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

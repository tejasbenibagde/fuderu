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
- **Advanced Layer Controls** – Full layer stack with visibility, opacity, 16 blend modes, **Alpha Lock** (clip strokes to opaque pixels), and **Layer Lock** (protect layers from modifications).
- **Native Commands & Raster Operations** – Fast scanline flood fill (`floodFill`), vector shape primitives (`drawRectangle`, `drawEllipse`, `drawLine`), text rendering (`drawText`), and color sampling (`getColorAt`).
- **Observable State & Event System** – Reactive canvas event subscriptions (`change`, `stroke:start`, `stroke:end`, `layer:change`, `history:change`) and state snapshotting (`getSnapshot`).
- **Public History Navigation API** – Direct history timeline jumping (`goTo`), step summaries, and sparse bounding-box patch registration (`pushPatch`).
- **Canvas API & Direct Layer Methods** – Direct layer stack helpers (`getLayers`, `getLayerById`, `reorderLayers`) and pointer gesture handling.
- **Standalone Brush Engine** – Smooth Bezier interpolation, adaptive spacing, real pressure sensitivity, custom image brushes, and extensible dynamic modules.
- **TypeScript-First** – Full type safety with a framework-agnostic design.

## Release Focus

For Fuderu 1.3.0, the engine expands beyond basic brush rendering to provide a complete, production-ready canvas architecture:

- first-class document persistence and flattened image exporting
- advanced layer management including Alpha Lock, Layer Lock, and direct stack methods
- native raster utilities for flood fill, shapes, text, and color sampling
- reactive event-driven state snapshots for seamless UI integrations (e.g., React `useSyncExternalStore`)
- deep timeline history controls and sparse memory optimizations

## Latest Release

### 1.3.0

- **First-Class Document Persistence API**: Native `exportDocument()` and `importDocument()` with typed, versioned document data (`width`, `height`, `layers`, `activeLayerId`, and serialized bitmaps), plus `exportPNG()` for flattened composite output.
- **Advanced Layer Controls**: Added `alphaLock` (restricts editing to existing non-transparent pixels) and `locked` (protects layers from edits/deletion), plus direct `Canvas` methods (`getLayers()`, `getLayerById()`, `reorderLayers()`).
- **Native Raster Commands**: Built-in scanline `floodFill()`, vector shape primitives (`drawRectangle`, `drawEllipse`, `drawLine`), raster text (`drawText`), and pixel color sampling (`getColorAt`).
- **Observable State & Event Model**: Typed event subscriptions (`on`/`off`) for `change`, `stroke:start`, `stroke:end`, `layer:change`, and `history:change`, alongside `getSnapshot()`.
- **Public History Navigation & Patching**: Jump to any point in history with `canvas.history.goTo(index)` and push custom raster tool undo patches via `canvas.history.pushPatch()`.

> _For details on earlier releases (v1.0.0 – v1.2.2), please refer to the [CHANGELOG.md](./CHANGELOG.md)._

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

Fuderu 1.3.0 is the current stable release, providing a complete canvas engine with layer controls (including Alpha Lock and Layer Lock), native raster commands (flood fill, shapes, text, color sampling), state events, document persistence, pressure sensitivity, and extensible brush modules.

The library is fully verified with robust unit testing via Vitest, browser-style canvas rendering tests, and various local playground environments across multiple web frameworks.

For full detailed guides and API documentations, check out the live documentation portal or look under the `/docs` folder.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

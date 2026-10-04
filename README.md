<p align="center">
  <img
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.webp"
    alt="Fuderu Logo"
    width="420"
  />
</p>

<p align="center">
  Stable 1.5.1 canvas drawing engine for the web.
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

- **Artist Tools: Selection, Transformation & Clipboard (v1.5.0 / v1.5.1)** – Marquee and freehand lasso selections (`selectRectangle`, `selectEllipse`, `selectLasso`, `renderSelectionOutline`); floating interactive transformations with move, rotate, scale, and flip (`beginTransform`, `commitTransform`, `renderTransformBox`); cross-layer and cross-document clipboard pipeline (`copy`, `cut`, `paste`, `ClipboardStore`); typed mask caching for scanline fills.
- **Reactive State & Layer Snapshots (v1.5.1)** – Clean single-argument `Layer` constructor contract, public `canvas.getLayerSnapshots()` returning cached immutable `LayerSnapshot` DTOs, and persistent offscreen stroke canvas reuse.
- **Operation Log & Action Replay Engine (v1.4.0)** – Serializable stroke/action event stream (`action:record`, `stroke:record`), full log recording (`getActionLog`), and programmatic replay (`replay`, `replayAction`) with speed control and progress callbacks.
- **Document Persistence API** – Export and import complete canvas state as versioned JSON with layer metadata and serialized bitmaps (`exportDocument`, `importDocument`, `exportPNG`).
- **Advanced Layer Controls** – Full layer stack with visibility, opacity, 16 blend modes, **Alpha Lock** (clip strokes to opaque pixels), and **Layer Lock** (protect layers from modifications).
- **Native Commands & Raster Operations** – Fast scanline flood fill (`floodFill`), vector shape primitives (`drawRectangle`, `drawEllipse`, `drawLine`), text rendering (`drawText`), and color sampling (`getColorAt`).
- **Observable State & Event System** – Reactive canvas event subscriptions (`change`, `stroke:start`, `stroke:end`, `action:record`, `stroke:record`, `layer:change`, `history:change`) and state snapshotting (`getSnapshot`).
- **Public History Navigation API** – Direct history timeline jumping (`goTo`), step summaries, and sparse bounding-box patch registration (`pushPatch`).
- **Canvas API & Direct Layer Methods** – Direct layer stack helpers (`getLayers`, `getLayerById`, `reorderLayers`) and pointer gesture handling.
- **Standalone Brush Engine** – Smooth Bezier interpolation, adaptive spacing, real pressure sensitivity, custom image brushes, and extensible dynamic modules.
- **TypeScript-First** – Full type safety with a framework-agnostic design.

## Release Focus

For Fuderu 1.5.1, the engine delivers stability refinements, strict type signature alignment, high-frequency scanline fill optimizations, and active transform preservation in exports, building upon the complete artist tools suite (bitmask selections, floating transformations, and cross-layer clipboard pipeline) introduced in 1.5.0.

## Releases

### 1.5.1

- **Clean Layer Constructor & Signature Alignment**: Reverted `Layer` constructor to strictly accept a single argument (`new Layer(options: LayerOptions)`), removed internal mutation callback leaks, and scoped snapshot invalidation cleanly within `LayerManager`.
- **Public Layer Snapshots API**: Added `canvas.getLayerSnapshots(): readonly LayerSnapshot[]` directly on `Canvas` (and `getSnapshots()` on `LayerManager`) returning cached immutable `LayerSnapshot` DTOs for reactive state bindings (React `useSyncExternalStore`, Zustand, Svelte, Vue).
- **Fast Selection Mask Buffer in Flood Fill**: Added `Selection.getMaskData()` 1D typed mask caching, replacing synchronous `getImageData` context stalls in scanline fills with $\mathcal{O}(1)$ typed memory lookups.
- **Stroke Canvas Reuse**: Replaced per-stroke canvas allocation thrashing with a reusable persistent offscreen buffer (`getStrokeBeforeCanvas`), eliminating garbage collection pauses during rapid sketching.
- **Floating Transform Export Preservation**: Ensured in-progress floating transforms are seamlessly composited into output images and serialized documents in `canvas.exportPNG()` and `canvas.exportDocument()`.
- **Resource Teardown**: Updated `canvas.destroy()` to explicitly zero-out and detach all scratch canvases to prevent GPU memory retention.

### 1.5.0

- **Selection Tools**: Rectangular marquee, elliptical marquee, and freehand lasso selections (`selectRectangle`, `selectEllipse`, `selectLasso`, `selectAllSelection`, `clearSelection`, `invertSelection`) backed by an offscreen bitmask buffer supporting boolean combine modes (`replace`, `add`, `subtract`, `intersect`), dual-tone animated marching ants outline rendering (`renderSelectionOutline`), and automatic brush/command clipping.
- **Transform Operations**: Interactive floating transformation sessions (`beginTransform`, `commitTransform`, `cancelTransform`, `transform`, `translate`, `rotate`, `scale`, `flipHorizontal`, `flipVertical`) with live resize handles, rotator handle, and pivot rendering (`renderTransformBox`), selection-aware pixel lifting and mask updating, alpha lock preservation, and undoable history patch generation.
- **Clipboard Pipeline**: Unified clipboard store (`ClipboardStore`, `copy`, `cut`, `paste`) enabling raster selection and layer region transfers across layers and separate document instances, with optional new layer creation, marquee wrapping, floating transform initiation, and system clipboard interoperability.

### Earlier Releases Summary

- **v1.4.x**: Introduced the Operation Log & Action Replay Engine (`CanvasAction`, `action:record`, `stroke:record`, `replay`), immutable `CanvasSnapshot` with frozen `LayerSnapshot` DTOs, encapsulated `LayerManager` (`canvas.layers` private), nominal type aliases (`LayerId`, `ActionId`, `DocumentId`), schema version migration architecture (`migrateDocument`), and Alpha Lock flood fill correctness.
- **v1.3.x**: Introduced the Document Persistence API (`exportDocument`, `importDocument`, `exportPNG`), Advanced Layer Controls (`alphaLock`, `locked`), native raster commands (`floodFill`, `drawRectangle`, `drawEllipse`, `drawLine`, `drawText`, `getColorAt`), reactive state events (`change`, `stroke:start`, `stroke:end`), and public history navigation (`goTo`, `pushPatch`).
- **v1.2.x**: Major performance and memory optimizations: sparse bounding-box history patches (90-95% memory reduction), offscreen compositing cache ($O(1)$ brush strokes), and pointer gesture isolation.
- **v1.1.x & v1.0.x**: Decoupled global history engine across layers, undoable layer properties, and initial stable architecture.

> _For complete historical changelogs across all releases, see [CHANGELOG.md](./CHANGELOG.md)._

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

Fuderu 1.5.1 is the current stable release, providing a complete canvas engine with serializable operation logs & action replay stream API, layer controls (including Alpha Lock and Layer Lock), native raster commands, multi-pointer gesture safety, state events, document persistence with lock state serialization, pressure sensitivity, and extensible brush modules.

The library is fully verified with robust unit testing via Vitest, browser-style canvas rendering tests, and various local playground environments across multiple web frameworks.

For full detailed guides and API documentations, check out the live documentation portal or look under the `/docs` folder.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

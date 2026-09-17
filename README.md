<p align="center">
  <img
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.webp"
    alt="Fuderu Logo"
    width="420"
  />
</p>

<p align="center">
  Stable 1.4.2 canvas drawing engine for the web.
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

- **Architecture Refinements & Safety (v1.4.2)** – Immutable `CanvasSnapshot` with frozen `LayerSnapshot` DTOs, encapsulated `LayerManager` (`canvas.layers` private), explicit type aliases (`LayerId`, `ActionId`, `DocumentId`), and schema version migration architecture (`migrateDocument`).
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

For Fuderu 1.4.2, the engine delivers key architectural refinements: immutable `CanvasSnapshot` data transfer objects, strict encapsulation of `LayerManager` within `Canvas`, explicit type aliases for identifiers, forward-compatible document schema version migrations, real multi-component Canvas2D integration tests, and a dedicated performance benchmarking suite.

## Releases

### 1.4.2

- **Immutable `CanvasSnapshot`**: `canvas.getSnapshot()` returns deeply frozen snapshot objects and layer DTOs (`LayerSnapshot[]`), guaranteeing that reactive consumers (such as React `useSyncExternalStore`) cannot accidentally mutate internal layer references.
- **Encapsulate `LayerManager`**: `canvas.layers` is now strictly private, ensuring all layer creation, selection, reordering, update, and deletion operations route cleanly through public `Canvas` methods.
- **Explicit Type Aliases for Identifiers**: Introduced distinct `LayerId`, `ActionId`, and `DocumentId` string type aliases across the engine, actions, events, and persistence layers for future-proof multiplayer collaboration.
- **Document Version Migration Architecture**: Established `CURRENT_DOCUMENT_VERSION = 1` and a composable `migrateDocument(doc)` pipeline, validating schemas and guaranteeing forward compatibility across document schema revisions.
- **Real Canvas2D Integration Tests**: Multi-component integration test suite verifying real raster rendering, compositing, layer reordering, and history interactions without reliance on full mock stubs.
- **Performance Benchmarking Suite**: Automated profiling suite benchmarking high-frequency stroke event capture (>10,000 points/sec), high layer-count compositing (30 layers), and sub-millisecond snapshot generation.

### 1.4.1

- **Alpha Lock Flood Fill Fix**: Pixel-level alpha blending in `floodFill` strictly preserves original pixel alpha values and leaves zero-alpha transparent pixels untouched when `alphaLock === true`.
- **Brush Engine Clean Decoupling**: Purged legacy history code (`maxUndoRedoStackSize`, `initCanvasStack()`, and dummy `undo()`/`redo()` stubs) from `Brush.ts`, standardizing on `HistoryManager` as the single source of truth for history.
- **Layer-Switch History Hardening**: Regression test suite ensuring lossless global undo/redo across arbitrary active-layer switches.
- **Locked Layer Enforcement**: Comprehensive test coverage verifying that locked layers reject brush drawing, flood fill, clear, raster commands, and deletion.
- **Lossless Persistence Round-Trip**: Automated test verification validating document dimension, layer stack, and property integrity across export and import cycles.

### 1.4.0

- **Operation Log & Action Stream API**: Strong type definitions for canvas actions (`CanvasAction`, `StrokeAction`, etc.), stream events (`"action:record"`, `"stroke:record"`), and action replay engine (`recordAction()`, `getActionLog()`, `clearActionLog()`, `replayAction()`, `replay()`).
- **Replay Execution Guard**: `isReplaying` state isolation ensures replaying action sequences never duplicates action logs or triggers recursive event loops.

### Pre-1.4.0 Releases Summary

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

Fuderu 1.4.0 is the current stable release, providing a complete canvas engine with serializable operation logs & action replay stream API, layer controls (including Alpha Lock and Layer Lock), native raster commands, multi-pointer gesture safety, state events, document persistence with lock state serialization, pressure sensitivity, and extensible brush modules.

The library is fully verified with robust unit testing via Vitest, browser-style canvas rendering tests, and various local playground environments across multiple web frameworks.

For full detailed guides and API documentations, check out the live documentation portal or look under the `/docs` folder.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

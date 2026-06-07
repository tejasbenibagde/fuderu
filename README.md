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

- Built-in `Canvas` wrapper for pointer drawing.
- Standalone `Brush` engine for custom integrations.
- Smooth interpolation and adaptive brush spacing.
- Real pen pressure with optional mouse/touch pressure simulation disabled by default.
- Device-pixel-ratio aware canvas setup with explicit document sizing support.
- Runtime brush configuration.
- Image-based brush stamps with recoloring and rotation.
- Rotation modes: `fixed`, `flow`, and `random`.
- Opacity, spacing-aware flow, angle, roundness, blend mode, and filter support.
- Undo, redo, clear, and destroy lifecycle helpers.
- Built-in eraser mode with runtime toggle support.
- Runtime module system with built-in dynamic shape, transparency, spread, and pattern modules.
- TypeScript-first and framework-agnostic.

## Latest Release

### 0.8.8 (in development)

- Optional mouse/touch pressure simulation is now disabled by default in `Canvas`.
- Added coalesced pointer event support in `Canvas.handlePointerMove` for smoother pen and stylus drawing on browsers that expose `getCoalescedEvents()`.

### 0.8.7

- Added spacing-aware flow normalization so low-flow strokes do not flatten into solid color just because stamp spacing is dense.
- Fixed pointer coordinate scaling when a canvas is displayed at a different CSS size than its logical drawing buffer.

### 0.8.6

- Improved canvas resize handling so the rendered canvas stays in sync with its visible element size.

### 0.8.5

- Fixed an initial stroke gap when drawing fast, ensuring the first brush stamp connects correctly to the second point.

### 0.8.4

- Fixed low-opacity dense stroke rendering when spacing is reduced.
- Fixed stroke opacity state leaking into later strokes after stroke completion.
- Fixed brush stability after finishing one stroke and starting the next.

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

painter.loadConfig({
  color: "#ff6b6b",
  size: 32,
  eraser: false,
});

painter.undo();
painter.redo();
painter.clear();
```

By default, `pressureSimulation` is disabled to keep mouse/touch input deterministic. Set `pressureSimulation: true` when you want mouse/touch to use simulated pressure.

If `document` is omitted, Fuderu sizes the internal drawing buffer from the
canvas element's CSS size multiplied by `window.devicePixelRatio`.

## Flow And Opacity

`opacity` is applied as a stroke-level ceiling. `flow` controls how quickly paint
builds up from individual stamps. From `0.8.7`, Fuderu normalizes flow against
brush size and spacing, so dense stamp overlap no longer makes low-flow strokes
turn solid immediately.

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

Transparent images can be used as brush stamps. Fuderu can recolor them and rotate each stamp along the stroke direction.

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

Built-in modules can adjust per-stamp shape, transparency, position spread, and pattern texture compositing. Custom modules can hook into point changes, config changes, stroke compositing, and stroke end.

## Status

Fuderu is currently pre-`1.0`. The core brush, canvas, pressure, image, eraser, and module systems are implemented, but public APIs may still change while the library stabilizes.

Validated with Vitest and jsdom tests.

See [ROADMAP.md](./ROADMAP.md) for the current stabilization plan.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

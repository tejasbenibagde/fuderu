<p align="center">
  <img
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.png"
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
- Real pen pressure plus optional mouse/touch pressure simulation.
- Runtime brush configuration.
- Image-based brush stamps with recoloring and rotation.
- Rotation modes: `fixed`, `flow`, and `random`.
- Opacity, flow, angle, roundness, blend mode, and filter support.
- Undo, redo, clear, and destroy lifecycle helpers.
- Built-in eraser mode with runtime toggle support.
- Runtime module system with built-in dynamic shape, transparency, spread, and pattern modules.
- TypeScript-first and framework-agnostic.

## Installation

```bash
npm install fuderu
```

## Quick Start

```ts
import { Canvas } from "fuderu";

const painter = new Canvas({
  canvas: "#canvas",
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

Validated in:

- Vanilla HTML/TypeScript playground
- React/Next.js playground
- Vitest + jsdom tests

See [ROADMAP.md](./ROADMAP.md) for the current stabilization plan.

## License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

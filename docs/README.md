# Fuderu Local Sandbox

The `playground/` directory houses the lightweight Vanilla TypeScript/JavaScript sandbox wired directly to `src/` via Vite's `@fuderu` alias for fast local engine development and debugging.

> Looking for the full-featured studio app powered by the published `fuderu` npm package? See [`apps/drawing-pad`](../apps/drawing-pad/README.md).

## Quick Start

Install root dependencies once and run the local sandbox:

```bash
npm install
npm run vanilla
```

## What This Sandbox Tests

- **Local Source Iteration**: Imports `Canvas`, `Brush`, and built-in modules directly from `src/` with zero build step.
- **Core Pipeline Verification**: Multi-layer stack management, blend modes, alpha/layer lock, selection tools, interactive transforms, clipboard operations, custom image brushes, and serializable action replay.

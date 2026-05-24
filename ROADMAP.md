# Fuderu Roadmap

Fuderu is a lightweight, framework-agnostic canvas drawing engine. The project is still pre-`1.0`, but most of the original brush and module foundations are now in place.

## Current Status

Current package version: `0.8.2`

The public API is still experimental until `1.0.0`. Minor releases may still change brush configuration, module hooks, rendering internals, or canvas lifecycle behavior when needed.

## Implemented

- Canvas wrapper with pointer input, high-DPI setup, cleanup, clear, undo, and redo.
- Brush engine with interpolation, adaptive spacing, smoothing toggles, runtime config updates, blend modes, and canvas filters.
- Pressure-aware drawing with real pen pressure and optional mouse/touch pressure simulation.
- Image brushes with recoloring and rotation modes: `fixed`, `flow`, and `random`.
- Runtime module registration and removal.
- Built-in modules for dynamic shape, dynamic transparency, spread, and pattern textures.
- Test coverage for brush setup, config updates, rotation, modules, undo/redo basics, canvas setup, utilities, and pointer handling.
- Example/playground coverage for vanilla HTML and Next.js/React usage.

## Still Experimental

- Module API shape and execution order.
- Large-canvas performance and stress behavior.
- Mobile/touch behavior across more devices.
- Complex brush accumulation and textured brush combinations.
- Long-running memory behavior with large undo stacks.

## Next Priorities

- Stabilize the module API and document each built-in module.
- Improve pressure controls, including configurable mouse pressure ranges.
- Add brush presets and examples for common brush types.
- Expand performance tests for large canvases and dense strokes.
- Validate mobile and multi-DPR rendering more thoroughly.
- Explore OffscreenCanvas, worker rendering, and WASM acceleration only after the core API is stable.

## v1.0 Goals

- Stable public `Canvas`, `Brush`, config, and module APIs.
- Documented preset and module workflows.
- Reliable browser compatibility expectations.
- Clear semantic versioning guarantees for future releases.

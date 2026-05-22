# 🗺️ Fuderu Roadmap

## ⚠ Current Development Status

Fuderu is currently in active development.

Before `v1.0.0`, internal rendering systems, module APIs, and brush behavior may evolve rapidly.

This means:

* Breaking changes are possible in minor releases
* Internal rendering pipelines may be refactored
* Module APIs are still experimental
* Rendering behavior may change between versions
* Some systems are foundations for future features rather than fully finalized APIs

---

# 🔄 API Stability

| Version Range | Stability                                |
| ------------- | ---------------------------------------- |
| `v0.x`        | Experimental — breaking changes allowed  |
| `v1.x`        | Stable public APIs                       |
| `v2.x`        | Reserved for major architecture rewrites |

---

# 📦 Current Version Direction

## v0.8.x — Modular Brush Foundation

Focus:

* Modular brush architecture groundwork
* Brush image support
* Brush image rotation system
* Runtime brush configuration
* Brush interpolation improvements
* Module registration system
* Pressure-aware point input
* Rendering pipeline cleanup

Potential breaking changes:

* Brush constructor behavior
* Brush configuration structure
* Rotation configuration APIs
* Rendering internals
* Module hook signatures
* Internal interpolation flow

---

## v0.9.x — Rendering Pipeline Rewrite

Focus:

* Rendering lifecycle hooks
* OffscreenCanvas experimentation
* Render batching
* Performance optimizations
* Worker-ready architecture
* WASM preparation layer
* Internal renderer abstraction

Potential breaking changes:

* Renderer interfaces
* Internal rendering flow
* Canvas lifecycle behavior
* Module execution order

---

## v1.0.0 — Stable Public API

Goals:

* Stable module system
* Stable rendering lifecycle
* Stable preset system
* Stable brush APIs
* Production-ready rendering APIs
* Long-term semantic versioning guarantees

---

# ✅ Currently Implemented

| Feature                     | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| Brush Interpolation         | Smooth interpolated brush point generation           |
| Adaptive Brush Spacing      | Dynamic spacing based on brush configuration         |
| Runtime Brush Configuration | Dynamically update brush settings at runtime         |
| Advanced Brush Rendering    | Opacity, flow, angle, roundness, and rotation support |
| Pressure-Aware Point Input  | Pointer pressure values passed into the brush engine |
| Brush Image Support         | Custom image-based brush stamps                      |
| Brush Image Rotation        | Direction-aware image stamp rotation along strokes   |
| Blend Mode Support          | Custom canvas compositing support                    |
| Canvas Filter Support       | Canvas filter rendering support                      |
| Module Registration System  | Runtime module registration/removal                  |
| Undo / Redo Stack           | Canvas history state management                      |

---

## Canvas Engine

| Feature                        | Description                              |
| ------------------------------ | ---------------------------------------- |
| Built-in Canvas Class          | High-level drawing wrapper               |
| Pointer Event Handling         | Built-in pointer input management        |
| High-DPI Canvas Scaling        | DPR-aware canvas rendering               |
| Coordinate Normalization       | Consistent pointer-to-canvas mapping     |
| Touch Interaction Handling     | Touch-action and selection handling      |
| Automatic Render Queue         | Frame-based render scheduling            |
| Runtime Config Loading         | Dynamically update brush config          |
| Canvas Clearing                | Built-in canvas clearing                 |
| Cleanup / Destroy Lifecycle    | Automatic event listener cleanup         |
| String or Element Canvas Input | Accept canvas element or selector string |

---

# 🧪 Tested Features

| Test                          | Status |
| ----------------------------- | ------ |
| Brush initialization          | ✅      |
| Runtime config updates        | ✅      |
| Brush interpolation           | ✅      |
| Brush image rotation          | ✅      |
| Adaptive spacing calculations | ✅      |
| Brush image loading           | ✅      |
| Undo/redo behavior            | ✅      |
| Canvas initialization         | ✅      |
| High-DPI rendering behavior   | ✅      |
| Coordinate normalization      | ✅      |
| Canvas cleanup lifecycle      | ✅      |
| Runtime config loading        | ✅      |
| Pointer event handling        | ✅      |

---

# 🚧 Currently Experimental

These systems still require broader real-world validation.

| Feature                     | Status |
| --------------------------- | ------ |
| Mobile/touch validation     | 🚧     |
| Large canvas rendering      | 🚧     |
| Multi-device DPR validation | 🚧     |
| Performance stress testing  | 🚧     |
| Complex brush accumulation  | 🚧     |
| Advanced rotation behavior  | 🚧     |
| Module ecosystem design     | 🚧     |

> The Canvas system currently works in:
>
> * Vanilla HTML/TypeScript environments
> * React environments
> * Next.js environments

---

# 🧱 Current Architecture

Fuderu is evolving toward a modular rendering architecture.

Current internal layering:

```txt
Canvas Layer
  ↓
Input Normalization
  ↓
Brush Engine
  ↓
Interpolation Engine
  ↓
Module Pipeline
  ↓
Stamp Generation
  ↓
Canvas Renderer
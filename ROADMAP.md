# 🗺️ Fuderu Roadmap

## ⚠ Current Development Status

Fuderu is currently in rapid development.

Before `v1.0.0`, internal rendering systems, module APIs, and brush behaviors may evolve quickly.

This means:

* Breaking changes are possible in minor releases
* Internal rendering pipelines may be refactored
* Module APIs are not yet considered stable
* Experimental systems may change significantly

---

# 🔄 API Stability

| Version Range | Stability                                |
| ------------- | ---------------------------------------- |
| `v0.x`        | Experimental — breaking changes allowed  |
| `v1.x`        | Stable public APIs                       |
| `v2.x`        | Reserved for major architecture rewrites |

---

# 📦 Current Version Direction

## v0.8.x — Modular Brush System

Focus:

* Brush modules
* Spread modules
* Pattern modules
* Dynamic transparency
* Dynamic shape generation
* Pressure support groundwork
* Brush extensibility APIs

Potential breaking changes:

* Brush constructor behavior
* Brush configuration structure
* Rendering lifecycle
* Interpolation pipeline
* Internal stamp generation

---

## v0.9.x — Rendering Pipeline Rewrite

Focus:

* Rendering lifecycle hooks
* OffscreenCanvas support
* Render batching
* Performance optimizations
* Worker-based calculations
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
* Stable pressure pipeline
* Production-ready APIs
* Long-term semantic versioning guarantees

---

# ✅ Currently Implemented

| Feature                         | Description                                           |
| ------------------------------- | ----------------------------------------------------- |
| Lazy Brush Effect               | Smooth delayed brush following                        |
| Configurable Radius             | Control how far brush trails behind                   |
| Friction-Based Movement         | Optional smoothing during updates                     |
| Brush Position Tracking         | Get brush and pointer coordinates                     |
| Distance & Angle Tracking       | Debug info for brush behavior                         |
| Enable/Disable                  | Toggle lazy brush on/off                              |
| Runtime Radius Updates          | Update radius dynamically with `setRadius()`          |
| Dynamic Brush Size              | Runtime brush size updates                            |
| Eraser State                    | Built-in eraser state management                      |
| Brush Stamp Interpolation       | Generate smooth points between brush updates          |
| Adaptive Brush Spacing          | Dynamic spacing calculation based on size and opacity |
| Density Compensation            | Prevent overly dense/dark brush stamping              |
| Density Compensation Controls   | Enable/disable density compensation at runtime        |
| Opacity Compensation Helpers    | Auto-adjust opacity for smooth accumulation           |
| Custom Brush Spacing Limits     | Configure min/max spacing dynamically                 |
| Flexible Input Support          | Accepts mouse, touch, or pointer coordinates          |
| Built-in Canvas Class           | High-level canvas drawing system                      |
| Pointer Event Handling          | Built-in pointer/mouse/touch event management         |
| High-DPI Canvas Scaling         | Automatic DPR-aware canvas rendering                  |
| Brush Stroke Rendering          | Smooth interpolated canvas drawing                    |
| Canvas Resize Handling          | Automatic resize + redraw preservation                |
| Runtime Color Updates           | Dynamically update brush color                        |
| Runtime Opacity Updates         | Dynamically update brush opacity                      |
| Runtime Friction Updates        | Dynamically update brush friction                     |
| Runtime Eraser Switching        | Toggle eraser mode during drawing                     |
| Canvas Clearing                 | Built-in canvas clearing support                      |
| Canvas Destruction Cleanup      | Automatic event listener cleanup                      |
| String or Element Canvas Input  | Accept canvas element or selector string              |
| Canvas Coordinate Normalization | Consistent pointer-to-canvas coordinate mapping       |
| Touch Interaction Improvements  | Built-in touch-action and selection handling          |

---

# 🧪 Tested Features

| Test                               | Status |
| ---------------------------------- | ------ |
| Default brush initialization       | ✅      |
| Runtime radius updates             | ✅      |
| Runtime size updates               | ✅      |
| Friction-based updates             | ✅      |
| Brush movement tracking            | ✅      |
| Eraser mode switching              | ✅      |
| Enable/disable behavior            | ✅      |
| Brush size validation              | ✅      |
| Constructor fallback values        | ✅      |
| Brush state preservation           | ✅      |
| Interpolated point generation      | ✅      |
| Dynamic spacing calculations       | ✅      |
| Density compensation calculations  | ✅      |
| Density compensation toggles       | ✅      |
| Opacity compensation behavior      | ✅      |
| Custom spacing limit configuration | ✅      |
| Canvas initialization              | ✅      |
| Canvas default values              | ✅      |
| Canvas custom values               | ✅      |
| Runtime color updates              | ✅      |
| Runtime opacity updates            | ✅      |
| Runtime friction updates           | ✅      |
| Runtime brush size updates         | ✅      |
| Runtime brush radius updates       | ✅      |
| Eraser enable/disable/toggle       | ✅      |
| Canvas clearing                    | ✅      |
| Canvas resize safety               | ✅      |
| Canvas destruction cleanup         | ✅      |
| DPR scaling behavior               | ✅      |
| Pointer coordinate normalization   | ✅      |

---

# 🚧 Currently Experimental

These systems still require broader real-world validation.

| Feature                     | Status |
| --------------------------- | ------ |
| Mobile/touch validation     | 🚧     |
| Performance stress tests    | 🚧     |
| Multi-device DPR validation | 🚧     |
| Complex brush accumulation  | 🚧     |
| Large canvas rendering      | 🚧     |

> The Canvas system currently works in:
>
> * Unit tests
> * Vanilla HTML/TypeScript environments
> * React/Next.js environments

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
Brush Modules (future)
  ↓
Stamp Generation
  ↓
Canvas Renderer
```

---

# 🧠 Internal Systems

## Brush Engine

* Brush interpolation
* Density-aware spacing
* Opacity compensation
* Runtime brush state management
* Eraser state handling
* Lazy movement calculations
* Friction smoothing
* Adaptive brush spacing

## Canvas Engine

* Pointer event handling
* Canvas rendering
* DPI-aware scaling
* Stroke interpolation rendering
* Canvas clearing
* Resize preservation
* Automatic cleanup systems
* Runtime drawing configuration
* Canvas coordinate normalization

---

# 🚧 User Land (Still Fully Controlled by User)

Fuderu includes a built-in canvas renderer, but users still fully control:

* Application UI
* Toolbar systems
* Color pickers
* Brush presets
* Undo/redo history
* Saving/exporting
* Layer systems
* Cursor rendering styles
* Custom compositing modes
* State persistence
* Multiplayer/collaboration systems
* Rendering pipelines
* Custom shaders/effects

---

# 🔮 Planned Features

## Core Features

* [ ] Pressure sensitivity support
* [ ] Velocity-based brush dynamics
* [ ] Brush stabilization improvements
* [ ] Built-in cursor visualization
* [ ] Stroke smoothing algorithms
* [ ] Stroke replay system
* [ ] Multi-pointer drawing support

---

## Modular Brush System

* [ ] Spread modules
* [ ] Pattern modules
* [ ] Dynamic transparency modules
* [ ] Dynamic shape modules
* [ ] Brush lifecycle hooks
* [ ] Module execution pipeline
* [ ] Type-safe module APIs
* [ ] Runtime module injection
* [ ] Brush middleware system

---

## Brush System

* [ ] Multiple brush types (spray, calligraphy, watercolor)
* [ ] Brush texture support
* [ ] Pattern brushes
* [ ] Shape brushes
* [ ] Smudge brush support
* [ ] Wet paint simulation
* [ ] Grain/noise simulation
* [ ] Alpha accumulation modes
* [ ] Pressure curves
* [ ] Brush preset system

---

## Drawing Features

* [ ] Undo/redo stack
* [ ] Layer support
* [ ] Selection tools
* [ ] Shape tools
* [ ] Symmetry drawing
* [ ] Stroke recording/export
* [ ] SVG path generation
* [ ] Infinite canvas support

---

## Performance

* [ ] RequestAnimationFrame rendering helpers
* [ ] Performance optimizations for very large canvases
* [ ] WebWorker-based calculations
* [ ] Optimized touch rendering
* [ ] Spatial caching for interpolation
* [ ] Incremental redraw optimizations
* [ ] OffscreenCanvas support
* [ ] Render batching systems
* [ ] Frame scheduling systems

---

## Rust / WASM Integration

Planned areas for future Rust migration:

* [ ] Interpolation engine
* [ ] Spline calculations
* [ ] Brush stamp simulation
* [ ] Texture sampling
* [ ] Smudge/wet paint processing
* [ ] Alpha accumulation calculations
* [ ] Image processing systems
* [ ] Stroke replay systems
* [ ] WASM-compatible rendering backend

> DOM interaction and framework bindings will remain TypeScript-first.

---

## Developer Experience

* [ ] React bindings
* [ ] Vue bindings
* [ ] Svelte bindings
* [ ] SolidJS bindings
* [ ] Type-safe plugin system
* [ ] Preset brush configurations
* [ ] Devtools/debug overlay
* [ ] Interactive playground website
* [ ] Visual debugging helpers
* [ ] Documentation website
* [ ] Live examples gallery
* [ ] CLI tooling
* [ ] Config validation helpers

---

# 🎯 Current Philosophy

Fuderu focuses on:

* Lightweight brush logic
* Framework-agnostic architecture
* User-controlled rendering pipelines
* Maximum customization
* Smooth and predictable brush movement
* Brush-engine utilities without framework lock-in
* High-performance drawing primitives
* Extensible canvas systems
* Minimal API surface
* Runtime configurability
* Modular rendering architecture
* WASM-ready computation systems

---

# 📌 Current State

Fuderu is evolving from:

> “A simple brush utility”

into:

> “A lightweight extensible drawing engine”

while still remaining:

* Lightweight
* Framework agnostic
* Runtime configurable
* Rendering focused
* Easy to integrate
* TypeScript-first
* Extensible
* Performance oriented

---

# 🛣️ Long-Term Vision

Future long-term goals:

* Production-grade rendering engine
* Stable plugin ecosystem
* Rust/WASM acceleration layer
* Cross-framework integrations
* Advanced procedural brush systems
* Infinite canvas workflows
* Collaborative rendering support
* Professional drawing tooling

---

*Legend: ✅ = Done | 🚧 = Experimental / Needs Validation | 🔮 = Planned*

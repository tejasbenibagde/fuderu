# Fuderu Roadmap

Fuderu is a lightweight, framework-agnostic digital painting engine for the web.

The goal is to provide modern brush dynamics, extensible modules, and high-performance canvas rendering while remaining easy to integrate into vanilla JavaScript, React, Next.js, and other frameworks.

---

## Current Status

Current package version: `0.8.6`

The public API remains experimental until `1.0.0`.

Minor releases may still introduce breaking changes to:

- Brush configuration
- Module hooks
- Rendering internals
- Canvas lifecycle APIs

---

# Implemented

## Canvas

- Pointer input support
- High-DPI rendering
- Explicit logical document sizing
- Runtime canvas resizing
- Runtime document size changes
- Clear
- Undo / Redo
- Cleanup lifecycle

## Brush Engine

- Interpolation
- Adaptive spacing
- Smoothing
- Runtime configuration updates
- Blend modes
- Canvas filters
- Eraser compositing

## Pressure

- Native pen pressure
- Mouse/touch pressure simulation
- Runtime simulation toggle
- Runtime pressure controls

## Brush Shapes

- Standard ellipse brush
- Image brushes
- Runtime recoloring
- Per-stamp opacity and flow
- Rotation modes:
  - Fixed
  - Flow
  - Random

## Modules

- Dynamic Shape
- Dynamic Transparency
- Spread
- Pattern

## Testing

- Brush setup
- Config updates
- Rotation
- Modules
- Undo / Redo
- Canvas lifecycle
- Utilities
- Pointer handling

---

# Experimental

These APIs may still change before 1.0.

## Module System

- Module API shape
- Module execution order
- Cross-module interactions

## Rendering

- Large canvas behavior
- Dense stroke performance
- Long-running memory usage
- Large undo stack behavior

## Device Support

- Mobile rendering consistency
- Touch device validation
- Multi-DPR validation

---

# Milestone: v1.0 Stability

Goal: stabilize the current foundation.

## Documentation

- Complete API documentation
- Module documentation
- Brush documentation
- Framework integration guides

## Presets

- Pencil
- Marker
- Ink
- Soft Brush
- Airbrush

## Reliability

- Browser compatibility matrix
- Expanded automated testing
- Mobile validation
- Performance benchmarks

## API Freeze

- Stable Canvas API
- Stable Brush API
- Stable Module API

---

# Milestone: Digital Painting Features

Goal: evolve Fuderu from a drawing library into a painting engine.

## Brush Dynamics

### Velocity Dynamics

Allow brush properties to react to drawing speed.

Examples:

- Speed → Size
- Speed → Opacity
- Speed → Flow

### Pressure Curves

Custom pressure response curves.

Examples:

- Linear
- Soft
- Hard
- Custom curve editor

### Color Dynamics

Randomized:

- Hue
- Saturation
- Value

for more natural strokes.

---

## Brush Effects

### Improved Scatter

Advanced scatter controls:

- Position scatter
- Angle scatter
- Scale scatter

### Texture Brushes

Support texture-driven brushes.

Examples:

- Chalk
- Pencil
- Dry Brush
- Oil Paint

### Stamp Brushes

Pattern and shape stamping workflows.

---

## Tablet Features

### Tilt Support

Support:

- tiltX
- tiltY

for realistic brush orientation.

### Advanced Rotation

Additional rotation sensors and dynamics.

---

# Milestone: Advanced Painting Engine

Goal: reach feature parity with professional brush systems.

## Smudge Brush

Canvas sampling and paint mixing.

Features:

- Smearing
- Wet paint effects
- Color pickup

## Wet Brushes

Experimental paint accumulation and blending.

## Brush Sensors

Drive brush properties using:

- Pressure
- Velocity
- Tilt
- Direction
- Randomness

---

# Milestone: Performance

Goal: support larger projects and professional workflows.

## Rendering

- OffscreenCanvas
- Worker rendering
- Incremental rendering

## Native Acceleration

Investigate:

- WebAssembly
- Rust modules

for heavy brush calculations.

## GPU Rendering

Future exploration:

- WebGL
- WebGPU

for advanced brush effects and large canvases.

---

# Future Ecosystem

## Brush Presets

Import/export brush definitions.

```json
{
  "size": 20,
  "scatter": 0.2,
  "texture": "chalk",
  "opacity": 0.8
}
```

## Community Presets

Shareable brush packs.

## Plugin Ecosystem

Custom modules:

- Watercolor
- Pencil
- Grass
- Particle brushes

---

# Long-Term Vision

Fuderu aims to become a modern, TypeScript-first digital painting engine for the web, combining:

- Professional brush dynamics
- Extensible module architecture
- Framework-agnostic integration
- High-performance rendering
- Future GPU acceleration

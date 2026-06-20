# Fuderu Roadmap

Fuderu is a lightweight, framework-agnostic digital painting engine for the web.

The goal is to provide modern brush dynamics, professional painting workflows, extensible modules, and high-performance rendering while remaining easy to integrate into vanilla JavaScript, React, Next.js, and other frameworks.

---

# Current Status

Current package version: `0.9.0`

The public API remains experimental until `1.0.0`.

Minor releases may still introduce breaking changes to:

- Brush configuration
- Module hooks
- Rendering internals
- Canvas lifecycle APIs
- Layer APIs

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
- Rotation modes
  - Fixed
  - Flow
  - Random

## Modules

- Dynamic Shape
- Dynamic Transparency
- Spread
- Pattern

## Layer System ✅

- Create layer
- Delete layer
- Duplicate layer
- Rename layer
- Reorder layers (move up/down)
- Active layer selection
- Layer visibility (show/hide)
- Layer opacity (0-100%)
- Layer blend modes (16 modes)
- Brush draws into active layer
- Layer compositing pipeline
- Layer thumbnails

## Testing

- Brush setup
- Config updates
- Rotation
- Modules
- Undo / Redo
- Canvas lifecycle
- Utilities
- Pointer handling
- Layer management

---

# Milestone: v1.0 Stability

Goal: Stabilize the current foundation.

## Documentation

- Complete API documentation
- Module documentation
- Brush documentation
- Framework integration guides

## Presets

- Pencil
- Marker
- Ink
- Airbrush
- Soft Round
- Hard Round

## Reliability

- Browser compatibility matrix
- Expanded automated testing
- Mobile validation
- Performance benchmarks

## API Freeze

- Stable Canvas API
- Stable Brush API
- Stable Module API
- Stable Layer API

---

# Milestone: Advanced Brush Dynamics

Goal: Reach professional-grade brush behavior.

## Velocity Dynamics

Drive brush properties using speed.

Examples:

- Speed → Size
- Speed → Opacity
- Speed → Flow

## Pressure Curves

Custom pressure response curves.

### Presets

- Linear
- Soft
- Hard

## Brush Sensors

Drive brush properties using:

- Pressure
- Velocity
- Tilt
- Direction
- Randomness

## Tilt Support

Tablet stylus support.

### Inputs

- tiltX
- tiltY

## Color Dynamics

Natural variation.

### Features

- Hue jitter
- Saturation jitter
- Value jitter

---

# Milestone: Professional Brush Effects

Goal: Expand brush expressiveness.

## Scatter System

Advanced scatter controls.

### Features

- Position scatter
- Angle scatter
- Scale scatter
- Flow scatter

## Texture Brushes

Texture-driven stamps.

Examples:

- Chalk
- Pencil
- Dry brush
- Oil brush

## Smudge Brush

Canvas sampling and color dragging.

### Features

- Paint pickup
- Smearing
- Mixing

## Wet Brushes

Experimental paint accumulation.

### Features

- Color mixing
- Wet edges
- Paint buildup

---

# Milestone: Layer Enhancements

Goal: Expand layer capabilities.

## Layer Locking

- Lock Transparency – Paint only existing pixels
- Lock Layer – Prevent edits
- Lock Position – Future transform support

## Layer Groups

Organize complex projects.

### Features

- Group layers
- Nested groups
- Group visibility
- Group opacity
- Group blend modes

## Layer Masks

Non-destructive editing.

### Features

- Add mask
- Remove mask
- Paint mask
- Invert mask

## Clipping Masks

Paint constrained to underlying layer content.

Useful for:

- Coloring
- Shading
- Highlights

## Adjustment Layers

Future support for:

- Brightness
- Contrast
- Hue/Saturation
- Curves

---

# Milestone: Project System

Goal: Enable professional workflows.

## Document Model

Store:

- Layers
- Masks
- Brush settings
- Canvas size

## Save / Load

### Formats

- JSON project format
- Export PNG
- Export JPEG
- Export WebP

## Auto Save

Recovery system.

## Project History

Persistent undo stack.

---

# Milestone: Performance Architecture

Goal: Support large documents and complex brushes.

## Rendering Pipeline

- Dirty rectangle rendering
- Partial layer updates
- Incremental compositing

## Offscreen Rendering

- OffscreenCanvas
- Background compositing

## Worker Support

Move heavy work off main thread.

Examples:

- Brush calculations
- Layer compositing
- Image processing

## Memory Optimization

- Tile-based rendering
- Layer caching
- Snapshot compression

---

# Milestone: GPU Acceleration

Goal: Future-proof rendering architecture.

## WebGL Backend

Accelerated:

- Brush rendering
- Compositing
- Filters

## WebGPU Backend

Long-term rendering architecture.

### Potential Features

- Real-time blur
- Real-time smudge
- Massive canvas support
- Advanced paint simulation

## Rust + WebAssembly

Accelerate:

- Brush engines
- Smudge calculations
- Layer compositing
- Color processing

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

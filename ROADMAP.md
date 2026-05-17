# 🗺️ Fuderu Roadmap

## ✅ Currently Implemented

| Feature                         | Description                                                  |
| --------------------------------| ------------------------------------------------------------ |
| Lazy Brush Effect               | Smooth delayed brush following                               |
| Configurable Radius             | Control how far brush trails behind                          |
| Friction-Based Movement         | Optional smoothing during updates                            |
| Brush Position Tracking         | Get brush and pointer coordinates                            |
| Distance & Angle Tracking       | Debug info for brush behavior                                |
| Enable/Disable                  | Toggle lazy brush on/off                                     |
| Runtime Radius Updates          | Update radius dynamically with `setRadius()`                 |
| Dynamic Brush Size              | Runtime brush size updates                                   |
| Eraser State                    | Built-in eraser state management                             |
| Brush Stamp Interpolation       | Generate smooth points between brush updates                 |
| Adaptive Brush Spacing          | Dynamic spacing calculation based on size and opacity        |
| Density Compensation            | Prevent overly dense/dark brush stamping                     |
| Density Compensation Controls   | Enable/disable density compensation at runtime               |
| Opacity Compensation Helpers    | Auto-adjust opacity for smooth accumulation                  |
| Custom Brush Spacing Limits     | Configure min/max spacing dynamically                        |
| Flexible Input Support          | Accepts mouse, touch, or pointer coordinates                 |
| Built-in Canvas Class           | High-level canvas drawing system                             |
| Pointer Event Handling          | Built-in pointer/mouse/touch event management                |
| High-DPI Canvas Scaling         | Automatic DPR-aware canvas rendering                         |
| Brush Stroke Rendering          | Smooth interpolated canvas drawing                           |
| Canvas Resize Handling          | Automatic resize + redraw preservation                       |
| Runtime Color Updates           | Dynamically update brush color                               |
| Runtime Opacity Updates         | Dynamically update brush opacity                             |
| Runtime Friction Updates        | Dynamically update brush friction                            |
| Runtime Eraser Switching        | Toggle eraser mode during drawing                            |
| Canvas Clearing                 | Built-in canvas clearing support                             |
| Canvas Destruction Cleanup      | Automatic event listener cleanup                             |
| String or Element Canvas Input  | Accept canvas element or selector string                     |

---

## 🧪 Tested Features

| Test                                      | Status |
| ----------------------------------------- | ------ |
| Default brush initialization              | ✅     |
| Runtime radius updates                    | ✅     |
| Runtime size updates                      | ✅     |
| Friction-based updates                    | ✅     |
| Brush movement tracking                   | ✅     |
| Eraser mode switching                     | ✅     |
| Enable/disable behavior                   | ✅     |
| Brush size validation                     | ✅     |
| Constructor fallback values               | ✅     |
| Brush state preservation                  | ✅     |
| Interpolated point generation             | ✅     |
| Dynamic spacing calculations              | ✅     |
| Density compensation calculations         | ✅     |
| Density compensation toggles              | ✅     |
| Opacity compensation behavior             | ✅     |
| Custom spacing limit configuration        | ✅     |
| Canvas initialization                     | ✅     |
| Canvas default values                     | ✅     |
| Canvas custom values                      | ✅     |
| Runtime color updates                     | ✅     |
| Runtime opacity updates                   | ✅     |
| Runtime friction updates                  | ✅     |
| Runtime brush size updates                | ✅     |
| Runtime brush radius updates              | ✅     |
| Eraser enable/disable/toggle              | ✅     |
| Canvas clearing                           | ✅     |
| Canvas resize safety                      | ✅     |
| Canvas destruction cleanup                | ✅     |

---

## 🚧 Currently Experimental

These features exist but still need broader real-world validation:

| Feature                  | Status |
| ------------------------ | ------ |
| React integration        | 🚧     |
| Next.js integration      | 🚧     |
| Mobile/touch validation  | 🚧     |
| Safari compatibility     | 🚧     |
| Performance stress tests | 🚧     |

> The Canvas system currently works in:
>
> - Unit tests
> - Vanilla HTML/TypeScript environments
>
> React/Next.js production testing is still ongoing.

---

## 🚧 User Land (Still Fully Controlled by User)

Fuderu now includes a built-in canvas renderer, but users still fully control:

- Application UI
- Toolbar systems
- Color pickers
- Brush presets
- Undo/redo history
- Saving/exporting
- Layer systems
- Cursor rendering styles
- Custom compositing modes
- State persistence
- Multiplayer/collaboration systems
- Rendering pipelines
- Custom shaders/effects

---

## 🔮 Future Possibilities

### Core Features
- [ ] Pressure sensitivity support
- [ ] Velocity-based brush dynamics
- [ ] Brush stabilization improvements
- [ ] Built-in cursor visualization
- [ ] Stroke smoothing algorithms
- [ ] Stroke replay system
- [ ] Multi-pointer drawing support

### Brush System
- [ ] Multiple brush types (spray, calligraphy, watercolor)
- [ ] Brush texture support
- [ ] Pattern brushes
- [ ] Shape brushes
- [ ] Smudge brush support
- [ ] Wet paint simulation
- [ ] Grain/noise simulation
- [ ] Alpha accumulation modes

### Drawing Features
- [ ] Undo/redo stack
- [ ] Layer support
- [ ] Selection tools
- [ ] Shape tools
- [ ] Symmetry drawing
- [ ] Stroke recording/export
- [ ] SVG path generation
- [ ] Infinite canvas support

### Performance
- [ ] RequestAnimationFrame rendering helpers
- [ ] Performance optimizations for very large canvases
- [ ] WebWorker-based calculations
- [ ] Optimized touch rendering
- [ ] Spatial caching for interpolation
- [ ] Incremental redraw optimizations
- [ ] OffscreenCanvas support

### Developer Experience
- [ ] React bindings
- [ ] Vue bindings
- [ ] Svelte bindings
- [ ] SolidJS bindings
- [ ] Type-safe plugin system
- [ ] Preset brush configurations
- [ ] Devtools/debug overlay
- [ ] Interactive playground website
- [ ] Visual debugging helpers
- [ ] Documentation website
- [ ] Live examples gallery

---

## 🎯 Current Philosophy

Fuderu focuses on:

- Lightweight brush logic
- Framework-agnostic architecture
- User-controlled rendering pipelines
- Maximum customization
- Smooth and predictable brush movement
- Brush-engine utilities without framework lock-in
- High-performance drawing primitives
- Extensible canvas systems
- Minimal API surface
- Runtime configurability

---

## 📦 Current Internal Systems

The library currently provides systems for:

### Brush Engine
- Brush interpolation
- Density-aware spacing
- Opacity compensation
- Runtime brush state management
- Eraser state handling
- Lazy movement calculations
- Friction smoothing
- Adaptive brush spacing

### Canvas Engine
- Pointer event handling
- Canvas rendering
- DPI-aware scaling
- Stroke interpolation rendering
- Canvas clearing
- Resize preservation
- Automatic cleanup systems
- Runtime drawing configuration
- Canvas coordinate normalization

---

## 📌 Current State

Fuderu is currently evolving from:

> "A lazy brush utility"

into

> "A lightweight extensible drawing engine"

while still keeping the library:
- Lightweight
- Framework agnostic
- Runtime configurable
- Rendering focused
- Easy to integrate
- Fully TypeScript-first

---

*Legend: ✅ = Done | 🚧 = Experimental / Needs More Validation | 🔮 = Planned*
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

---

## 🚧 User Land (Not in Library)

These are intentionally handled by the user's implementation:

- Canvas rendering
- Event listeners
- Pointer/touch handling
- Color management
- Gradient generation
- Final opacity blending/compositing
- Coordinate scaling
- High-DPI canvas support
- Canvas compositing (`globalCompositeOperation`)
- Undo/redo
- Saving/exporting
- Cursor rendering
- Toolbar/UI systems

---

## 🔮 Future Possibilities

### Core Features
- [ ] Built-in canvas renderer
- [ ] Pressure sensitivity support
- [ ] Velocity-based brush dynamics
- [ ] Brush stabilization improvements
- [ ] Built-in cursor visualization
- [ ] Stroke smoothing algorithms
- [ ] Stroke replay system

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

### Performance
- [ ] RequestAnimationFrame rendering helpers
- [ ] Performance optimizations for large canvases
- [ ] WebWorker-based calculations
- [ ] Optimized touch rendering
- [ ] Spatial caching for interpolation
- [ ] Incremental redraw optimizations

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

---

## 🎯 Current Philosophy

Fuderu focuses on:

- Lightweight brush logic
- Framework-agnostic architecture
- User-controlled rendering
- Maximum customization
- Smooth and predictable brush movement
- Brush-engine utilities without rendering lock-in
- Keeping canvas rendering fully in user-land

---

## 📦 Current Internal Brush Utilities

The library currently provides helper systems for:

- Brush interpolation
- Density-aware spacing
- Opacity compensation
- Runtime brush state management
- Eraser state handling
- Lazy movement calculations
- Friction smoothing
- Adaptive brush spacing

---

*Legend: ✅ = Done | 🚧 = Needs Tests / In Progress | 🔮 = Planned*
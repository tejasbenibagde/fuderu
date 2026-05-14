# 🗺️ Fuderu Roadmap

## ✅ Currently Implemented

| Feature                   | Description                                     |
| ------------------------- | ----------------------------------------------- |
| Lazy Brush Effect         | Smooth delayed brush following                  |
| Configurable Radius       | Control how far brush trails behind             |
| Friction-Based Movement   | Optional smoothing during updates               |
| Brush Position Tracking   | Get brush and pointer coordinates               |
| Distance & Angle Tracking | Debug info for brush behavior                   |
| Enable/Disable            | Toggle lazy brush on/off                        |
| Runtime Radius Updates    | Update radius dynamically with `setRadius()`    |
| Dynamic Brush Size        | Runtime brush size updates                      |
| Eraser State              | Built-in eraser state management                |
| Flexible Input Support | Accepts coordinates from mouse, touch, or pointer events |


---

## 🧪 Tested Features

| Test                         | Status |
| ---------------------------- | ------ |
| Default brush initialization | ✅      |
| Runtime radius updates       | ✅      |
| Runtime size updates         | ✅      |
| Friction-based updates       | ✅      |
| Brush movement tracking      | ✅      |
| Eraser mode switching        | ✅      |
| Enable/disable behavior      | ✅      |


---

## 🚧 User Land (Not in Library)

These are intentionally handled by the user's implementation:

- Canvas rendering
- Event listeners
- Pointer/touch handling
- Color management
- Opacity handling
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

### Brush System
- [ ] Multiple brush types (spray, calligraphy, watercolor)
- [ ] Brush texture support
- [ ] Pattern brushes
- [ ] Shape brushes
- [ ] Smudge brush support

### Drawing Features
- [ ] Undo/redo stack
- [ ] Layer support
- [ ] Selection tools
- [ ] Shape tools
- [ ] Symmetry drawing

### Performance
- [ ] RequestAnimationFrame rendering helpers
- [ ] Performance optimizations for large canvases
- [ ] WebWorker-based calculations
- [ ] Optimized touch rendering

### Developer Experience
- [ ] React bindings
- [ ] Vue bindings
- [ ] Svelte bindings
- [ ] Type-safe plugin system
- [ ] Preset brush configurations
- [ ] Devtools/debug overlay

---

## 🎯 Current Philosophy

Fuderu focuses on:

- Lightweight brush logic
- Framework-agnostic architecture
- User-controlled rendering
- Maximum customization
- Smooth and predictable brush movement
- Keeping canvas rendering in user-land

---

*Legend: ✅ = Done | 🚧 = User responsibility | 🔮 = Planned*
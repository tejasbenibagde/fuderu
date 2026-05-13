# 🗺️ Fuderu Roadmap

## ✅ Currently Implemented

| Feature | Description |
|---------|-------------|
| Lazy Brush Effect | Smooth delayed brush following |
| Configurable Radius | Control how far brush trails behind |
| Configurable Friction | Adjust smoothness of movement |
| Brush Position Tracking | Get brush and pointer coordinates |
| Distance & Angle | Debug info for brush behavior |
| Enable/Disable | Toggle lazy brush on/off |
| **Eraser Mode** | Built-in eraser toggle (`enableEraser()`, `disableEraser()`, `toggleEraser()`, `isErasing()`) |

## 🚧 User Land (Not in Library)

These are handled by the user's implementation:

- Canvas rendering (`ctx.fill`, `ctx.stroke`)
- Event listeners (mouse/touch)
- Color picking UI
- Brush size UI
- Opacity handling (both drawing and eraser)
- Touch support
- Coordinate scaling
- Setting `ctx.globalCompositeOperation` based on `isErasing()` state

## 🔮 Future Possibilities

- [ ] Built-in canvas renderer
- [ ] Pressure sensitivity support
- [ ] Multiple brush types (spray, calligraphy, watercolor)
- [ ] Undo/redo stack
- [ ] Layer support
- [ ] Brush texture support

---

*Legend: ✅ = Done | 🚧 = User responsibility | 🔮 = Planned*
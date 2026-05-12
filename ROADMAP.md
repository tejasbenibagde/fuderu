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

## 🚧 User Land (Not in Library)

These are handled by the user's implementation:

- Canvas rendering (`ctx.fill`, `ctx.stroke`)
- Event listeners (mouse/touch)
- Color picking UI
- Brush size UI
- Opacity handling
- Touch support
- Coordinate scaling

## 🔮 Future Possibilities

- [ ] Built-in canvas renderer
- [ ] Pressure sensitivity support
- [ ] Multiple brush types
- [ ] Undo/redo stack
- [ ] Layer support

---

*Legend: ✅ = Done | 🚧 = User responsibility | 🔮 = Planned*
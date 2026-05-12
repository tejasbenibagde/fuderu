# 🖌️ Fuderu

[![npm version](https://img.shields.io/npm/v/fuderu.svg)](https://www.npmjs.com/package/fuderu)
[![npm downloads](https://img.shields.io/npm/dm/fuderu.svg)](https://www.npmjs.com/package/fuderu)
[![License](https://img.shields.io/npm/l/fuderu.svg)](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

A high-performance, lazy brush engine for canvas drawing. Built with TypeScript and Rust (WASM). Create smooth, natural brush strokes with configurable lazy radius and friction.

## ✨ Features

- 🎨 **Lazy Brush** – Smooth, delayed brush following for natural strokes
- ⚡ **Performance** – Rust-powered WASM core for heavy calculations
- 📱 **Cross-platform** – Works on desktop and mobile (touch support)
- 🎯 **Framework Agnostic** – Use with vanilla JS, React, Vue, or any framework
- 🔧 **Configurable** – Adjust radius, friction, opacity, and brush size

## 📦 Installation

```bash
npm install fuderu
```

```js
import Fuderu from 'fuderu'

const painter = new Fuderu({
  canvas: '#myCanvas',
  color: '#000000',
  size: 10
})

// Drawing controls
painter.setColor('#ff6b6b')
painter.setSize(15)
painter.setOpacity(0.8)
painter.clear()
```
## 📝 API

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `canvas` | `HTMLCanvasElement \| string` | required | Canvas element or selector |
| `color` | `string` | `#000000` | Initial brush color |
| `size` | `number` | `10` | Brush size in pixels |
| `opacity` | `number` | `1` | Brush opacity (0-1) |

### Methods

| Method | Description |
|--------|-------------|
| `setColor(color)` | Change brush color (hex, rgb, rgba) |
| `setSize(size)` | Set brush size in pixels |
| `setOpacity(opacity)` | Set opacity (0-1) |
| `setInvert(boolean)` | Enable eraser mode |
| `clear()` | Clear the entire canvas |
| `destroy()` | Remove event listeners and cleanup |

## 📄 License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.png">
    <img src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.png" alt="Fuderu" width="100%" style="border-radius: 16px; max-width: 100%;">
  </picture>
</p>

[![npm version](https://img.shields.io/npm/v/fuderu.svg)](https://www.npmjs.com/package/fuderu)
[![Last Month downloads](https://img.shields.io/npm/dm/fuderu?style=flat&label=Last%20Month%20Downloads)](https://www.npmjs.com/package/fuderu)
[![Total downloads](https://img.shields.io/npm/d18m/fuderu?style=flat&label=Total%20Downloads)](https://www.npmjs.com/package/fuderu)
[![License](https://img.shields.io/npm/l/fuderu.svg)](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

A high-performance, lazy brush engine for canvas drawing. Built with TypeScript and Rust (WASM). Create smooth, natural brush strokes with configurable lazy radius and friction.

## ✨ Features

- 🎨 **Lazy Brush** – Smooth, delayed brush following for natural strokes
- ⚡ **Performance** – Rust-powered WASM core for heavy calculations
- 📱 **Cross-platform** – Works on desktop and mobile (touch support)
- 🎯 **Framework Agnostic** – Use with vanilla JS, React, Vue, or any framework
- 🔧 **Configurable** – Adjust radius, friction, opacity, and brush size
- 🗑️ **Built-in Eraser Mode** – Toggle between drawing and erasing
- 📏 **Dynamic Brush Size** – Update brush size at runtime

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

// Eraser controls
painter.enableEraser()
painter.disableEraser()
painter.toggleEraser()

painter.clear()
```
## 📝 API

### Constructor Options
| Option         | Type      | Default          | Description                      |
| -------------- | --------- | ---------------- | -------------------------------- |
| `radius`       | `number`  | `30`             | Lazy brush radius                |
| `enabled`      | `boolean` | `true`           | Enable/disable lazy brush effect |
| `initialPoint` | `Point`   | `{ x: 0, y: 0 }` | Initial pointer/brush position   |
| `size`         | `number`  | `10`             | Brush size in pixels             |
| `eraser`       | `boolean` | `false`          | Start in eraser mode             |



### Methods

| Method                    | Description                                          |
| ------------------------- | ---------------------------------------------------- |
| `update(point, options?)` | Update pointer position and calculate brush movement |
| `enable()`                | Enable lazy brush effect                             |
| `disable()`               | Disable lazy brush effect                            |
| `isEnabled()`             | Check if lazy brush is enabled                       |
| `setRadius(radius)`       | Set lazy radius                                      |
| `getRadius()`             | Get current lazy radius                              |
| `setSize(size)`           | Set brush size                                       |
| `getSize()`               | Get current brush size                               |
| `getBrushCoordinates()`   | Get current brush coordinates                        |
| `getPointerCoordinates()` | Get current pointer coordinates                      |
| `getAngle()`              | Get angle between pointer and brush                  |
| `getDistance()`           | Get distance between pointer and brush               |
| `brushHasMoved()`         | Check if brush moved in last update                  |
| `enableEraser()`          | Enable eraser mode                                   |
| `disableEraser()`         | Disable eraser mode                                  |
| `toggleEraser()`          | Toggle eraser mode                                   |
| `isErasing()`             | Check if eraser mode is active                       |


## 📄 License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)
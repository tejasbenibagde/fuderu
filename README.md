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

A lightweight and extensible canvas drawing engine with lazy brush physics, interpolation, adaptive spacing, and built-in canvas rendering.

Built with TypeScript and designed for smooth, natural drawing experiences.

---

## ✨ Features

- 🎨 Lazy brush movement
- ⚡ Smooth brush interpolation
- 🖌️ Built-in canvas renderer
- 📏 Adaptive brush spacing
- 🌫️ Opacity compensation helpers
- 🗑️ Built-in eraser mode
- 📱 Pointer + touch support
- 🖥️ High-DPI canvas scaling
- 🔧 Runtime configurable brush settings
- 🎯 Framework agnostic
- 🧹 Automatic cleanup + resize handling

---

## 📦 Installation

```bash
npm install fuderu
```

---

## 🚀 Quick Start

```ts
import { Canvas } from 'fuderu'

const painter = new Canvas({
  canvas: '#canvas',
  color: '#000000',
  size: 10,
  radius: 30,
  opacity: 1
})

// Brush controls
painter.setColor('#ff6b6b')
painter.setSize(20)
painter.setRadius(50)
painter.setOpacity(0.7)

// Eraser
painter.enableEraser()

// Clear canvas
painter.clear()
```

---

## 📝 Canvas API

### Constructor Options

| Option      | Type                          | Default     |
| ------------| ----------------------------- | ------------|
| `canvas`    | `HTMLCanvasElement \| string` | Required    |
| `color`     | `string`                      | `#000000`   |
| `size`      | `number`                      | `10`        |
| `radius`    | `number`                      | `30`        |
| `friction`  | `number`                      | `0`         |
| `opacity`   | `number`                      | `1`         |
| `eraser`    | `boolean`                     | `false`     |

---

### Methods

| Method                  | Description                  |
| ----------------------- | ---------------------------- |
| `setColor(color)`       | Update brush color           |
| `getColor()`            | Get current color            |
| `setSize(size)`         | Update brush size            |
| `getSize()`             | Get current size             |
| `setRadius(radius)`     | Update lazy radius           |
| `getRadius()`           | Get current radius           |
| `setOpacity(opacity)`   | Update opacity               |
| `getOpacity()`          | Get current opacity          |
| `setFriction(value)`    | Update friction              |
| `getFriction()`         | Get current friction         |
| `enableEraser()`        | Enable eraser mode           |
| `disableEraser()`       | Disable eraser mode          |
| `toggleEraser()`        | Toggle eraser mode           |
| `isErasing()`           | Check eraser state           |
| `clear()`               | Clear the canvas             |
| `resize()`              | Recalculate DPI scaling      |
| `destroy()`             | Cleanup all event listeners  |

---

## 🧠 Brush Engine Utilities

Fuderu also exposes lower-level brush utilities:

- Brush interpolation
- Density compensation
- Adaptive spacing
- Lazy movement calculations
- Opacity compensation
- Brush state management

---

## 🧪 Current Status

Currently tested in:

- ✅ Vitest + jsdom
- ✅ Vanilla HTML/TypeScript
- ✅ React
- ✅ Next.js

---

## 📄 License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)
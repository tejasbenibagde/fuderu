<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.png">
    <img src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/fuderu.png" alt="Fuderu" width="100%">
  </picture>
</p>

<p align="center">
  Lightweight extensible drawing engine for the web.
</p>

<p align="center">
  Lazy brush physics • Interpolation • Adaptive spacing • Canvas rendering
</p>

---

[![npm version](https://img.shields.io/npm/v/fuderu.svg)](https://www.npmjs.com/package/fuderu)
[![Downloads](https://img.shields.io/npm/dm/fuderu?style=flat)](https://www.npmjs.com/package/fuderu)
[![License](https://img.shields.io/npm/l/fuderu.svg)](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

---

## ✨ Features

- 🎨 Lazy brush movement
- ⚡ Smooth interpolation engine
- 🖌️ Built-in canvas renderer
- 📏 Adaptive brush spacing
- 🌫️ Opacity compensation
- 🗑️ Eraser support
- 📱 Pointer + touch input
- 🖥️ High-DPI canvas scaling
- 🔧 Runtime brush configuration
- 🧠 Framework agnostic architecture
- 🧹 Automatic cleanup systems

---

## 📦 Installation

```bash
npm install fuderu
```

---

## 🚀 Quick Start

```ts
import { Canvas } from "fuderu";

const painter = new Canvas({
  canvas: "#canvas",
  brush: {
    color: "#000000",
    size: 10,
  },
});

// Runtime updates
painter.loadConfig({
  color: "#ff6b6b",
  size: 20,
});

painter.clear();
```

---

## 🧠 Philosophy

Fuderu focuses on:

- Lightweight rendering systems
- Smooth and predictable drawing
- Framework-agnostic APIs
- Runtime configurability
- Extensible brush architecture
- High-performance drawing primitives

---

## 🚧 Current Status

Fuderu is currently evolving rapidly before `v1.0.0`.

Minor releases may include breaking changes while:
- module APIs stabilize
- rendering pipelines evolve
- experimental systems mature

Currently tested in:

- ✅ Vitest + jsdom
- ✅ Vanilla TypeScript
- ✅ React
- ✅ Next.js

---

## 🔮 Planned

- Pressure sensitivity
- Brush modules
- Pattern brushes
- Dynamic shape systems
- Preset brushes
- OffscreenCanvas support
- Rust/WASM acceleration
- Framework bindings

---

## 📄 License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)
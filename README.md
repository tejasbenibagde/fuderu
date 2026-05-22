<table align="center">
<tr>
<td align="center">
  <img 
    src="https://raw.githubusercontent.com/tejasbenibagde/fuderu/main/public/icon.png" 
    alt="Fuderu Logo"
    width="80"
  />
</td>

<td align="left">
  <h1>Fuderu</12>
</td>
</tr>
</table>

<p align="center">
  Lightweight extensible drawing engine for the web.
</p>

<p align="center">
  interpolation • adaptive spacing • image brushes • modular rendering
</p>

---

[![npm version](https://img.shields.io/npm/v/fuderu.svg)](https://www.npmjs.com/package/fuderu)
[![Downloads](https://img.shields.io/npm/dm/fuderu?style=flat)](https://www.npmjs.com/package/fuderu)
[![License](https://img.shields.io/npm/l/fuderu.svg)](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)

---

# ✨ Features

- 🎨 Built-in canvas drawing engine
- ⚡ Smooth interpolation rendering
- 📏 Adaptive brush spacing
- 🖼️ Custom image-based brushes with path rotation
- 🌫️ Flow + opacity rendering
- 🧭 Brush angle + roundness support
- ↩️ Undo / Redo history
- 📱 Pointer + touch support
- 🖥️ High-DPI canvas rendering
- 🔧 Runtime brush configuration
- 🧩 Runtime module system
- 🧠 Framework-agnostic architecture
- 🧹 Automatic cleanup lifecycle

---

# 📦 Installation

```bash
npm install fuderu
```

---

# 🚀 Quick Start

```ts
import { Canvas } from "fuderu";

const painter = new Canvas({
  canvas: "#canvas",

  brush: {
    color: "#000000",
    size: 20,
    spacing: 0.5,
  },
});

// Runtime updates
painter.loadConfig({
  color: "#ff6b6b",
  size: 32,
});

// Undo / Redo
painter.undo();
painter.redo();

// Clear canvas
painter.clear();
```

---

# 🖼️ Image Brushes

```ts
await painter.loadImage(
  "/brushes/star.png"
);
```

Fuderu supports custom image-based brush stamps using transparent images with optional direction-aware rotation.

---

# 🧠 Philosophy

Fuderu focuses on:

- Lightweight rendering systems
- Predictable drawing behavior
- Framework-agnostic APIs
- Runtime configurability
- Extensible brush pipelines
- Performance-oriented rendering
- TypeScript-first architecture
- Direction-aware image brush rotation

---

# 🧱 Architecture

```txt
Canvas Layer
  ↓
Input Normalization
  ↓
Brush Engine
  ↓
Interpolation Engine
  ↓
Module Pipeline
  ↓
Stamp Generation
  ↓
Canvas Renderer
```

---

# 🚧 Current Status

Fuderu is currently evolving rapidly before `v1.0.0`.

Minor releases may include breaking changes while:

- rendering systems evolve
- module APIs stabilize
- experimental architecture matures

Currently tested in:

- ✅ Vanilla HTML/TypeScript
- ✅ React
- ✅ Next.js
- ✅ Vitest + jsdom

---

# 🔮 Planned

- Pressure-sensitive dynamics
- Velocity-based brush behavior
- Pattern + procedural brushes
- Dynamic brush modules
- Brush preset systems
- OffscreenCanvas support
- Worker-based rendering
- Rust/WASM acceleration
- Framework bindings

---

# 📄 License

[MIT](https://github.com/tejasbenibagde/fuderu/blob/main/LICENSE)
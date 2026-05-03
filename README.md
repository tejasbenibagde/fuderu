# 🖌️ Fuderu

High-performance canvas drawing library with Rust-powered brush engine.

> ⚠️ **Status:** Early development - API may change

## ✨ Features

- 🚀 **High Performance**: Rust-powered WASM brush engine for smooth drawing
- 🎨 **Multiple Brushes**: Dip Pen and Airbrush with different characteristics
- 🎯 **Precise Controls**: Color, size, opacity, and smoothing adjustments
- ✏️ **Draw & Erase**: Switch between drawing and erasing modes
- 📱 **Touch Support**: Works on both desktop and mobile devices
- 🔧 **TypeScript**: Full TypeScript support with type definitions

## 📦 Installation

```bash
npm install fuderu
```

Or use CDN:

```html
<script src="https://unpkg.com/fuderu@0.1.0/dist/index.umd.js"></script>
```

## 🚀 Quick Start

```js
import Fuderu from 'fuderu';

// Initialize on canvas element
const painter = new Fuderu({
  canvas: '#myCanvas',
  color: '#000000',
  size: 10,
  opacity: 1
});

// Start drawing!
```

```html
<canvas id="myCanvas" width="800" height="600"></canvas>
```

## 🎨 API Reference

### Constructor Options

```typescript
interface FuderuOptions {
  canvas: HTMLCanvasElement | string;  // Canvas element or selector
  brush?: string;                      // Initial brush type (default: 'dip-pen-soft')
  color?: string;                      // Initial color (default: '#000000')
  size?: number;                       // Initial brush size (default: 10)
  opacity?: number;                    // Initial opacity 0-1 (default: 1)
}
```

### Methods

#### Brush Control
```js
// Switch brush types
painter.useBrush('dip-pen-soft');    // Traditional pen-like strokes
painter.useBrush('airbrush-normal'); // Soft spray effect

// Adjust brush properties
painter.setColor('#ff0000');         // Set brush color
painter.setSize(20);                 // Set brush size (pixels)
painter.setOpacity(0.8);             // Set opacity (0-1)
painter.setSmoothing(0.5);           // Set stroke smoothing (0-1)
```

#### Drawing Modes
```js
// Switch between draw and erase
painter.setInvert(false);  // Draw mode
painter.setInvert(true);   // Erase mode

// Clear canvas
painter.clear();
```

#### Utility
```js
// Check if ready
console.log(painter.hello()); // "Fuderu is ready with Rust WASM! 🦀🖌️"

// Clean up event listeners
painter.destroy();
```

## 🎨 Available Brushes

### Dip Pen Soft (`dip-pen-soft`)
- Traditional pen-like strokes
- Good for precise drawing and writing
- Pressure-sensitive for natural feel

### Airbrush Normal (`airbrush-normal`)
- Soft spray effect
- Great for shading and gradients
- Creates smooth, blended strokes

## 📱 Usage Examples

### Basic Drawing Setup
```html
<!DOCTYPE html>
<html>
<head>
    <title>Fuderu Drawing App</title>
    <style>
        canvas { border: 1px solid #ccc; }
        .toolbar { margin: 10px 0; }
        button { margin: 0 5px; padding: 8px 16px; }
    </style>
</head>
<body>
    <canvas id="canvas" width="800" height="600"></canvas>

    <div class="toolbar">
        <button id="penBtn">🖊️ Pen</button>
        <button id="airbrushBtn">💨 Airbrush</button>
        <button id="eraseBtn">🗑️ Erase</button>
        <input type="color" id="colorPicker" value="#000000">
        <input type="range" id="sizeSlider" min="1" max="50" value="10">
        <input type="range" id="opacitySlider" min="0" max="1" step="0.01" value="1">
    </div>

    <script type="module">
        import Fuderu from 'fuderu';

        const painter = new Fuderu({
            canvas: '#canvas',
            color: '#000000',
            size: 10,
            opacity: 1
        });

        // Brush selection
        document.getElementById('penBtn').onclick = () => {
            painter.useBrush('dip-pen-soft');
            painter.setInvert(false);
        };

        document.getElementById('airbrushBtn').onclick = () => {
            painter.useBrush('airbrush-normal');
            painter.setInvert(false);
        };

        document.getElementById('eraseBtn').onclick = () => {
            painter.setInvert(true);
        };

        // Controls
        document.getElementById('colorPicker').oninput = (e) => {
            painter.setColor(e.target.value);
        };

        document.getElementById('sizeSlider').oninput = (e) => {
            painter.setSize(parseInt(e.target.value));
        };

        document.getElementById('opacitySlider').oninput = (e) => {
            painter.setOpacity(parseFloat(e.target.value));
        };
    </script>
</body>
</html>
```

### React Integration
```jsx
import React, { useEffect, useRef } from 'react';
import Fuderu from 'fuderu';

function DrawingCanvas() {
    const canvasRef = useRef(null);
    const painterRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            painterRef.current = new Fuderu({
                canvas: canvasRef.current,
                color: '#000000',
                size: 10
            });
        }

        return () => {
            if (painterRef.current) {
                painterRef.current.destroy();
            }
        };
    }, []);

    const switchBrush = (brushType) => {
        if (painterRef.current) {
            painterRef.current.useBrush(brushType);
        }
    };

    return (
        <div>
            <canvas ref={canvasRef} width={800} height={600} />
            <button onClick={() => switchBrush('dip-pen-soft')}>Pen</button>
            <button onClick={() => switchBrush('airbrush-normal')}>Airbrush</button>
        </div>
    );
}
```

## 🛠️ Development Setup

Clone and build locally:

```bash
# Clone repository
git clone https://github.com/yourusername/fuderu.git
cd fuderu

# Install dependencies
npm install

# Build the library
npm run build

# Start dev server
npm run dev
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests once (not in watch mode)
npm run test:run
```

The test suite includes basic functionality verification to ensure the library loads correctly and has the expected API.

## Known Issues

- **Opacity overlap**: When drawing with opacity < 100%, you may see darker spots where lines intersect within a single stroke. This will be improved in v0.2.0.

## Building Rust WASM Module
The brush engine is written in Rust. To rebuild the WASM module:

```bash
# Install wasm-pack (if not installed)
cargo install wasm-pack

# Build the WASM module
cd core
wasm-pack build --target web --out-dir pkg
cd ..
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the library (TypeScript + WASM) |
| `npm run dev` | Start development server |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |

## 🐛 Known Issues & Current Challenges

### High Priority
- **WASM Initialization Timing**: Fixed in recent updates, but async initialization can cause race conditions if drawing starts before WASM loads
- **Opacity Overlap Issues**: When drawing with opacity < 100%, darker spots appear where lines intersect within a single stroke. This affects brush realism and needs algorithmic improvements in the Rust brush engine

### Medium Priority
- **Limited Brush Variety**: Currently only 2 brushes (dip-pen-soft, airbrush-normal). Planning to add more brush types like pencils, markers, and textured brushes
- **Performance on Large Canvases**: Brush engine may slow down on very large canvases (>2000px). Need optimization in the WASM processing loop
- **Memory Usage**: WASM module retains some memory between strokes. Need to implement proper cleanup in the Rust side

### Low Priority
- **Touch Pressure Sensitivity**: Basic pressure support exists but could be improved for better tablet/stylus experience
- **Undo/Redo System**: No built-in history management yet
- **Export Functionality**: No built-in canvas export (PNG, SVG) features

### Development Challenges
- **API Stability**: Library is in early development, so APIs may change. Need to establish stable v1.0 API
- **Cross-platform Testing**: Limited testing on different browsers/devices. Need broader compatibility testing
- **Documentation**: API documentation needs to be more comprehensive with examples
- **Build System**: Complex build pipeline (TypeScript + Rust + WASM) can be fragile

## 🤝 Contributing

We welcome contributions! Please:

1. Check existing issues before creating new ones
2. Test your changes with `test.html`
3. Ensure TypeScript types are updated
4. Run tests before submitting PRs

### Development Workflow
1. Make changes to TypeScript in `src/`
2. Make changes to Rust in `core/src/`
3. Run `npm run build` to compile everything
4. Test with `npm run dev` and `test.html`

## 🔧 Requirements

- **Node.js**: 18+
- **Rust**: Latest stable (for WASM development)
- **wasm-pack**: For building WASM modules

## 📄 License

MIT © Fuderu

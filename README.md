# 🖌️ Fuderu

High-performance canvas drawing library with Rust-powered brush engine.

> ⚠️ **Status:** Early development - API may change

## 📦 Installation

```bash
npm install fuderu
```

Or use CDN:

```script
<script src="https://unpkg.com/fuderu@0.1.0/dist/index.umd.js"></script>
```

## 🚀 Quick Start

```js
import Fuderu from 'fuderu';

// Initialize on canvas element
const painter = new Fuderu({
  canvas: '#myCanvas'
});

// Test it works
console.log(painter.hello()); // "Fuderu is ready! 🖌️"
```

```html
<canvas id="myCanvas" width="800" height="600"></canvas>
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

## Building Rust WASM Module
The brush engine is written in Rust. To rebuild the WASM module:

```bash 
# Install wasm-pack (if not installed)
cargo install wasm-pack

# Build the module
cd core
wasm-pack build --target web --out-dir pkg
cd ..
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build the library |
| `npm run dev` | Start development server |
| `npm run preview` | Preview production build |
| `npm test` | Run tests |

## 🎨 Built-in Brushes (Coming Soon)


🔧 Requirements
Node.js 18+

Rust (for WASM development)

## 📄 License

MIT © Fuderu

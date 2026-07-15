# 🎮 Fuderu Playground

Welcome to the **fuderu** play area! This directory contains multiple isolated playground environments designed to test, benchmark, and showcase the library's drawing engine, modules, and layer systems across different web frameworks and environments.

These environments are perfect for library development, debugging features, or copy-pasting reference integrations into your own projects.

---

## 🚀 Quick Start

Before running any playground, ensure you have installed the repository-wide dependencies at the root:

```bash
# Install root dependencies
npm install
```

To run a specific playground, use one of the convenient scripts defined in the root `package.json`:

| Environment         | Command           | Description                                        |
| :------------------ | :---------------- | :------------------------------------------------- |
| **Vanilla JS/TS**   | `npm run vanilla` | Bare-metal HTML5 Canvas integration (Vite-powered) |
| **Next.js (React)** | `npm run next`    | Modern React integration with Next.js App Router   |
| **Vue 3**           | `npm run vue`     | Vue 3 composition API integration with Vite        |

---

## 📂 Playground Environments

### 1. Vanilla JS/TS Playground (`/playground/vanilla`)

This is the main, lightweight testing environment that operates closest to the metal. It uses a clean HTML layout with tailwind-like grid panels and a core JS/TS file to bind events directly to `fuderu` instances.

- **How it runs**: Starts a local Vite development server using `/playground/vanilla/index.html` as the entry point.
- **Key Features Tested**:
  - Bare-metal `Canvas` and `Brush` orchestration.
  - Multi-layer management panels (creation, duplication, opacity sliding, blending modes, drag and drop, deletion).
  - Custom brush configuration sliders (brush size, opacity, flow, spacing, roundness, angle).
  - Built-in modules like `DynamicShapeModule`, `DynamicTransparencyModule`, and `SpreadModule` mapping live slider inputs to active jitter, transparency, and scattering effects.
  - Custom local file uploading to serve as custom image brushes.
  - Precision coordinate and pressure logging (displaying coordinates and pressure variables in real time).

### 2. Next.js (React) Playground (`/playground/next-js`)

This environment demonstrates how to integrate `fuderu` inside a React-based application structure. It covers pointer capture, canvas lifecycle hooks, and rendering layers in a clean React component panel.

- **How it runs**: Runs a Next.js development server under `/playground/next-js`.
- **Key Features Tested**:
  - Wrapping `fuderu` inside React `useRef` and `useEffect` lifecycles.
  - Syncing library event structures with React states.
  - Multi-layer list states represented through React UI state updates.
  - Responsive layout containers designed for flexible desktop and tablet canvas styling.

### 3. Vue 3 Playground (`/playground/vue`)

This environment showcases how to integrate the drawing engine with Vue 3's reactive system (`ref`, `reactive`) and component patterns.

- **How it runs**: Runs a Vite-based Vue dev server under `/playground/vue`.
- **Key Features Tested**:
  - Vue composition API and lifecycle hooks (`onMounted`, `onUnmounted`) handling drawing canvas bindings.
  - Custom composables to manage brush configurations.
  - Direct reactive controls matching Vue form inputs to drawing properties.

---

## 🛠️ Testing Your Changes

When developing features in the `/src` directory of the library:

1. Make your changes to the library logic.
2. Build the library using:
   ```bash
   npm run build
   ```
3. Run any of the playgrounds above (e.g. `npm run vanilla` or `npm run vue`) to verify the new behaviors. Since the playgrounds are configured to link directly to your local built files or workspace dependencies, they will reflect your latest code immediately!

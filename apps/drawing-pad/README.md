# Fuderu Studio — Drawing Pad

A standalone React + Vite drawing pad application built directly on top of the published `fuderu` npm package (`^1.5.3`). Designed to run locally or deploy independently to Vercel without coupling to local engine source aliases.

## Features

- **Brush Engine**: Pressure-aware drawing, eraser mode, adaptive spacing, Bezier smoothing, rotation modes (`fixed`, `flow`, `random`), custom PNG/WebP brush tip uploads, and live `DynamicShapeModule`, `DynamicTransparencyModule`, and `SpreadModule` controls.
- **Layers & Composition**: Create, rename, reorder, duplicate, delete, toggle visibility, adjust opacity, switch all 16 Canvas2D blend modes, and toggle Alpha Lock or Layer Lock.
- **Shapes, Fill, Text & Sampling**: Draw rectangles (with corner radius), ellipses, lines, raster text, scanline flood fills, and composite color sampling.
- **Selection, Transform & Clipboard**: Rectangular, elliptical, and freehand lasso selections (`replace`, `add`, `subtract`, `intersect`), floating interactive transform handles (move, scale, rotate, flip), and cut/copy/paste across layers.
- **History, Replay & Persistence**: Undo/redo timeline, action-log replay animation, `.fuderu.json` project save/load, and flattened PNG export.

## Local Development

```bash
# From the repository root
npm install --prefix apps/drawing-pad
npm run drawing-pad
```

## Deploying Independently to Vercel

1. Import this repository in Vercel.
2. Set the **Root Directory** to `apps/drawing-pad`.
3. Vercel reads `apps/drawing-pad/vercel.json`, installs `fuderu` from npm (`npm install`), and runs `npm run build` outputting `dist/`.

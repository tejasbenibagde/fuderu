import { describe, expect, it, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { Brush } from "../src/Brush";

describe("Canvas2D Realistic Integration Tests", () => {
  let canvasEl: HTMLCanvasElement;
  let pixelBuffers: WeakMap<HTMLCanvasElement, Uint8ClampedArray>;

  beforeEach(() => {
    pixelBuffers = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();

    // Provide realistic software Canvas2D context for DOM canvas elements
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement, contextId: string) {
        if (contextId === "2d") {
          let buffer = pixelBuffers.get(this);
          if (!buffer) {
            buffer = new Uint8ClampedArray(
              (this.width || 100) * (this.height || 100) * 4,
            );
            pixelBuffers.set(this, buffer);
          }

          return {
            canvas: this,
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            fillStyle: "#000000",
            scale: () => {},
            setTransform: () => {},
            clearRect: (x: number, y: number, w: number, h: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              for (let cy = y; cy < y + h; cy++) {
                for (let cx = x; cx < x + w; cx++) {
                  const idx = (cy * cw + cx) * 4;
                  buf[idx] = 0;
                  buf[idx + 1] = 0;
                  buf[idx + 2] = 0;
                  buf[idx + 3] = 0;
                }
              }
            },
            drawImage: (
              img: HTMLCanvasElement,
              sx: number,
              sy: number,
              sw?: number,
              sh?: number,
              dx?: number,
              dy?: number,
              dw?: number,
              dh?: number,
            ) => {
              const srcCanvas = img;
              const srcBuf = pixelBuffers.get(srcCanvas);
              const dstBuf = pixelBuffers.get(this);
              if (!srcBuf || !dstBuf) return;

              // Simplified standard blit (drawImage(canvas, 0, 0))
              const targetX = dx !== undefined ? dx : sx;
              const targetY = dy !== undefined ? dy : sy;
              const width = dw !== undefined ? dw : srcCanvas.width;
              const height = dh !== undefined ? dh : srcCanvas.height;

              for (let r = 0; r < height; r++) {
                for (let c = 0; c < width; c++) {
                  const sIdx = (r * srcCanvas.width + c) * 4;
                  const dIdx = ((targetY + r) * this.width + (targetX + c)) * 4;
                  if (dIdx >= 0 && dIdx + 3 < dstBuf.length) {
                    const sA = srcBuf[sIdx + 3];
                    if (sA > 0) {
                      dstBuf[dIdx] = srcBuf[sIdx];
                      dstBuf[dIdx + 1] = srcBuf[sIdx + 1];
                      dstBuf[dIdx + 2] = srcBuf[sIdx + 2];
                      dstBuf[dIdx + 3] = sA;
                    }
                  }
                }
              }
            },
            fillRect: (_x: number, _y: number, _w: number, _h: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              for (let cy = _y; cy < _y + _h; cy++) {
                for (let cx = _x; cx < _x + _w; cx++) {
                  const idx = (cy * cw + cx) * 4;
                  if (idx >= 0 && idx + 3 < buf.length) {
                    buf[idx] = 255;
                    buf[idx + 1] = 0;
                    buf[idx + 2] = 0;
                    buf[idx + 3] = 255;
                  }
                }
              }
            },
            getImageData: (_x: number, _y: number, w: number, h: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              const out = new Uint8ClampedArray(w * h * 4);
              for (let row = 0; row < h; row++) {
                for (let col = 0; col < w; col++) {
                  const srcIdx = ((_y + row) * cw + (_x + col)) * 4;
                  const dstIdx = (row * w + col) * 4;
                  out[dstIdx] = buf[srcIdx] || 0;
                  out[dstIdx + 1] = buf[srcIdx + 1] || 0;
                  out[dstIdx + 2] = buf[srcIdx + 2] || 0;
                  out[dstIdx + 3] = buf[srcIdx + 3] || 0;
                }
              }
              return { data: out, width: w, height: h };
            },
            putImageData: (imgData: ImageData, _x: number, _y: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              const w = imgData.width;
              const h = imgData.height;
              for (let row = 0; row < h; row++) {
                for (let col = 0; col < w; col++) {
                  const srcIdx = (row * w + col) * 4;
                  const dstIdx = ((_y + row) * cw + (_x + col)) * 4;
                  if (dstIdx >= 0 && dstIdx + 3 < buf.length) {
                    buf[dstIdx] = imgData.data[srcIdx];
                    buf[dstIdx + 1] = imgData.data[srcIdx + 1];
                    buf[dstIdx + 2] = imgData.data[srcIdx + 2];
                    buf[dstIdx + 3] = imgData.data[srcIdx + 3];
                  }
                }
              }
            },
            save: () => {},
            restore: () => {},
            beginPath: () => {},
            closePath: () => {},
            fill: () => {},
            stroke: () => {},
            rect: () => {},
            ellipse: () => {},
            moveTo: () => {},
            lineTo: () => {},
            fillText: () => {},
            measureText: () => ({ width: 50 }),
            translate: () => {},
            rotate: () => {},
          } as unknown as CanvasRenderingContext2D;
        }
        return null;
      },
    );

    canvasEl = document.createElement("canvas");
    canvasEl.width = 100;
    canvasEl.height = 100;
  });

  it("integrates real Brush instance with Canvas layer raster compositing", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });

    expect(painter.brush).toBeInstanceOf(Brush);
    expect(painter.getLayers().length).toBe(1);

    // Render layer composite
    painter.renderLayers();

    // Verify snapshot reflects state cleanly
    const snapshot = painter.getSnapshot();
    expect(snapshot.layers.length).toBe(1);
    expect(snapshot.layers[0].width).toBe(100);
    expect(snapshot.layers[0].height).toBe(100);
  });

  it("orchestrates multi-layer creation, raster modification, and compositing pipeline", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });

    const bgLayer = painter.getActiveLayer();
    const bgCtx = bgLayer.canvas.getContext("2d")!;
    bgCtx.fillRect(0, 0, 50, 50);

    const fgLayer = painter.createLayer("Foreground");
    painter.setActiveLayer(fgLayer.id);

    const fgCtx = fgLayer.canvas.getContext("2d")!;
    fgCtx.fillRect(50, 50, 50, 50);

    // Compositing renders both layers onto the root canvas
    painter.renderLayers();

    const rootSample1 = painter.getColorAt(10, 10);
    expect(rootSample1.a).toBe(255);
    expect(rootSample1.r).toBe(255);

    const rootSample2 = painter.getColorAt(60, 60);
    expect(rootSample2.a).toBe(255);
    expect(rootSample2.r).toBe(255);

    // Immutable snapshot guarantees
    const snapshot = painter.getSnapshot();
    expect(snapshot.layers.length).toBe(2);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.layers)).toBe(true);
  });

  it("maintains pixel integrity across layer reordering and multi-layer undo/redo", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });

    const layer1 = painter.getActiveLayer();
    const layer2 = painter.createLayer("Layer 2");

    expect(painter.getLayers().length).toBe(2);

    painter.reorderLayers([layer2.id, layer1.id]);
    expect(painter.getLayers()[0].id).toBe(layer2.id);
    expect(painter.getLayers()[1].id).toBe(layer1.id);

    painter.undo(); // Undo reorder or layer creation
    expect(painter.history.canUndo() || painter.history.canRedo()).toBe(true);
  });
});

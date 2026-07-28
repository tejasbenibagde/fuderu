import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";

const pixelBuffers = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();

function getContextMock(this: HTMLCanvasElement, contextId: string) {
  if (contextId === "2d") {
    let buffer = pixelBuffers.get(this);
    if (!buffer) {
      buffer = new Uint8ClampedArray(
        (this.width || 100) * (this.height || 100) * 4,
      );
      pixelBuffers.set(this, buffer);
    }

    const ctx = {
      canvas: this,
      globalCompositeOperation: "source-over",
      globalAlpha: 1,
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      lineCap: "round",
      font: "10px sans-serif",
      textAlign: "left",
      textBaseline: "top",
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      setTransform: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      rect: vi.fn(),
      ellipse: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
      clearRect: vi.fn((x: number, y: number, w: number, h: number) => {
        const buf = pixelBuffers.get(this)!;
        const cw = this.width || 100;
        for (let cy = y; cy < y + h; cy++) {
          for (let cx = x; cx < x + w; cx++) {
            const idx = (cy * cw + cx) * 4;
            buf[idx] = 0;
            buf[idx + 1] = 0;
            buf[idx + 2] = 0;
            buf[idx + 3] = 0;
          }
        }
      }),
      drawImage: vi.fn(),
      getImageData: vi.fn((x: number, y: number, w: number, h: number) => {
        const buf = pixelBuffers.get(this)!;
        const cw = this.width || 100;
        const out = new Uint8ClampedArray(w * h * 4);
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const srcIdx = ((y + row) * cw + (x + col)) * 4;
            const dstIdx = (row * w + col) * 4;
            out[dstIdx] = buf[srcIdx] || 0;
            out[dstIdx + 1] = buf[srcIdx + 1] || 0;
            out[dstIdx + 2] = buf[srcIdx + 2] || 0;
            out[dstIdx + 3] = buf[srcIdx + 3] || 0;
          }
        }
        return { data: out, width: w, height: h };
      }),
      putImageData: vi.fn((imgData: ImageData, x: number, y: number) => {
        const buf = pixelBuffers.get(this)!;
        const cw = this.width || 100;
        const w = imgData.width;
        const h = imgData.height;
        for (let row = 0; row < h; row++) {
          for (let col = 0; col < w; col++) {
            const srcIdx = (row * w + col) * 4;
            const dstIdx = ((y + row) * cw + (x + col)) * 4;
            buf[dstIdx] = imgData.data[srcIdx];
            buf[dstIdx + 1] = imgData.data[srcIdx + 1];
            buf[dstIdx + 2] = imgData.data[srcIdx + 2];
            buf[dstIdx + 3] = imgData.data[srcIdx + 3];
          }
        }
      }),
      fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
        const buf = pixelBuffers.get(this)!;
        const cw = this.width || 100;
        // Parse fillStyle simple hex #ff0000 -> [255, 0, 0, 255]
        let r = 0;
        let g = 0;
        let b = 0;
        const a = 255;
        if (
          typeof ctx.fillStyle === "string" &&
          ctx.fillStyle.startsWith("#")
        ) {
          const hex = ctx.fillStyle.slice(1);
          if (hex.length === 6) {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
          }
        }

        const isSourceAtop = ctx.globalCompositeOperation === "source-atop";

        for (let cy = y; cy < y + h; cy++) {
          for (let cx = x; cx < x + w; cx++) {
            const idx = (cy * cw + cx) * 4;
            if (isSourceAtop && buf[idx + 3] === 0) {
              // Transparent pixel remains transparent under source-atop
              continue;
            }
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
          }
        }
      }),
    };
    return ctx;
  }
  return null;
}

describe("Advanced Layer Controls", () => {
  let domCanvas: HTMLCanvasElement;

  beforeAll(() => {
    HTMLCanvasElement.prototype.getContext =
      getContextMock as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  beforeEach(() => {
    domCanvas = document.createElement("canvas");
    domCanvas.width = 50;
    domCanvas.height = 50;
  });

  describe("Alpha Lock", () => {
    it("should initialize with alphaLock = false", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const layer = fuderu.getActiveLayer();
      expect(layer.alphaLock).toBe(false);
    });

    it("should restrict fillActiveLayer to existing opaque pixels when alphaLock is true", () => {
      const fuderu = new Canvas({
        canvas: domCanvas,
        document: { width: 10, height: 10 },
      });
      const layer = fuderu.getActiveLayer();

      // First draw a small 2x2 square at (0, 0)
      fuderu.drawRectangle({
        x: 0,
        y: 0,
        width: 2,
        height: 2,
        fillColor: "#ff0000",
      });
      const sampleCenterBefore = fuderu.getColorAt(1, 1, "activeLayer");
      const sampleOutsideBefore = fuderu.getColorAt(5, 5, "activeLayer");

      expect(sampleCenterBefore.hex).toBe("#ff0000");
      expect(sampleCenterBefore.a).toBe(255);
      expect(sampleOutsideBefore.a).toBe(0);

      // Enable alpha lock
      fuderu.updateLayer(layer.id, { alphaLock: true });
      expect(layer.alphaLock).toBe(true);

      // Fill entire layer with blue
      fuderu.fillActiveLayer("#0000ff");

      const sampleCenterAfter = fuderu.getColorAt(1, 1, "activeLayer");
      const sampleOutsideAfter = fuderu.getColorAt(5, 5, "activeLayer");

      // Center should now be blue
      expect(sampleCenterAfter.hex).toBe("#0000ff");
      // Outside should STILL be transparent
      expect(sampleOutsideAfter.a).toBe(0);
    });

    it("should prevent floodFill on transparent area when alphaLock is true", () => {
      const fuderu = new Canvas({
        canvas: domCanvas,
        document: { width: 10, height: 10 },
      });
      const layer = fuderu.getActiveLayer();
      fuderu.updateLayer(layer.id, { alphaLock: true });

      // Try to flood fill transparent background
      fuderu.floodFill(2, 2, "#00ff00");

      const sample = fuderu.getColorAt(2, 2, "activeLayer");
      expect(sample.a).toBe(0);
    });
  });

  describe("Layer Lock", () => {
    it("should initialize with locked = false", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const layer = fuderu.getActiveLayer();
      expect(layer.locked).toBe(false);
    });

    it("should prevent deletion of a locked layer", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const l2 = fuderu.createLayer("Layer 2");

      fuderu.updateLayer(l2.id, { locked: true });

      expect(() => fuderu.deleteLayer(l2.id)).toThrow(
        "Cannot delete locked layer",
      );
    });

    it("should block raster operations on a locked layer", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const layer = fuderu.getActiveLayer();
      fuderu.updateLayer(layer.id, { locked: true });

      expect(() => fuderu.clearActiveLayer()).toThrow("Active layer is locked");
      expect(() => fuderu.fillActiveLayer("#ffffff")).toThrow(
        "Active layer is locked",
      );
      expect(() => fuderu.floodFill(0, 0, "#ffffff")).toThrow(
        "Active layer is locked",
      );
      expect(() =>
        fuderu.drawRectangle({ x: 0, y: 0, width: 10, height: 10 }),
      ).toThrow("Active layer is locked");
      expect(() =>
        fuderu.drawEllipse({ x: 5, y: 5, radiusX: 2, radiusY: 2 }),
      ).toThrow("Active layer is locked");
      expect(() => fuderu.drawLine({ x1: 0, y1: 0, x2: 10, y2: 10 })).toThrow(
        "Active layer is locked",
      );
      expect(() => fuderu.drawText("Test", 0, 0)).toThrow(
        "Active layer is locked",
      );
    });

    it("should ignore pointer strokes when active layer is locked", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const layer = fuderu.getActiveLayer();
      fuderu.updateLayer(layer.id, { locked: true });

      // Simulate pointer down
      const pointerDownEvent = new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 10,
        clientY: 10,
      });
      domCanvas.dispatchEvent(pointerDownEvent);

      expect((fuderu as unknown as { isDrawing: boolean }).isDrawing).toBe(
        false,
      );
    });
  });

  describe("Direct Layer Methods", () => {
    it("should get all layers via getLayers()", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      fuderu.createLayer("Layer 2");
      fuderu.createLayer("Layer 3");

      const layers = fuderu.getLayers();
      expect(layers.length).toBe(3);
      expect(layers[0].name).toBe("Background");
      expect(layers[1].name).toBe("Layer 2");
      expect(layers[2].name).toBe("Layer 3");
    });

    it("should get layer by id via getLayerById()", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const l2 = fuderu.createLayer("Layer 2");

      const found = fuderu.getLayerById(l2.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe("Layer 2");

      const notFound = fuderu.getLayerById("non-existent-id");
      expect(notFound).toBeUndefined();
    });

    it("should reorder layers via reorderLayers()", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const bg = fuderu.getLayers()[0];
      const l2 = fuderu.createLayer("Layer 2");
      const l3 = fuderu.createLayer("Layer 3");

      // Initial order: bg, l2, l3
      expect(fuderu.getLayers().map((l) => l.id)).toEqual([
        bg.id,
        l2.id,
        l3.id,
      ]);

      // Reorder to: l3, bg, l2
      fuderu.reorderLayers([l3.id, bg.id, l2.id]);

      expect(fuderu.getLayers().map((l) => l.id)).toEqual([
        l3.id,
        bg.id,
        l2.id,
      ]);
    });
  });

  describe("Undo / Redo for Layer Properties", () => {
    it("should support undo/redo for alphaLock and locked property changes", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const layer = fuderu.getActiveLayer();

      expect(layer.alphaLock).toBe(false);
      expect(layer.locked).toBe(false);

      fuderu.updateLayer(layer.id, { alphaLock: true });
      expect(layer.alphaLock).toBe(true);

      fuderu.undo();
      expect(layer.alphaLock).toBe(false);

      fuderu.redo();
      expect(layer.alphaLock).toBe(true);

      fuderu.updateLayer(layer.id, { locked: true });
      expect(layer.locked).toBe(true);

      fuderu.undo();
      expect(layer.locked).toBe(false);

      fuderu.redo();
      expect(layer.locked).toBe(true);
    });
  });
});

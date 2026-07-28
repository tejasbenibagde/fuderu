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
      scale: vi.fn(),
      setTransform: vi.fn(),
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
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      ellipse: vi.fn(),
      rect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
        const buf = pixelBuffers.get(this)!;
        const cw = this.width || 100;
        let r = 0;
        let g = 0;
        let b = 0;
        const a = 255;
        const fs = ctx.fillStyle as string;
        if (fs === "#ff0000" || fs === "#f00") {
          r = 255;
        } else if (fs === "#00ff00" || fs === "#0f0") {
          g = 255;
        } else if (fs === "#0000ff" || fs === "#00f") {
          b = 255;
        } else if (fs === "#ffff00") {
          r = 255;
          g = 255;
        } else if (fs === "#00ffff") {
          g = 255;
          b = 255;
        } else if (fs === "#ff00ff") {
          r = 255;
          b = 255;
        }

        for (
          let cy = Math.max(0, Math.floor(y));
          cy < Math.min(this.height || 100, Math.floor(y + h));
          cy++
        ) {
          for (
            let cx = Math.max(0, Math.floor(x));
            cx < Math.min(cw, Math.floor(x + w));
            cx++
          ) {
            const idx = (cy * cw + cx) * 4;
            buf[idx] = r;
            buf[idx + 1] = g;
            buf[idx + 2] = b;
            buf[idx + 3] = a;
          }
        }
      }),
      fillText: vi.fn((_text: string, x: number, y: number) => {
        const buf = pixelBuffers.get(this)!;
        const cw = this.width || 100;
        const idx = (Math.floor(y) * cw + Math.floor(x)) * 4;
        buf[idx] = 100;
        buf[idx + 1] = 100;
        buf[idx + 2] = 100;
        buf[idx + 3] = 255;
      }),
      measureText: vi.fn(() => ({ width: 40 })),
      fillStyle: "#000000",
      strokeStyle: "#000000",
      lineWidth: 1,
      font: "10px sans-serif",
      textAlign: "left",
      textBaseline: "top",
      globalAlpha: 1,
      globalCompositeOperation: "source-over",
    };
    return ctx as unknown as CanvasRenderingContext2D;
  }
  return null;
}

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    getContextMock,
  );
});

describe("Native Commands for Raster Operations", () => {
  let canvasEl: HTMLCanvasElement;
  let canvas: Canvas;

  beforeEach(() => {
    canvasEl = document.createElement("canvas");
    canvasEl.width = 100;
    canvasEl.height = 100;
    document.body.appendChild(canvasEl);

    canvas = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });
  });

  it("should clear active layer using clearActiveLayer()", () => {
    canvas.fillActiveLayer("#ff0000");
    let color = canvas.getColorAt(10, 10, "activeLayer");
    expect(color.hex).toBe("#ff0000");

    canvas.clearActiveLayer();
    color = canvas.getColorAt(10, 10, "activeLayer");
    expect(color.a).toBe(0);
    expect(canvas.history.canUndo()).toBe(true);
  });

  it("should fill active layer with fillActiveLayer(color)", () => {
    canvas.fillActiveLayer("#00ff00");
    const color = canvas.getColorAt(50, 50, "activeLayer");
    expect(color.hex).toBe("#00ff00");
    expect(color.a).toBe(255);

    const entries = canvas.history.getEntries();
    expect(entries[entries.length - 1].description).toContain("Fill layer");
  });

  it("should sample colors with getColorAt(x, y, scope)", () => {
    canvas.fillActiveLayer("#0000ff");
    const sampleActive = canvas.getColorAt(20, 20, "activeLayer");
    expect(sampleActive.hex).toBe("#0000ff");
    expect(sampleActive.r).toBe(0);
    expect(sampleActive.g).toBe(0);
    expect(sampleActive.b).toBe(255);
    expect(sampleActive.rgba).toContain("rgba(0, 0, 255");
  });

  it("should perform bucket fill with floodFill(x, y, color, tolerance)", () => {
    canvas.drawRectangle({
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      fillColor: "#ff0000",
      fill: true,
      stroke: false,
    });

    let sample = canvas.getColorAt(20, 20, "activeLayer");
    expect(sample.hex).toBe("#ff0000");

    canvas.floodFill(20, 20, "#ffff00");
    sample = canvas.getColorAt(20, 20, "activeLayer");
    expect(sample.hex).toBe("#ffff00");

    // Outside rectangle should remain transparent
    const outsideSample = canvas.getColorAt(5, 5, "activeLayer");
    expect(outsideSample.a).toBe(0);

    // Should push patch to history
    expect(canvas.history.canUndo()).toBe(true);
    canvas.undo();
    sample = canvas.getColorAt(20, 20, "activeLayer");
    expect(sample.hex).toBe("#ff0000");
  });

  it("should draw rectangle with drawRectangle(options)", () => {
    canvas.drawRectangle({
      x: 5,
      y: 5,
      width: 30,
      height: 30,
      fillColor: "#00ffff",
      strokeColor: "#000000",
      strokeWidth: 2,
    });

    const sampleCenter = canvas.getColorAt(15, 15, "activeLayer");
    expect(sampleCenter.hex).toBe("#00ffff");

    expect(canvas.history.canUndo()).toBe(true);
  });

  it("should draw ellipse with drawEllipse(options)", () => {
    canvas.drawEllipse({
      x: 50,
      y: 50,
      radiusX: 20,
      radiusY: 20,
      fillColor: "#ff00ff",
    });

    expect(canvas.history.canUndo()).toBe(true);
  });

  it("should draw line with drawLine(options)", () => {
    canvas.drawLine({
      x1: 10,
      y1: 10,
      x2: 90,
      y2: 10,
      strokeColor: "#123456",
      strokeWidth: 4,
    });

    expect(canvas.history.canUndo()).toBe(true);
  });

  it("should rasterize text with drawText(text, x, y, style)", () => {
    canvas.drawText("Test", 10, 10, {
      fontSize: 20,
      color: "#000000",
    });

    expect(canvas.history.canUndo()).toBe(true);
    const entries = canvas.history.getEntries();
    expect(entries[entries.length - 1].description).toContain(
      'Draw text "Test"',
    );
  });
});

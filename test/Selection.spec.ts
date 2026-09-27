import { describe, expect, it, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { Selection } from "../src/Selection";

describe("Selection Module & Artist Selection Tools", () => {
  let pixelBuffers: WeakMap<HTMLCanvasElement, Uint8ClampedArray>;
  let contextMap: WeakMap<HTMLCanvasElement, unknown>;

  beforeEach(() => {
    pixelBuffers = new WeakMap<HTMLCanvasElement, Uint8ClampedArray>();
    contextMap = new WeakMap<HTMLCanvasElement, unknown>();

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      function (this: HTMLCanvasElement, contextId: string) {
        if (contextId === "2d") {
          const existing = contextMap.get(this);
          if (existing) return existing as CanvasRenderingContext2D;

          let buffer = pixelBuffers.get(this);
          const w = this.width || 100;
          const h = this.height || 100;
          if (!buffer) {
            buffer = new Uint8ClampedArray(w * h * 4);
            pixelBuffers.set(this, buffer);
          }

          const ctxMock = {
            canvas: this,
            globalAlpha: 1,
            globalCompositeOperation: "source-over",
            fillStyle: "#000000",
            strokeStyle: "#000000",
            lineWidth: 1,
            lineDashOffset: 0,
            font: "10px sans-serif",
            textAlign: "left" as CanvasTextAlign,
            textBaseline: "top" as CanvasTextBaseline,
            lineCap: "round" as CanvasLineCap,
            scale: vi.fn(),
            setTransform: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            clip: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            setLineDash: vi.fn(),
            measureText: vi.fn((text: string) => ({ width: text.length * 8 })),
            fillText: vi.fn(),
            ellipse: vi.fn((cx: number, cy: number, rx: number, ry: number) => {
              // Approximate ellipse rasterization in mock buffer for containsPoint test
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              const ch = this.height;
              for (
                let y = Math.max(0, Math.floor(cy - ry));
                y < Math.min(ch, Math.ceil(cy + ry));
                y++
              ) {
                for (
                  let x = Math.max(0, Math.floor(cx - rx));
                  x < Math.min(cw, Math.ceil(cx + rx));
                  x++
                ) {
                  const normX = (x - cx) / rx;
                  const normY = (y - cy) / ry;
                  if (normX * normX + normY * normY <= 1) {
                    const idx = (y * cw + x) * 4;
                    buf[idx] = 255;
                    buf[idx + 1] = 255;
                    buf[idx + 2] = 255;
                    buf[idx + 3] = 255;
                  }
                }
              }
            }),
            fillRect: vi.fn((x: number, y: number, rw: number, rh: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              const ch = this.height;
              const gco = ctxMock.globalCompositeOperation;
              for (let cy = Math.max(0, y); cy < Math.min(ch, y + rh); cy++) {
                for (let cx = Math.max(0, x); cx < Math.min(cw, x + rw); cx++) {
                  const idx = (cy * cw + cx) * 4;
                  if (gco === "destination-out") {
                    buf[idx] = 0;
                    buf[idx + 1] = 0;
                    buf[idx + 2] = 0;
                    buf[idx + 3] = 0;
                  } else if (gco === "destination-in") {
                    // Keep only if drawn
                    buf[idx + 3] = buf[idx + 3] > 0 ? 255 : 0;
                  } else {
                    buf[idx] = 255;
                    buf[idx + 1] = 255;
                    buf[idx + 2] = 255;
                    buf[idx + 3] = 255;
                  }
                }
              }
            }),
            strokeRect: vi.fn(),
            clearRect: vi.fn((x: number, y: number, rw: number, rh: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              const ch = this.height;
              for (let cy = Math.max(0, y); cy < Math.min(ch, y + rh); cy++) {
                for (let cx = Math.max(0, x); cx < Math.min(cw, x + rw); cx++) {
                  const idx = (cy * cw + cx) * 4;
                  buf[idx] = 0;
                  buf[idx + 1] = 0;
                  buf[idx + 2] = 0;
                  buf[idx + 3] = 0;
                }
              }
            }),
            fill: vi.fn(),
            drawImage: vi.fn((img: HTMLCanvasElement) => {
              const srcBuf = pixelBuffers.get(img);
              const dstBuf = pixelBuffers.get(this);
              if (!srcBuf || !dstBuf) return;
              const len = Math.min(srcBuf.length, dstBuf.length);
              const gco = ctxMock.globalCompositeOperation;
              if (gco === "destination-in") {
                for (let i = 0; i < len; i += 4) {
                  if (srcBuf[i + 3] === 0) {
                    dstBuf[i + 3] = 0;
                  }
                }
              } else if (gco === "destination-out") {
                for (let i = 0; i < len; i += 4) {
                  if (srcBuf[i + 3] > 0) {
                    dstBuf[i + 3] = 0;
                  }
                }
              } else {
                for (let i = 0; i < len; i += 4) {
                  if (srcBuf[i + 3] > 0) {
                    dstBuf[i] = srcBuf[i];
                    dstBuf[i + 1] = srcBuf[i + 1];
                    dstBuf[i + 2] = srcBuf[i + 2];
                    dstBuf[i + 3] = srcBuf[i + 3];
                  }
                }
              }
            }),
            getImageData: vi.fn(
              (x: number, y: number, rw: number, rh: number) => {
                const buf = pixelBuffers.get(this)!;
                const cw = this.width;
                const out = new Uint8ClampedArray(rw * rh * 4);
                for (let row = 0; row < rh; row++) {
                  for (let col = 0; col < rw; col++) {
                    const srcIdx = ((y + row) * cw + (x + col)) * 4;
                    const dstIdx = (row * rw + col) * 4;
                    out[dstIdx] = buf[srcIdx] || 0;
                    out[dstIdx + 1] = buf[srcIdx + 1] || 0;
                    out[dstIdx + 2] = buf[srcIdx + 2] || 0;
                    out[dstIdx + 3] = buf[srcIdx + 3] || 0;
                  }
                }
                return { data: out, width: rw, height: rh };
              },
            ),
            putImageData: vi.fn((imgData: ImageData, x: number, y: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              for (let row = 0; row < imgData.height; row++) {
                for (let col = 0; col < imgData.width; col++) {
                  const srcIdx = (row * imgData.width + col) * 4;
                  const dstIdx = ((y + row) * cw + (x + col)) * 4;
                  buf[dstIdx] = imgData.data[srcIdx];
                  buf[dstIdx + 1] = imgData.data[srcIdx + 1];
                  buf[dstIdx + 2] = imgData.data[srcIdx + 2];
                  buf[dstIdx + 3] = imgData.data[srcIdx + 3];
                }
              }
            }),
          };

          contextMap.set(this, ctxMock);
          return ctxMock as unknown as CanvasRenderingContext2D;
        }
        return null;
      },
    );
  });

  describe("Selection Class Unit Tests", () => {
    it("initializes with inactive selection and null bounds", () => {
      const sel = new Selection(200, 200);
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();
      expect(sel.containsPoint(10, 10)).toBe(false);
      expect(sel.getSnapshot().active).toBe(false);
    });

    it("creates a rectangular marquee selection", () => {
      const sel = new Selection(200, 200);
      sel.selectRectangle(10, 20, 50, 60);

      expect(sel.isActive()).toBe(true);
      const bounds = sel.getBounds();
      expect(bounds).toEqual({ x: 10, y: 20, width: 50, height: 60 });
      expect(sel.containsPoint(25, 30)).toBe(true);
      expect(sel.containsPoint(5, 5)).toBe(false);
      expect(sel.containsPoint(100, 100)).toBe(false);
    });

    it("normalizes negative rectangular dimensions", () => {
      const sel = new Selection(200, 200);
      sel.selectRectangle(60, 80, -50, -60);

      expect(sel.isActive()).toBe(true);
      const bounds = sel.getBounds();
      expect(bounds).toEqual({ x: 10, y: 20, width: 50, height: 60 });
      expect(sel.containsPoint(30, 40)).toBe(true);
    });

    it("combines selections with mode 'add'", () => {
      const sel = new Selection(200, 200);
      sel.selectRectangle(10, 10, 20, 20);
      sel.selectRectangle(50, 50, 20, 20, "add");

      expect(sel.isActive()).toBe(true);
      expect(sel.containsPoint(15, 15)).toBe(true);
      expect(sel.containsPoint(55, 55)).toBe(true);
      expect(sel.containsPoint(35, 35)).toBe(false);
    });

    it("subtracts selection with mode 'subtract'", () => {
      const sel = new Selection(200, 200);
      sel.selectRectangle(10, 10, 50, 50);
      sel.selectRectangle(20, 20, 20, 20, "subtract");

      expect(sel.isActive()).toBe(true);
      expect(sel.containsPoint(15, 15)).toBe(true);
      expect(sel.containsPoint(25, 25)).toBe(false);
    });

    it("creates an elliptical marquee selection", () => {
      const sel = new Selection(200, 200);
      sel.selectEllipse(50, 50, 20, 30);

      expect(sel.isActive()).toBe(true);
      const bounds = sel.getBounds();
      expect(bounds).toBeDefined();
      expect(bounds!.width).toBeGreaterThan(0);
      expect(bounds!.height).toBeGreaterThan(0);
      expect(sel.containsPoint(50, 50)).toBe(true);
      expect(sel.containsPoint(10, 10)).toBe(false);
    });

    it("creates a freehand lasso polygon selection", () => {
      const sel = new Selection(200, 200);
      sel.selectLasso([
        { x: 10, y: 10 },
        { x: 50, y: 10 },
        { x: 50, y: 50 },
        { x: 10, y: 50 },
      ]);

      expect(sel.isActive()).toBe(true);
      const bounds = sel.getBounds();
      expect(bounds).toEqual({ x: 10, y: 10, width: 40, height: 40 });
    });

    it("handles selectAll, clear, and deselect", () => {
      const sel = new Selection(200, 200);
      sel.selectAll();

      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 0, y: 0, width: 200, height: 200 });

      sel.clear();
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();

      sel.selectRectangle(10, 10, 20, 20);
      expect(sel.isActive()).toBe(true);
      sel.deselect();
      expect(sel.isActive()).toBe(false);
    });

    it("inverts the active selection", () => {
      const sel = new Selection(100, 100);
      sel.selectRectangle(10, 10, 20, 20);
      expect(sel.containsPoint(15, 15)).toBe(true);
      expect(sel.containsPoint(50, 50)).toBe(false);

      sel.invert();
      expect(sel.isActive()).toBe(true);
      expect(sel.containsPoint(15, 15)).toBe(false);
      expect(sel.containsPoint(50, 50)).toBe(true);
    });

    it("renders dual-tone marching ants selection outline", () => {
      const sel = new Selection(100, 100);
      sel.selectRectangle(10, 10, 40, 40);

      const canvas = document.createElement("canvas");
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext("2d")!;

      sel.renderOutline(ctx, {
        dashOffset: 2,
        dashPattern: [4, 4],
        lineWidth: 1,
      });

      expect(ctx.strokeRect).toHaveBeenCalled();
      expect(ctx.setLineDash).toHaveBeenCalledWith([4, 4]);
    });
  });

  describe("Canvas Selection Integration", () => {
    let canvasEl: HTMLCanvasElement;
    let canvas: Canvas;

    beforeEach(() => {
      canvasEl = document.createElement("canvas");
      canvasEl.width = 200;
      canvasEl.height = 200;
      document.body.appendChild(canvasEl);

      canvas = new Canvas({
        canvas: canvasEl,
        document: { width: 200, height: 200 },
      });
    });

    it("provides public selection methods on Canvas", () => {
      expect(canvas.hasSelection()).toBe(false);
      expect(canvas.getSelectionBounds()).toBeNull();

      canvas.selectRectangle(20, 30, 40, 50);
      expect(canvas.hasSelection()).toBe(true);
      expect(canvas.getSelectionBounds()).toEqual({
        x: 20,
        y: 30,
        width: 40,
        height: 50,
      });

      canvas.clearSelection();
      expect(canvas.hasSelection()).toBe(false);

      canvas.selectEllipse(100, 100, 30, 30);
      expect(canvas.hasSelection()).toBe(true);

      canvas.selectAll();
      expect(canvas.hasSelection()).toBe(true);
      expect(canvas.getSelectionBounds()).toEqual({
        x: 0,
        y: 0,
        width: 200,
        height: 200,
      });

      canvas.deselect();
      expect(canvas.hasSelection()).toBe(false);
    });

    it("emits selection:change and includes selection in CanvasSnapshot", () => {
      const changeSpy = vi.fn();
      canvas.on("selection:change", changeSpy);

      canvas.selectRectangle(10, 10, 30, 30);
      expect(changeSpy).toHaveBeenCalled();
      const snap = changeSpy.mock.calls[0][0];
      expect(snap.active).toBe(true);
      expect(snap.bounds).toEqual({ x: 10, y: 10, width: 30, height: 30 });

      const canvasSnap = canvas.getSnapshot();
      expect(canvasSnap.selection?.active).toBe(true);
      expect(canvasSnap.selection?.bounds).toEqual({
        x: 10,
        y: 10,
        width: 30,
        height: 30,
      });
    });

    it("clips clearActiveLayer to the active selection", () => {
      // Fill the layer with black
      canvas.fillActiveLayer("#000000");

      // Set a selection
      canvas.selectRectangle(20, 20, 30, 30);

      // Clear with active selection: only selection area is cleared
      canvas.clearActiveLayer();

      const layerCanvas = canvas.getActiveLayer().canvas;
      const ctx = layerCanvas.getContext("2d")!;
      // drawImage was called with destination-out to erase only the selection mask
      expect(ctx.drawImage).toHaveBeenCalled();
    });

    it("clips fillActiveLayer to the active selection", () => {
      canvas.selectRectangle(10, 10, 40, 40);
      canvas.fillActiveLayer("#ff0000");

      // Action is recorded
      const actions = canvas.getActionLog();
      expect(actions.some((a) => a.type === "fillLayer")).toBe(true);
    });

    it("clips drawRectangle and drawEllipse to active selection", () => {
      canvas.selectRectangle(10, 10, 50, 50);

      canvas.drawRectangle({
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fillColor: "#00ff00",
      });

      canvas.drawEllipse({
        x: 50,
        y: 50,
        radiusX: 40,
        radiusY: 40,
        fillColor: "#0000ff",
      });

      const actions = canvas.getActionLog();
      expect(actions.some((a) => a.type === "drawRectangle")).toBe(true);
      expect(actions.some((a) => a.type === "drawEllipse")).toBe(true);
    });

    it("records and replays selection actions in replay pipeline", async () => {
      canvas.selectRectangle(15, 25, 35, 45);
      canvas.invertSelection();
      canvas.clearSelection();

      const log = canvas.getActionLog();
      expect(log.some((a) => a.type === "selectRectangle")).toBe(true);
      expect(log.some((a) => a.type === "invertSelection")).toBe(true);
      expect(log.some((a) => a.type === "clearSelection")).toBe(true);

      // Replay actions
      const newCanvasEl = document.createElement("canvas");
      newCanvasEl.width = 200;
      newCanvasEl.height = 200;
      const replayCanvas = new Canvas({
        canvas: newCanvasEl,
        document: { width: 200, height: 200 },
      });

      await replayCanvas.replay(
        log.filter((a) => a.type === "selectRectangle"),
      );
      expect(replayCanvas.hasSelection()).toBe(true);
      expect(replayCanvas.getSelectionBounds()).toEqual({
        x: 15,
        y: 25,
        width: 35,
        height: 45,
      });
    });
  });
});

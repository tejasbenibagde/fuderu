import { describe, expect, it, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { ClipboardStore } from "../src/Clipboard";
import type { ClipboardData } from "../src/types/clipboard";

describe("Clipboard Pipeline (Cut, Copy, Paste across Layers and Documents)", () => {
  let pixelBuffers: WeakMap<HTMLCanvasElement, Uint8ClampedArray>;
  let contextMap: WeakMap<HTMLCanvasElement, unknown>;

  beforeEach(() => {
    ClipboardStore.clear();

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
            scale: vi.fn(),
            translate: vi.fn(),
            rotate: vi.fn(),
            setTransform: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            beginPath: vi.fn(),
            closePath: vi.fn(),
            arc: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            fillRect: vi.fn((x: number, y: number, rw: number, rh: number) => {
              const buf = pixelBuffers.get(this)!;
              const cw = this.width;
              const ch = this.height;
              for (let cy = Math.max(0, y); cy < Math.min(ch, y + rh); cy++) {
                for (let cx = Math.max(0, x); cx < Math.min(cw, x + rw); cx++) {
                  const idx = (cy * cw + cx) * 4;
                  buf[idx] = 255;
                  buf[idx + 1] = 0;
                  buf[idx + 2] = 0;
                  buf[idx + 3] = 255;
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
            drawImage: vi.fn(),
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

  describe("ClipboardStore Unit Tests", () => {
    it("manages clipboard lifecycle and notifies subscribers", () => {
      expect(ClipboardStore.has()).toBe(false);
      expect(ClipboardStore.get()).toBeNull();

      const subscriber = vi.fn();
      const unsubscribe = ClipboardStore.subscribe(subscriber);

      const fakeData: ClipboardData = {
        width: 50,
        height: 50,
        x: 10,
        y: 10,
        imageData: {
          data: new Uint8ClampedArray(50 * 50 * 4),
          width: 50,
          height: 50,
        } as ImageData,
        timestamp: Date.now(),
      };

      ClipboardStore.set(fakeData);
      expect(ClipboardStore.has()).toBe(true);
      expect(ClipboardStore.get()?.width).toBe(50);
      expect(subscriber).toHaveBeenCalledTimes(1);

      const snap = ClipboardStore.getSnapshot();
      expect(snap.hasData).toBe(true);
      expect(snap.width).toBe(50);

      ClipboardStore.clear();
      expect(ClipboardStore.has()).toBe(false);
      expect(ClipboardStore.get()).toBeNull();
      expect(subscriber).toHaveBeenCalledTimes(2);

      unsubscribe();
      ClipboardStore.set(fakeData);
      expect(subscriber).toHaveBeenCalledTimes(2); // no new calls after unsubscribe
    });
  });

  describe("Canvas Copy & Cut Operations", () => {
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

    it("copies active selection from layer", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      // Fill a red square
      ctx.fillRect(20, 20, 60, 60);

      canvas.selectRectangle(25, 25, 40, 40);

      const copySpy = vi.fn();
      canvas.on("clipboard:copy", copySpy);

      const clipboardData = canvas.copy();
      expect(clipboardData).not.toBeNull();
      expect(clipboardData?.width).toBe(40);
      expect(clipboardData?.height).toBe(40);
      expect(clipboardData?.x).toBe(25);
      expect(clipboardData?.y).toBe(25);
      expect(copySpy).toHaveBeenCalledWith(clipboardData);

      // Verify action logged
      const actions = canvas.getActionLog();
      expect(actions.some((a) => a.type === "copy")).toBe(true);
    });

    it("copies active layer non-empty bounds when no selection is present", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(15, 30, 70, 50);

      const clipboardData = canvas.copy();
      expect(clipboardData).not.toBeNull();
      expect(clipboardData?.x).toBe(15);
      expect(clipboardData?.y).toBe(30);
      expect(clipboardData?.width).toBe(70);
      expect(clipboardData?.height).toBe(50);
    });

    it("returns null when copying an entirely blank layer without selection", () => {
      const clipboardData = canvas.copy();
      expect(clipboardData).toBeNull();
      expect(canvas.hasClipboard()).toBe(false);
    });

    it("cuts active selection, clears layer region, and pushes undoable history patch", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(10, 10, 80, 80);

      canvas.selectRectangle(20, 20, 40, 40);

      const cutSpy = vi.fn();
      canvas.on("clipboard:cut", cutSpy);

      const data = canvas.cut();
      expect(data).not.toBeNull();
      expect(data?.width).toBe(40);
      expect(data?.height).toBe(40);
      expect(cutSpy).toHaveBeenCalledWith(data);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();

      // Check history state
      const snap = canvas.getSnapshot();
      expect(snap.history.canUndo).toBe(true);

      // Undo cut
      canvas.undo();
      expect(ctx.putImageData).toHaveBeenCalled();

      // Redo cut
      canvas.redo();
      expect(ctx.putImageData).toHaveBeenCalled();
    });

    it("throws error when attempting to cut from a locked layer", () => {
      const activeLayer = canvas.getActiveLayer();
      canvas.updateLayer(activeLayer.id, { locked: true });

      expect(() => {
        canvas.cut();
      }).toThrow(/locked/i);
    });
  });

  describe("Canvas Paste Operations", () => {
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

    it("pastes clipboard content onto active layer at original coordinates", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(10, 10, 50, 50);

      canvas.selectRectangle(10, 10, 50, 50);
      canvas.copy();

      const pasteSpy = vi.fn();
      canvas.on("clipboard:paste", pasteSpy);

      const res = canvas.paste();
      expect(res).not.toBeNull();
      expect(res?.x).toBe(10);
      expect(res?.y).toBe(10);
      expect(res?.width).toBe(50);
      expect(res?.height).toBe(50);
      expect(pasteSpy).toHaveBeenCalled();

      const actions = canvas.getActionLog();
      expect(actions.some((a) => a.type === "paste")).toBe(true);
    });

    it("pastes clipboard content at custom destination coordinates", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(0, 0, 30, 30);
      canvas.copy();

      const res = canvas.paste({ x: 100, y: 120 });
      expect(res).not.toBeNull();
      expect(res?.x).toBe(100);
      expect(res?.y).toBe(120);
    });

    it("pastes content onto a newly created layer when createLayer is true", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(5, 5, 40, 40);
      canvas.copy();

      const initialLayerCount = canvas.getLayers().length;
      const res = canvas.paste({
        createLayer: true,
        newLayerName: "Pasted Decal",
      });

      expect(canvas.getLayers().length).toBe(initialLayerCount + 1);
      const newActive = canvas.getActiveLayer();
      expect(newActive.name).toBe("Pasted Decal");
      expect(res?.layerId).toBe(newActive.id);
    });

    it("pastes content and sets selection marquee when asSelection is true", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(0, 0, 40, 40);
      canvas.copy();

      canvas.clearSelection();
      expect(canvas.hasSelection()).toBe(false);

      canvas.paste({ x: 50, y: 60, asSelection: true });
      expect(canvas.hasSelection()).toBe(true);
      expect(canvas.getSelectionBounds()).toEqual({
        x: 50,
        y: 60,
        width: 40,
        height: 40,
      });
    });

    it("pastes content as a floating transform when asTransform is true", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(0, 0, 40, 40);
      canvas.copy();

      expect(canvas.isTransforming()).toBe(false);

      canvas.paste({ asTransform: true });
      expect(canvas.isTransforming()).toBe(true);
      expect(canvas.getTransformSession()).not.toBeNull();
    });

    it("throws error when pasting onto locked layer unless createLayer is true", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(0, 0, 40, 40);
      canvas.copy();

      canvas.updateLayer(activeLayer.id, { locked: true });

      expect(() => {
        canvas.paste();
      }).toThrow(/locked/i);

      // Should succeed if createLayer is true
      expect(() => {
        canvas.paste({ createLayer: true });
      }).not.toThrow();
    });

    it("copies from Layer A and pastes onto Layer B across multiple documents", () => {
      // Document 1
      const layerA = canvas.getActiveLayer();
      const ctxA = layerA.canvas.getContext("2d")!;
      ctxA.fillRect(10, 10, 50, 50);
      canvas.copy();

      // Document 2
      const canvas2El = document.createElement("canvas");
      canvas2El.width = 300;
      canvas2El.height = 300;
      const canvas2 = new Canvas({
        canvas: canvas2El,
        document: { width: 300, height: 300 },
      });

      const layer2 = canvas2.createLayer("Target");
      canvas2.setActiveLayer(layer2.id);

      const pasteRes = canvas2.paste({ x: 150, y: 150 });
      expect(pasteRes).not.toBeNull();
      expect(pasteRes?.layerId).toBe(layer2.id);
      expect(pasteRes?.x).toBe(150);
      expect(pasteRes?.y).toBe(150);
    });

    it("replays recorded clipboard actions seamlessly", async () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillRect(10, 10, 40, 40);

      canvas.copy();
      canvas.paste({ x: 80, y: 80, createLayer: true, newLayerName: "Decal" });

      const log = canvas.getActionLog();
      expect(log.some((a) => a.type === "copy")).toBe(true);
      expect(log.some((a) => a.type === "paste")).toBe(true);

      const newCanvasEl = document.createElement("canvas");
      newCanvasEl.width = 200;
      newCanvasEl.height = 200;
      const replayCanvas = new Canvas({
        canvas: newCanvasEl,
        document: { width: 200, height: 200 },
      });

      await replayCanvas.replay(log);
      expect(replayCanvas.getActionLog()).toHaveLength(0);
    });
  });
});

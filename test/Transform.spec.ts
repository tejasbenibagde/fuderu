import { describe, expect, it, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { Layer } from "../src/Layer";
import { Selection } from "../src/Selection";
import { TransformSession } from "../src/Transform";

describe("Transformation System & Floating Transform Bounds", () => {
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

  describe("TransformSession Unit Tests", () => {
    it("initializes a transform session from layer bounds", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const session = new TransformSession(layer);

      expect(session.isActive()).toBe(true);
      expect(session.isSelection).toBe(false);
      expect(session.layerId).toBe("layer-1");
      expect(session.sourceBounds).toBeDefined();
      expect(session.translation).toEqual({ x: 0, y: 0 });
      expect(session.scale).toEqual({ x: 1, y: 1 });
      expect(session.rotation).toBe(0);
    });

    it("initializes transform session strictly from active selection bounds", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const selection = new Selection(200, 200);
      selection.selectRectangle(30, 40, 60, 80);

      const session = new TransformSession(layer, selection);

      expect(session.isSelection).toBe(true);
      expect(session.sourceBounds).toEqual({
        x: 30,
        y: 40,
        width: 60,
        height: 80,
      });
      expect(session.origin).toEqual({ x: 60, y: 80 });
    });

    it("calculates point transformation correctly with translate, scale, and rotate", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const selection = new Selection(200, 200);
      selection.selectRectangle(0, 0, 100, 100);

      const session = new TransformSession(layer, selection);
      // Origin is at center (50, 50)

      // Test identity
      const p1 = session.transformPoint(50, 50);
      expect(p1.x).toBeCloseTo(50);
      expect(p1.y).toBeCloseTo(50);

      // Translate by (10, 20)
      session.translate(10, 20);
      const p2 = session.transformPoint(50, 50);
      expect(p2.x).toBeCloseTo(60);
      expect(p2.y).toBeCloseTo(70);

      // Scale by 2x
      session.setScale(2, 2);
      // Point (100, 50) was 50 units to the right of center (50, 50).
      // With scale 2, it should be 100 units to the right of transformed center (60, 70) => 160
      const p3 = session.transformPoint(100, 50);
      expect(p3.x).toBeCloseTo(160);
      expect(p3.y).toBeCloseTo(70);

      // Rotate by 90 degrees (Math.PI / 2)
      session.setRotation(Math.PI / 2);
      // Rotated 90 degrees around origin: (100, 50) relative to (50, 50) is (50, 0).
      // Scaled by 2: (100, 0).
      // Rotated 90 deg: (0, 100).
      // Added to center (60, 70): (60, 170).
      const p4 = session.transformPoint(100, 50);
      expect(p4.x).toBeCloseTo(60);
      expect(p4.y).toBeCloseTo(170);
    });

    it("computes corners, center, and axis-aligned bounding box (AABB)", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const selection = new Selection(200, 200);
      selection.selectRectangle(10, 20, 40, 60);

      const session = new TransformSession(layer, selection);
      const corners = session.getCorners();
      expect(corners).toHaveLength(4);
      expect(corners[0]).toEqual({ x: 10, y: 20 });
      expect(corners[1]).toEqual({ x: 50, y: 20 });
      expect(corners[2]).toEqual({ x: 50, y: 80 });
      expect(corners[3]).toEqual({ x: 10, y: 80 });

      const center = session.getCenter();
      expect(center.x).toBeCloseTo(30);
      expect(center.y).toBeCloseTo(50);

      const aabb = session.getAABB();
      expect(aabb.x).toBe(10);
      expect(aabb.y).toBe(20);
      expect(aabb.width).toBe(40);
      expect(aabb.height).toBe(60);
    });

    it("generates interactive transformation handles", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const selection = new Selection(200, 200);
      selection.selectRectangle(0, 0, 100, 100);

      const session = new TransformSession(layer, selection);
      const handles = session.getHandles({ rotatorDistance: 20 });

      expect(handles.some((h) => h.type === "top-left")).toBe(true);
      expect(handles.some((h) => h.type === "top-right")).toBe(true);
      expect(handles.some((h) => h.type === "bottom-left")).toBe(true);
      expect(handles.some((h) => h.type === "bottom-right")).toBe(true);
      expect(handles.some((h) => h.type === "rotator")).toBe(true);
      expect(handles.some((h) => h.type === "pivot")).toBe(true);

      const rotator = handles.find((h) => h.type === "rotator")!;
      // Top mid is (50, 0), rotator is 20px above => (50, -20)
      expect(rotator.x).toBeCloseTo(50);
      expect(rotator.y).toBeCloseTo(-20);
    });

    it("supports horizontal and vertical flip", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const session = new TransformSession(layer);

      expect(session.scale.x).toBe(1);
      expect(session.scale.y).toBe(1);

      session.flipHorizontal();
      expect(session.scale.x).toBe(-1);

      session.flipVertical();
      expect(session.scale.y).toBe(-1);

      session.flipHorizontal();
      expect(session.scale.x).toBe(1);
    });

    it("renders floating content and transform bounding box", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const session = new TransformSession(layer);

      const targetCanvas = document.createElement("canvas");
      targetCanvas.width = 200;
      targetCanvas.height = 200;
      const ctx = targetCanvas.getContext("2d")!;

      session.render(ctx, true);

      expect(ctx.save).toHaveBeenCalled();
      expect(ctx.translate).toHaveBeenCalled();
      expect(ctx.rotate).toHaveBeenCalled();
      expect(ctx.scale).toHaveBeenCalled();
      expect(ctx.drawImage).toHaveBeenCalled();
      expect(ctx.restore).toHaveBeenCalled();
    });

    it("commits transformation and produces history patch data", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const selection = new Selection(200, 200);
      selection.selectRectangle(10, 10, 50, 50);

      const session = new TransformSession(layer, selection);
      session.translate(15, 20);

      const res = session.commit(layer, selection);

      expect(res.beforeData).toBeDefined();
      expect(res.afterData).toBeDefined();
      expect(res.patchBounds.width).toBeGreaterThan(0);
      expect(res.patchBounds.height).toBeGreaterThan(0);
      expect(session.isActive()).toBe(false);
    });

    it("cancels transformation and restores original layer state", () => {
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 200,
        height: 200,
      });
      const session = new TransformSession(layer);
      session.translate(50, 50);

      session.cancel(layer);
      expect(session.isActive()).toBe(false);

      const ctx = layer.canvas.getContext("2d")!;
      expect(ctx.putImageData).toHaveBeenCalled();
    });
  });

  describe("Canvas Transform Integration", () => {
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

    it("starts, modifies, and commits an interactive transform session", () => {
      expect(canvas.isTransforming()).toBe(false);

      const startSpy = vi.fn();
      const endSpy = vi.fn();
      canvas.on("transform:start", startSpy);
      canvas.on("transform:end", endSpy);

      const session = canvas.beginTransform();
      expect(canvas.isTransforming()).toBe(true);
      expect(canvas.getTransformSession()).toBe(session);
      expect(startSpy).toHaveBeenCalled();

      // Check snapshot
      const snap = canvas.getSnapshot();
      expect(snap.transform).toBeDefined();
      expect(snap.transform?.active).toBe(true);

      // Perform transformation operations
      session.translate(20, 30);
      session.rotate(0.5);
      session.flipHorizontal();

      canvas.commitTransform();
      expect(canvas.isTransforming()).toBe(false);
      expect(canvas.getTransformSession()).toBeNull();
      expect(endSpy).toHaveBeenCalled();

      // Recorded action in action log
      const actions = canvas.getActionLog();
      const transformAction = actions.find((a) => a.type === "transform");
      expect(transformAction).toBeDefined();
      expect(transformAction?.options.translation).toEqual({ x: 20, y: 30 });
      expect(transformAction?.options.scale?.x).toBe(-1);
      expect(transformAction?.options.rotation).toBe(0.5);
    });

    it("cancels active transformation session without committing action", () => {
      canvas.beginTransform();
      expect(canvas.isTransforming()).toBe(true);

      canvas.cancelTransform();
      expect(canvas.isTransforming()).toBe(false);

      const actions = canvas.getActionLog();
      expect(actions.some((a) => a.type === "transform")).toBe(false);
    });

    it("provides direct one-shot transformation helper methods", () => {
      canvas.translate(10, 15);
      canvas.rotate(0.25);
      canvas.scale(1.5, 1.5);
      canvas.flipHorizontal();
      canvas.flipVertical();

      const actions = canvas.getActionLog();
      const transformActions = actions.filter((a) => a.type === "transform");
      expect(transformActions.length).toBe(5);
    });

    it("transforms active selection and updates selection mask accordingly", () => {
      canvas.selectRectangle(20, 20, 40, 40);
      expect(canvas.hasSelection()).toBe(true);
      expect(canvas.getSelectionBounds()).toEqual({
        x: 20,
        y: 20,
        width: 40,
        height: 40,
      });

      // Transform the selection by translating (10, 15)
      canvas.translate(10, 15);

      // Selection bounds must be shifted
      expect(canvas.hasSelection()).toBe(true);
      const newBounds = canvas.getSelectionBounds()!;
      expect(newBounds.x).toBe(30);
      expect(newBounds.y).toBe(35);
    });

    it("replays recorded transform actions seamlessly", async () => {
      canvas.translate(12, 18);
      canvas.rotate(Math.PI / 4);

      const log = canvas.getActionLog();

      const newCanvasEl = document.createElement("canvas");
      newCanvasEl.width = 200;
      newCanvasEl.height = 200;
      const replayCanvas = new Canvas({
        canvas: newCanvasEl,
        document: { width: 200, height: 200 },
      });

      await replayCanvas.replay(log);

      // Replay actions executed without errors
      expect(replayCanvas.getActionLog()).toHaveLength(0); // replay shouldn't log new actions
    });

    it("throws error when attempting to transform a locked layer", () => {
      const active = canvas.getActiveLayer();
      canvas.updateLayer(active.id, { locked: true });

      expect(() => {
        canvas.beginTransform();
      }).toThrow(/locked/i);
    });
  });
});

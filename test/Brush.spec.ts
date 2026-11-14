import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Brush } from "../src/Brush";
import type { Point, PurePoint } from "../src/types/point";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

type InternalBrush = {
  points: Point[];
  prePoint?: PurePoint;
  prePrePoint?: PurePoint;
  lastProcessedPointForRotation?: PurePoint;
  previousRotationAngle: number;
  assertCanvasReady: () => void;
};

const getInternalBrush = (brush: Brush) => brush as unknown as InternalBrush;

const createCanvas = (w = 120, h = 120) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return canvas;
};

describe("Brush", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let originalImage: typeof Image;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    originalImage = globalThis.Image;
  });

  afterEach(() => {
    globalThis.Image = originalImage;
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("Instantiation & Guards", () => {
    it("creates a Brush instance and throws if drawing/finalizing before loadContext", () => {
      const uninitialized = new Brush();
      expect(() => uninitialized.finalizeStroke()).toThrow(
        'Canvas not loaded, please use "loadContext" to load it',
      );
      expect(() => getInternalBrush(uninitialized).assertCanvasReady()).toThrow(
        'Canvas not loaded, please use "loadContext" to load it',
      );
    });

    it("initializes 4 canvases cleanly per Brush instance", () => {
      const getContextSpy = vi.spyOn(HTMLCanvasElement.prototype, "getContext");
      const brush = new Brush(createCanvas());
      expect(brush).toBeInstanceOf(Brush);
      expect(getContextSpy).toHaveBeenCalledTimes(4);
    });
  });

  describe("Configuration & Runtime Flags", () => {
    it("applies default configuration values and selectively overrides via loadConfig", () => {
      const brush = new Brush(createCanvas(), { size: 10, opacity: 0.5 });

      expect(brush.config).toEqual({
        size: 10,
        opacity: 0.5,
        flow: 1,
        color: "#000000",
        angle: 0,
        roundness: 1,
        spacing: 0.12,
        eraser: false,
      });

      brush.loadConfig({ color: "#00ff00", eraser: true });
      expect(brush.config.color).toBe("#00ff00");
      expect(brush.config.size).toBe(10);
      expect(brush.config.eraser).toBe(true);
      expect(brush.isEraser).toBe(true);
    });

    it("bindConfig binds the external config reference directly", () => {
      const brush = new Brush(createCanvas());
      const external = {
        size: 42,
        opacity: 0.8,
        flow: 0.5,
        color: "#abcdef",
        angle: 0.25,
        roundness: 0.6,
        spacing: 0.2,
        eraser: false,
      };
      brush.bindConfig(external);
      expect(brush.config).toBe(external);
      external.size = 64;
      expect(brush.config.size).toBe(64);
    });
  });

  describe("Point Processing, Lag & Rotation", () => {
    it("holds first point, processes second point, and enforces minimum spacing/lag guards", () => {
      const brush = new Brush(createCanvas(), { size: 20, spacing: 0.25 }); // space = 5

      brush.putPoint(10, 20, 1);
      expect(getInternalBrush(brush).points).toHaveLength(0);

      brush.putPoint(30, 40, 0.8);
      const queued = getInternalBrush(brush).points;
      expect(queued.length).toBeGreaterThan(1);
      expect(queued[0].x).toBe(10);
      expect(queued[0].y).toBe(20);
      expect(queued[0].pressure).toBe(1);

      // Tiny movement smaller than spacing + lagDistance (5 + 5 = 10) must be ignored
      const countBeforeSmallMove = queued.length;
      brush.putPoint(27, 37, 0.8);
      expect(getInternalBrush(brush).points.length).toBe(countBeforeSmallMove);
    });

    it("backfills initial point flow rotation when second point arrives and resets between strokes", () => {
      const brush = new Brush(createCanvas(), {
        size: 16,
        spacing: 0.5,
        rotation: { mode: "flow", offset: Math.PI / 4 },
      });

      // Horizontal right movement -> base angle 0 + offset pi/4
      brush.putPoint(10, 50, 1);
      brush.putPoint(40, 50, 1);

      const points = getInternalBrush(brush).points;
      expect(points.length).toBeGreaterThanOrEqual(2);
      expect(points[0].rotation).toBeCloseTo(Math.PI / 4, 5);
      expect(points[1].rotation).toBeCloseTo(Math.PI / 4, 5);

      brush.finalizeStroke();
      expect(
        getInternalBrush(brush).lastProcessedPointForRotation,
      ).toBeUndefined();
      expect(getInternalBrush(brush).previousRotationAngle).toBe(0);
    });

    it("applies fixed and random rotation configurations accurately", () => {
      const fixedBrush = new Brush(createCanvas(), {
        rotation: { mode: "fixed", offset: Math.PI / 2 },
      });
      fixedBrush.putPoint(0, 0, 1);
      fixedBrush.putPoint(50, 0, 1);
      expect(getInternalBrush(fixedBrush).points[0].rotation).toBeCloseTo(
        Math.PI / 2,
      );

      vi.spyOn(Math, "random").mockReturnValue(0.5);
      const randomBrush = new Brush(createCanvas(), {
        rotation: { mode: "random", offset: 0.1 },
      });
      randomBrush.putPoint(0, 0, 1);
      randomBrush.putPoint(40, 40, 1);
      const pts = getInternalBrush(randomBrush).points;
      expect(pts[pts.length - 1].rotation).toBeCloseTo(Math.PI + 0.1, 5);
    });
  });

  describe("Pixel Rendering, Eraser, AlphaLock, SelectionMask & Opacity", () => {
    it("renders visible colored stroke pixels onto canvas via render() and flush()", async () => {
      const canvas = createCanvas(100, 100);
      const brush = new Brush(canvas, {
        size: 10,
        color: "#ff0000",
        opacity: 1,
        flow: 1,
      });
      const onRender = vi.fn();
      brush.onRender = onRender;

      brush.putPoint(20, 50, 1);
      brush.putPoint(70, 50, 1);
      brush.finalizeStroke();
      await brush.flush();

      expect(onRender).toHaveBeenCalled();
      expect(canvasEnv.getPixel(canvas, 30, 50)).toEqual([255, 0, 0, 255]);
      // Outside stroke path remains transparent
      expect(canvasEnv.getPixel(canvas, 5, 5)).toEqual([0, 0, 0, 0]);
    });

    it("acts as an eraser (destination-out) leaving untouched pixels intact", async () => {
      const canvas = createCanvas(80, 80);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(0, 0, 80, 80);

      const brush = new Brush(canvas, {
        size: 10,
        eraser: true,
        opacity: 1,
        flow: 1,
      });

      brush.putPoint(40, 40, 1);
      brush.finalizeStroke();
      await brush.flush();

      // Center erased to transparent while corner remains opaque blue
      expect(canvasEnv.getPixel(canvas, 40, 40)[3]).toBe(0);
      expect(canvasEnv.getPixel(canvas, 5, 5)).toEqual([0, 0, 255, 255]);
    });

    it("respects isAlphaLocked and selectionMask when painting strokes", async () => {
      const canvas = createCanvas(80, 80);
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(10, 10, 30, 30);

      const maskCanvas = createCanvas(80, 80);
      const mCtx = maskCanvas.getContext("2d")!;
      mCtx.fillStyle = "#ffffff";
      mCtx.fillRect(20, 20, 40, 40);

      const brush = new Brush(canvas, {
        size: 15,
        color: "#00ff00",
        opacity: 1,
        flow: 1,
      });
      brush.isAlphaLocked = true;
      brush.setSelectionMask(maskCanvas);

      brush.putPoint(15, 15, 1); // on red layer, OUTSIDE mask
      brush.putPoint(30, 30, 1); // on red layer, INSIDE mask
      brush.putPoint(50, 50, 1); // off red layer, INSIDE mask
      brush.finalizeStroke();
      await brush.flush();

      // Intersection of opaque layer [10..40] and mask [20..60] turns green
      expect(canvasEnv.getPixel(canvas, 30, 30)).toEqual([0, 255, 0, 255]);
      // Outside mask stays red even though brush swept through (15, 15)
      expect(canvasEnv.getPixel(canvas, 14, 14)).toEqual([255, 0, 0, 255]);
      // Outside opaque pixels stays transparent even inside mask because isAlphaLocked=true
      expect(canvasEnv.getPixel(canvas, 50, 50)[3]).toBe(0);
    });

    it("skips drawing pixels when opacity <= 0 while still triggering finalizeStroke callback & onEndStroke", async () => {
      const canvas = createCanvas(60, 60);
      const brush = new Brush(canvas, {
        size: 10,
        opacity: 0,
        color: "#ff0000",
      });
      const onEndStroke = vi.fn();
      const cb = vi.fn();
      brush.useModule({ onEndStroke });

      brush.putPoint(30, 30, 1);
      brush.finalizeStroke(cb);
      await brush.flush();

      expect(canvasEnv.countNonTransparentPixels(canvas)).toBe(0);
      expect(onEndStroke).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("resolves pending flush() promises once render() completes", async () => {
      const rafQueue: FrameRequestCallback[] = [];
      vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
        rafQueue.push(cb);
        return rafQueue.length;
      });

      const canvas = createCanvas(60, 60);
      const brush = new Brush(canvas, { size: 8, color: "#000000" });

      brush.putPoint(10, 10, 1);
      brush.putPoint(30, 30, 1);
      brush.render();

      const flushPromise = brush.flush();
      await flushPromise;
      expect(canvasEnv.countNonTransparentPixels(canvas)).toBeGreaterThan(0);
    });

    it("loads shape images (canvas, element, URL) and clears shape with removeImage()", async () => {
      const target = createCanvas(60, 60);
      const brush = new Brush(target, { size: 20, color: "#00ff00" });

      // 1. HTMLCanvasElement stamp shape
      const shapeCvs = createCanvas(16, 16);
      shapeCvs.getContext("2d")!.fillRect(0, 0, 16, 16);
      const canvasCb = vi.fn();
      brush.loadImage(shapeCvs, canvasCb);
      expect(canvasCb).toHaveBeenCalledWith(true);

      brush.putPoint(30, 30, 1);
      brush.finalizeStroke();
      await brush.flush();
      expect(canvasEnv.getPixel(target, 30, 30)).toEqual([0, 255, 0, 255]);

      // 2. HTMLImageElement with naturalWidth === 0 warns and skips
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const emptyImg = document.createElement("img");
      brush.loadImage(emptyImg);
      expect(warnSpy).toHaveBeenCalled();

      // 3. URL async success & failure
      globalThis.Image = class MockImage {
        public onload: (() => void) | null = null;
        public onerror: (() => void) | null = null;
        public naturalWidth = 10;
        public naturalHeight = 10;
        public width = 10;
        public height = 10;
        private _src = "";
        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          setTimeout(() => {
            if (val.includes("fail")) this.onerror?.();
            else this.onload?.();
          }, 0);
        }
      } as unknown as typeof Image;

      await expect(
        brush.loadImageAsync("https://example.com/stamp.png"),
      ).resolves.toBeUndefined();
      await expect(
        brush.loadImageAsync("https://example.com/fail.png"),
      ).rejects.toBeUndefined();

      brush.removeImage();
      brush.clear();
      expect(canvasEnv.countNonTransparentPixels(target)).toBe(0);
    });

    it("restores composite operation and filter after mixin", async () => {
      const target = createCanvas(50, 50);
      const ctx = target.getContext("2d")!;
      const brush = new Brush(target, { size: 10, color: "#ff0000" });
      brush.blendMode = "multiply";
      brush.filter = "blur(1px)";

      brush.putPoint(25, 25, 1);
      brush.finalizeStroke();
      await brush.flush();

      expect(ctx.globalCompositeOperation).toBe("source-over");
      expect(ctx.filter).toBe("none");
    });

    it("executes module lifecycle hooks cleanly", async () => {
      const brush = new Brush(createCanvas());
      const module = {
        onChangePoint: vi.fn((p: PurePoint) => [p, { ...p, x: p.x + 1 }]),
        onChangeConfig: vi.fn(),
        onMixinCanvas: vi.fn(
          (
            c: HTMLCanvasElement,
            ctx: CanvasRenderingContext2D,
          ): [HTMLCanvasElement, CanvasRenderingContext2D] => [c, ctx],
        ),
        onEndStroke: vi.fn(),
      };

      const id = brush.useModule(module);
      expect(brush.useModule(module)).toBe(id);

      brush.isSmooth = false;
      brush.putPoint(0, 0, 1);
      brush.putPoint(50, 0, 1);
      const queued = getInternalBrush(brush).points;
      expect(module.onChangePoint.mock.calls.length * 2).toBe(queued.length);
      expect(module.onChangeConfig.mock.calls.length).toBe(queued.length);

      brush.render();
      brush.finalizeStroke();
      await brush.flush();
      expect(module.onMixinCanvas).toHaveBeenCalled();
      expect(module.onEndStroke).toHaveBeenCalledTimes(1);
      expect(brush.removeModule(id)).toBe(true);
      expect(brush.removeModule(id)).toBe(false);
    });
  });
});

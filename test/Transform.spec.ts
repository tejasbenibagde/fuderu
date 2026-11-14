import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { Layer } from "../src/Layer";
import { Selection } from "../src/Selection";
import { TransformSession } from "../src/Transform";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Transformation System & Floating Transform Bounds", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("TransformSession Unit Tests", () => {
    it("throws when constructed with an empty selection", () => {
      const layer = new Layer({ id: "l1", width: 100, height: 100 });
      const selection = new Selection(100, 100);
      selection.selectRectangle(10, 10, 20, 20);
      // Force active flag with zero bounds to hit empty selection guard
      vi.spyOn(selection, "isActive").mockReturnValue(true);
      vi.spyOn(selection, "getBounds").mockReturnValue({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      });

      expect(() => new TransformSession(layer, selection)).toThrow(
        "Cannot transform empty selection",
      );
    });

    it("computes tight layer AABB when no selection is active and falls back to full doc on empty layer", () => {
      const emptyLayer = new Layer({ id: "empty", width: 100, height: 80 });
      const emptySession = new TransformSession(emptyLayer);
      expect(emptySession.sourceBounds).toEqual({
        x: 0,
        y: 0,
        width: 100,
        height: 80,
      });

      const layer = new Layer({ id: "l1", width: 100, height: 100 });
      layer.ctx.fillStyle = "#ff0000";
      layer.ctx.fillRect(20, 30, 15, 25);

      const session = new TransformSession(layer);
      expect(session.isSelection).toBe(false);
      expect(session.sourceBounds).toEqual({
        x: 20,
        y: 30,
        width: 15,
        height: 25,
      });
      // Lifted region is cleared from the underlying layer while floating
      expect(canvasEnv.countNonTransparentPixels(layer.canvas)).toBe(0);
    });

    it("lifts ONLY selected pixels onto floating canvas and leaves outside pixels intact", () => {
      const layer = new Layer({ id: "l1", width: 100, height: 100 });
      layer.ctx.fillStyle = "#ff0000";
      layer.ctx.fillRect(0, 0, 20, 20); // outside selection
      layer.ctx.fillStyle = "#00ff00";
      layer.ctx.fillRect(30, 30, 30, 30); // inside selection

      const selection = new Selection(100, 100);
      selection.selectRectangle(30, 30, 30, 30);

      const session = new TransformSession(layer, selection);
      expect(session.isSelection).toBe(true);
      expect(session.sourceBounds).toEqual({
        x: 30,
        y: 30,
        width: 30,
        height: 30,
      });

      // Outside pixel stays red while selected region was lifted (cleared)
      expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([
        255, 0, 0, 255,
      ]);
      expect(canvasEnv.getPixel(layer.canvas, 40, 40)).toEqual([0, 0, 0, 0]);

      session.translate(30, 0);
      const res = session.commit(layer, selection);

      expect(session.isActive()).toBe(false);
      // After commit: original selection spot is cleared, green pixels moved to x=60..90, red pixel untouched
      expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([
        255, 0, 0, 255,
      ]);
      expect(canvasEnv.getPixel(layer.canvas, 40, 40)).toEqual([0, 0, 0, 0]);
      expect(canvasEnv.getPixel(layer.canvas, 70, 40)).toEqual([
        0, 255, 0, 255,
      ]);

      // Selection bounds itself shifted alongside the transformed pixels
      expect(selection.isActive()).toBe(true);
      expect(selection.getBounds()).toEqual({
        x: 60,
        y: 30,
        width: 30,
        height: 30,
      });
      expect(selection.containsPoint(40, 40)).toBe(false);

      // beforeData and afterData actually differ and contain the expected region pixels
      expect(res.patchBounds).toEqual({ x: 30, y: 30, width: 60, height: 30 });
      expect(res.beforeData.data).not.toEqual(res.afterData.data);

      // Calling commit again after completion throws
      expect(() => session.commit(layer, selection)).toThrow(
        "TransformSession is not active",
      );
    });

    it("honors alphaLock during commit() and skips writing onto transparent pixels", () => {
      const layer = new Layer({
        id: "l1",
        width: 100,
        height: 100,
        alphaLock: true,
      });
      layer.ctx.fillStyle = "#ff0000";
      layer.ctx.fillRect(10, 10, 20, 20);
      // Destination anchor region at x=50..70
      layer.ctx.fillStyle = "#0000ff";
      layer.ctx.fillRect(50, 10, 10, 20);

      const selection = new Selection(100, 100);
      selection.selectRectangle(10, 10, 20, 20);

      const session = new TransformSession(layer, selection);
      session.translate(40, 0); // covers [50..70, 10..30]
      session.commit(layer, selection);

      // Blue opaque pixels at x=50..59 got overwritten with red
      expect(canvasEnv.getPixel(layer.canvas, 55, 15)).toEqual([
        255, 0, 0, 255,
      ]);
      // Transparent pixels at x=60..69 remain transparent because alphaLock=true
      expect(canvasEnv.getPixel(layer.canvas, 65, 15)).toEqual([0, 0, 0, 0]);
    });

    it("supports custom origin pivot, rotation, flip, reset, and handles math", () => {
      const layer = new Layer({ id: "l1", width: 200, height: 200 });
      const selection = new Selection(200, 200);
      selection.selectRectangle(20, 20, 40, 40);

      const session = new TransformSession(layer, selection);
      session.setOrigin(20, 20); // top-left corner as pivot
      session.setRotation(Math.PI / 2);

      // Top-right corner (60, 20) rotated 90deg CW around (20, 20) => (20, 60)
      const corners = session.getCorners();
      expect(corners[0].x).toBeCloseTo(20);
      expect(corners[0].y).toBeCloseTo(20);
      expect(corners[1].x).toBeCloseTo(20);
      expect(corners[1].y).toBeCloseTo(60);

      // Flipping vertically inverts the rotator handle normal direction
      session.reset();
      expect(session.origin).toEqual({ x: 40, y: 40 });
      session.flipVertical();
      const flippedHandles = session.getHandles({ rotatorDistance: 20 });
      const rotator = flippedHandles.find((h) => h.type === "rotator")!;
      // When flipped vertically (scale.y < 0), top-left & top-right are at y=60 and norm points down to y=80
      expect(rotator.y).toBeCloseTo(80);
    });

    it("cancels transformation and restores exact original RGBA pixels", () => {
      const layer = new Layer({ id: "l1", width: 80, height: 80 });
      layer.ctx.fillStyle = "#112233";
      layer.ctx.fillRect(10, 10, 20, 20);

      const session = new TransformSession(layer);
      expect(canvasEnv.countNonTransparentPixels(layer.canvas)).toBe(0);

      session.translate(30, 30);
      session.cancel(layer);

      expect(session.isActive()).toBe(false);
      expect(canvasEnv.getPixel(layer.canvas, 15, 15)).toEqual([
        0x11, 0x22, 0x33, 255,
      ]);
      expect(canvasEnv.getPixel(layer.canvas, 45, 45)).toEqual([0, 0, 0, 0]);
    });
  });

  describe("Canvas Transform Integration", () => {
    let canvasEl: HTMLCanvasElement;
    let canvas: Canvas;

    beforeEach(() => {
      canvasEl = document.createElement("canvas");
      canvasEl.width = 120;
      canvasEl.height = 120;
      document.body.appendChild(canvasEl);

      canvas = new Canvas({
        canvas: canvasEl,
        document: { width: 120, height: 120 },
      });
    });

    it("renders floating preview onto composite canvas, emits transform events, and supports undo/redo of pixels", () => {
      canvas.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        fillColor: "#ff0000",
        stroke: false,
      });

      const startSpy = vi.fn();
      const changeSpy = vi.fn();
      const endSpy = vi.fn();
      canvas.on("transform:start", startSpy);
      canvas.on("transform:change", changeSpy);
      canvas.on("transform:end", endSpy);

      const session = canvas.beginTransform();
      expect(startSpy).toHaveBeenCalledTimes(1);

      canvas.translate(30, 40);
      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0].translation).toEqual({ x: 30, y: 40 });
      // Composite main canvas shows the floating transformed pixels
      expect(canvas.getColorAt(50, 60, "composite").hex).toBe("#ff0000");

      canvas.commitTransform();
      expect(endSpy).toHaveBeenCalledTimes(1);
      expect(session.isActive()).toBe(false);
      expect(canvas.getColorAt(50, 60, "activeLayer").hex).toBe("#ff0000");
      expect(canvas.getColorAt(15, 15, "activeLayer").a).toBe(0);

      // Undo restores original position
      canvas.undo();
      expect(canvas.getColorAt(15, 15, "activeLayer").hex).toBe("#ff0000");
      expect(canvas.getColorAt(50, 60, "activeLayer").a).toBe(0);

      // Redo reapplies transform position
      canvas.redo();
      expect(canvas.getColorAt(50, 60, "activeLayer").hex).toBe("#ff0000");
    });

    it("auto-commits previous active transform session when beginTransform is called again", () => {
      canvas.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        fillColor: "#00ff00",
        stroke: false,
      });

      const first = canvas.beginTransform();
      first.translate(20, 0);

      const second = canvas.beginTransform();
      expect(first.isActive()).toBe(false);
      expect(second.isActive()).toBe(true);
      expect(second.sourceBounds).toEqual({
        x: 30,
        y: 10,
        width: 20,
        height: 20,
      });

      canvas.cancelTransform();
      expect(canvas.getColorAt(35, 15, "activeLayer").hex).toBe("#00ff00");
    });

    it("rejects beginTransform on locked or non-existent layers", () => {
      expect(() => canvas.beginTransform("does-not-exist")).toThrow(
        "Target layer not found",
      );

      const active = canvas.getActiveLayer();
      canvas.updateLayer(active.id, { locked: true });
      expect(() => canvas.beginTransform()).toThrow(
        "Cannot transform locked layer",
      );
    });

    it("replays recorded transform actions and produces identical pixel positions", async () => {
      canvas.createLayer({ id: "transform-layer", name: "Transform Layer" });
      canvas.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        fillColor: "#0000ff",
        stroke: false,
      });
      canvas.translate(50, 60);

      const log = canvas.getActionLog();
      expect(log.some((a) => a.type === "transform")).toBe(true);

      const replayEl = document.createElement("canvas");
      replayEl.width = 120;
      replayEl.height = 120;
      const replayCanvas = new Canvas({
        canvas: replayEl,
        document: { width: 120, height: 120 },
      });

      await replayCanvas.replay(log);

      expect(replayCanvas.getActionLog()).toHaveLength(0);
      expect(replayCanvas.getColorAt(15, 15, "activeLayer").a).toBe(0);
      expect(replayCanvas.getColorAt(65, 75, "activeLayer").hex).toBe(
        "#0000ff",
      );
    });

    it("preserves active floating transform during exportPNG and exportDocument and cleans up on destroy", async () => {
      canvas.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        fillColor: "#ff0000",
        stroke: false,
      });
      canvas.beginTransform();
      canvas.translate(40, 40);

      const pngUrl = await canvas.exportPNG();
      const exportedSnap = canvasEnv.encodedSnapshots.get(pngUrl);
      expect(exportedSnap).toBeDefined();
      // Floating red pixel at (55, 55) must be included in exported PNG
      const idx = (55 * exportedSnap!.width + 55) * 4;
      expect(Array.from(exportedSnap!.data.slice(idx, idx + 4))).toEqual([
        255, 0, 0, 255,
      ]);

      const doc = await canvas.exportDocument();
      expect(doc.layers).toHaveLength(1);
      expect(doc.layers[0].dataUrl).toContain("data:image/png");

      canvas.destroy();
      expect(canvas.isTransforming()).toBe(false);
    });
  });
});

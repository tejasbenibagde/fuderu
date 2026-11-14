import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { Selection } from "../src/Selection";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Selection Module & Artist Selection Tools", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("Selection Class Unit Tests", () => {
    it("initializes with inactive selection and null bounds", () => {
      const sel = new Selection(200, 200);
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();
      expect(sel.containsPoint(10, 10)).toBe(false);
      expect(sel.isPixelSelected(10, 10)).toBe(false);
      expect(sel.getSnapshot()).toEqual({ active: false, bounds: null });
    });

    it("creates and normalizes rectangular marquee selections including zero/negative cases", () => {
      const sel = new Selection(200, 200);
      sel.selectRectangle(60, 80, -50, -60);

      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 10, y: 20, width: 50, height: 60 });
      expect(sel.containsPoint(10, 20)).toBe(true);
      expect(sel.containsPoint(59, 79)).toBe(true);
      expect(sel.containsPoint(9, 20)).toBe(false);
      expect(sel.containsPoint(60, 80)).toBe(false);

      // Replace with zero-size rectangle clears selection
      sel.selectRectangle(10, 10, 0, 20, "replace");
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();
    });

    it("combines selections accurately with add, subtract (including full clear), and intersect modes", () => {
      const sel = new Selection(100, 100);
      sel.selectRectangle(10, 10, 30, 30);
      sel.selectRectangle(25, 25, 30, 30, "add");

      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 10, y: 10, width: 45, height: 45 });
      expect(sel.containsPoint(15, 15)).toBe(true);
      expect(sel.containsPoint(50, 50)).toBe(true);
      expect(sel.containsPoint(50, 15)).toBe(false);

      // Intersect keeps only overlapping [25..40, 25..40]
      sel.selectRectangle(25, 25, 15, 15, "intersect");
      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 25, y: 25, width: 15, height: 15 });
      expect(sel.containsPoint(30, 30)).toBe(true);
      expect(sel.containsPoint(15, 15)).toBe(false);
      expect(sel.containsPoint(45, 45)).toBe(false);

      // Subtract partial
      sel.selectRectangle(30, 25, 10, 15, "subtract");
      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 25, y: 25, width: 5, height: 15 });
      expect(sel.containsPoint(27, 30)).toBe(true);
      expect(sel.containsPoint(35, 30)).toBe(false);

      // Subtract remaining area deactivates selection completely
      sel.selectRectangle(25, 25, 5, 15, "subtract");
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();
      expect(sel.containsPoint(27, 30)).toBe(false);
    });

    it("rasterizes elliptical selections accurately including rotated ellipses", () => {
      const sel = new Selection(200, 200);
      // Rotated 90 degrees: rx=40 becomes vertical half-axis, ry=10 becomes horizontal half-axis
      sel.selectEllipse(100, 100, 40, 10, Math.PI / 2);

      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 90, y: 60, width: 20, height: 80 });
      expect(sel.containsPoint(100, 100)).toBe(true);
      // Point near vertical tip (100, 65) is inside rotated ellipse
      expect(sel.containsPoint(100, 65)).toBe(true);
      // Point along unrotated x-axis (130, 100) is OUTSIDE rotated ellipse
      expect(sel.containsPoint(130, 100)).toBe(false);
    });

    it("rasterizes freehand lasso polygon pixels and rejects < 3 points in replace mode", () => {
      const sel = new Selection(100, 100);
      // Diamond / triangle polygon where AABB corners must NOT be selected
      sel.selectLasso([
        { x: 50, y: 10 },
        { x: 90, y: 50 },
        { x: 50, y: 90 },
        { x: 10, y: 50 },
      ]);

      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 10, y: 10, width: 80, height: 80 });
      // Center is inside polygon
      expect(sel.containsPoint(50, 50)).toBe(true);
      // Inside AABB corners but OUTSIDE diamond polygon
      expect(sel.containsPoint(15, 15)).toBe(false);
      expect(sel.containsPoint(85, 85)).toBe(false);

      // Fewer than 3 points clears in replace mode
      sel.selectLasso(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
        ],
        "replace",
      );
      expect(sel.isActive()).toBe(false);
    });

    it("handles selectAll, clear, deselect, and invert (both from active and inactive)", () => {
      const sel = new Selection(80, 80);

      // Inverting when inactive selects all
      sel.invert();
      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 0, y: 0, width: 80, height: 80 });
      expect(sel.containsPoint(40, 40)).toBe(true);

      // Inverting selectAll produces empty inactive selection
      sel.invert();
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();

      sel.selectRectangle(10, 10, 20, 20);
      sel.invert();
      expect(sel.isActive()).toBe(true);
      expect(sel.containsPoint(15, 15)).toBe(false);
      expect(sel.containsPoint(50, 50)).toBe(true);

      sel.deselect();
      expect(sel.isActive()).toBe(false);
    });

    it("preserves and recomputes active selection bounds when resize() crops/expands mask", () => {
      const sel = new Selection(100, 100);
      sel.selectRectangle(30, 30, 50, 50);

      sel.resize(60, 60);
      expect(sel.isActive()).toBe(true);
      expect(sel.getBounds()).toEqual({ x: 30, y: 30, width: 30, height: 30 });
      expect(sel.containsPoint(40, 40)).toBe(true);
      expect(sel.containsPoint(70, 70)).toBe(false);

      // Resize smaller than selection origin empties selection
      sel.resize(20, 20);
      expect(sel.isActive()).toBe(false);
      expect(sel.getBounds()).toBeNull();
    });

    it("clipCanvas masks pixels using destination-in and applyClipping restricts ctx draws", () => {
      const sel = new Selection(60, 60);
      sel.selectRectangle(15, 15, 30, 30);

      const target = document.createElement("canvas");
      target.width = 60;
      target.height = 60;
      const tCtx = target.getContext("2d")!;
      tCtx.fillStyle = "#ff0000";
      tCtx.fillRect(0, 0, 60, 60);

      sel.clipCanvas(target, tCtx);
      expect(canvasEnv.getPixel(target, 20, 20)).toEqual([255, 0, 0, 255]);
      expect(canvasEnv.getPixel(target, 5, 5)).toEqual([0, 0, 0, 0]);
      expect(canvasEnv.getPixel(target, 50, 50)).toEqual([0, 0, 0, 0]);

      const clippedTarget = document.createElement("canvas");
      clippedTarget.width = 60;
      clippedTarget.height = 60;
      const cCtx = clippedTarget.getContext("2d")!;
      cCtx.save();
      sel.applyClipping(cCtx);
      cCtx.fillStyle = "#00ff00";
      cCtx.fillRect(0, 0, 60, 60);
      cCtx.restore();

      expect(canvasEnv.getPixel(clippedTarget, 25, 25)).toEqual([
        0, 255, 0, 255,
      ]);
      expect(canvasEnv.getPixel(clippedTarget, 5, 5)).toEqual([0, 0, 0, 0]);
    });

    it("renders dual-tone marching ants selection outline with secondary dash offset", () => {
      const sel = new Selection(100, 100);
      sel.selectRectangle(10, 10, 40, 40);

      const target = document.createElement("canvas");
      target.width = 100;
      target.height = 100;
      const ctx = target.getContext("2d")!;

      sel.renderOutline(ctx, {
        strokeStyle: "#111111",
        secondaryStrokeStyle: "#eeeeee",
        dashOffset: 3,
        dashPattern: [6, 4],
        lineWidth: 2,
      });

      expect(ctx.strokeRect).toHaveBeenNthCalledWith(1, 10, 10, 40, 40);
      expect(ctx.strokeRect).toHaveBeenNthCalledWith(2, 10, 10, 40, 40);
      expect(ctx.setLineDash).toHaveBeenCalledWith([6, 4]);
      // Corner outline pixel should have been stroked onto target canvas
      expect(canvasEnv.getPixel(target, 10, 10)[3]).toBeGreaterThan(0);
    });
  });

  describe("Canvas Selection Integration (Pixel-Level Masking)", () => {
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

    it("emits selection:change, updates brush mask, and includes selection in CanvasSnapshot", () => {
      const changeSpy = vi.fn();
      canvas.on("selection:change", changeSpy);

      canvas.selectRectangle(10, 10, 30, 30);
      expect(changeSpy).toHaveBeenCalledTimes(1);
      expect(changeSpy.mock.calls[0][0]).toEqual({
        active: true,
        bounds: { x: 10, y: 10, width: 30, height: 30 },
        lastShapeType: "rectangle",
      });
      expect(canvas.getSnapshot().selection?.active).toBe(true);

      canvas.clearSelection();
      expect(canvas.hasSelection()).toBe(false);
      expect(canvas.getSnapshot().selection?.active).toBe(false);
    });

    it("clips clearActiveLayer and fillActiveLayer strictly to selection mask pixels", () => {
      canvas.fillActiveLayer("#ff0000");
      canvas.selectRectangle(20, 20, 30, 30);
      canvas.clearActiveLayer();

      // Inside selection is erased
      expect(canvas.getColorAt(30, 30, "activeLayer").a).toBe(0);
      // Outside selection remains solid red
      expect(canvas.getColorAt(10, 10, "activeLayer").hex).toBe("#ff0000");
      expect(canvas.getColorAt(60, 60, "activeLayer").hex).toBe("#ff0000");

      // Undo clear restores red inside selection
      canvas.undo();
      expect(canvas.getColorAt(30, 30, "activeLayer").hex).toBe("#ff0000");

      // Now fill blue only inside a fresh layer's selection
      const layer2 = canvas.createLayer("FillClipped");
      canvas.setActiveLayer(layer2.id);
      canvas.selectRectangle(40, 40, 20, 20);
      canvas.fillActiveLayer("#0000ff");

      expect(canvas.getColorAt(50, 50, "activeLayer").hex).toBe("#0000ff");
      expect(canvas.getColorAt(10, 10, "activeLayer").a).toBe(0);
      expect(canvas.getColorAt(70, 70, "activeLayer").a).toBe(0);
    });

    it("clips drawRectangle, drawEllipse, and floodFill strictly inside lasso/rect selection", () => {
      canvas.selectRectangle(20, 20, 40, 40);

      // Draw a full-canvas green rectangle: only pixels inside [20..60, 20..60] may be painted
      canvas.drawRectangle({
        x: 0,
        y: 0,
        width: 120,
        height: 120,
        fillColor: "#00ff00",
        stroke: false,
      });

      expect(canvas.getColorAt(35, 35, "activeLayer").hex).toBe("#00ff00");
      expect(canvas.getColorAt(10, 10, "activeLayer").a).toBe(0);
      expect(canvas.getColorAt(70, 70, "activeLayer").a).toBe(0);

      // Draw an overlapping blue ellipse centered at (60, 40) radius 30 -> left half inside selection, right half clipped
      canvas.drawEllipse({
        x: 60,
        y: 40,
        radiusX: 30,
        radiusY: 30,
        fillColor: "#0000ff",
        stroke: false,
      });

      expect(canvas.getColorAt(50, 40, "activeLayer").hex).toBe("#0000ff");
      expect(canvas.getColorAt(70, 40, "activeLayer").a).toBe(0);

      // Flood fill starting outside selection is ignored
      canvas.floodFill(5, 5, "#ffff00");
      expect(canvas.getColorAt(5, 5, "activeLayer").a).toBe(0);
    });

    it("records and replays selection actions cleanly onto a new Canvas", async () => {
      canvas.selectRectangle(15, 25, 35, 45);
      canvas.selectEllipse(40, 50, 10, 10, 0, "add");
      const expectedBounds = canvas.getSelectionBounds();

      const log = canvas.getActionLog();
      expect(log.map((a) => a.type)).toEqual([
        "selectRectangle",
        "selectEllipse",
      ]);

      const replayEl = document.createElement("canvas");
      replayEl.width = 120;
      replayEl.height = 120;
      const replayCanvas = new Canvas({
        canvas: replayEl,
        document: { width: 120, height: 120 },
      });

      await replayCanvas.replay(log);
      expect(replayCanvas.hasSelection()).toBe(true);
      expect(replayCanvas.getSelectionBounds()).toEqual(expectedBounds);
      expect(replayCanvas.selection.containsPoint(20, 30)).toBe(true);
      expect(replayCanvas.selection.containsPoint(5, 5)).toBe(false);
      expect(replayCanvas.getActionLog()).toHaveLength(0);
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Native Commands for Raster Operations", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let canvasEl: HTMLCanvasElement;
  let canvas: Canvas;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    canvasEl = document.createElement("canvas");
    canvasEl.width = 100;
    canvasEl.height = 100;
    document.body.appendChild(canvasEl);

    canvas = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  it("clears and restores active layer pixels with clearActiveLayer() + undo/redo", () => {
    canvas.fillActiveLayer("#ff0000");
    expect(canvas.getColorAt(10, 10, "activeLayer").hex).toBe("#ff0000");

    canvas.clearActiveLayer();
    expect(canvas.getColorAt(10, 10, "activeLayer").a).toBe(0);
    expect(canvas.history.canUndo()).toBe(true);

    canvas.undo();
    expect(canvas.getColorAt(10, 10, "activeLayer").hex).toBe("#ff0000");

    canvas.redo();
    expect(canvas.getColorAt(10, 10, "activeLayer").a).toBe(0);
  });

  it("fills active layer and distinguishes composite vs activeLayer and out-of-bounds in getColorAt()", () => {
    canvas.fillActiveLayer("#ff0000");
    const layer2 = canvas.createLayer("Top");
    canvas.setActiveLayer(layer2.id);
    canvas.drawRectangle({
      x: 20,
      y: 20,
      width: 20,
      height: 20,
      fillColor: "#0000ff",
      stroke: false,
    });

    // At (30,30) both activeLayer and composite are blue
    expect(canvas.getColorAt(30, 30, "activeLayer")).toMatchObject({
      r: 0,
      g: 0,
      b: 255,
      a: 255,
      hex: "#0000ff",
      rgba: "rgba(0, 0, 255, 1)",
    });
    expect(canvas.getColorAt(30, 30, "composite").hex).toBe("#0000ff");

    // At (5,5) activeLayer is transparent, composite reveals red base layer
    expect(canvas.getColorAt(5, 5, "activeLayer")).toMatchObject({
      a: 0,
      rgba: "rgba(0, 0, 0, 0)",
    });
    expect(canvas.getColorAt(5, 5, "composite").hex).toBe("#ff0000");

    // Out-of-bounds returns zeroed transparent black
    expect(canvas.getColorAt(-5, 50, "composite")).toEqual({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
      hex: "#000000",
      rgba: "rgba(0, 0, 0, 0)",
    });
    expect(canvas.getColorAt(100, 100, "activeLayer").a).toBe(0);
  });

  it("performs enclosed bucket fill with floodFill(), tolerance matching, same-color no-op, and undo/redo", () => {
    // Draw red rect [10..50] with slightly different red core and enclosing boundary
    canvas.drawRectangle({
      x: 10,
      y: 10,
      width: 40,
      height: 40,
      fillColor: "#ff0000",
      stroke: false,
    });
    canvas.drawRectangle({
      x: 20,
      y: 20,
      width: 10,
      height: 10,
      fillColor: "#fa0505", // within tolerance=10 of #ff0000
      stroke: false,
    });

    // Flood fill with tolerance=0 replaces only #fa0505 inner square
    canvas.floodFill(25, 25, "#ffff00", 0);
    expect(canvas.getColorAt(25, 25, "activeLayer").hex).toBe("#ffff00");
    expect(canvas.getColorAt(12, 12, "activeLayer").hex).toBe("#ff0000");

    // Undo and re-run with tolerance=10 to cross both shades while staying outside [0..9] transparent zone
    canvas.undo();
    canvas.floodFill(25, 25, "#ffff00", 10);
    expect(canvas.getColorAt(25, 25, "activeLayer").hex).toBe("#ffff00");
    expect(canvas.getColorAt(12, 12, "activeLayer").hex).toBe("#ffff00");
    expect(canvas.getColorAt(5, 5, "activeLayer").a).toBe(0);

    // Same-color floodFill should not push a duplicate history entry
    const countBeforeSame = canvas.history.getEntries().length;
    canvas.floodFill(25, 25, "#ffff00", 0);
    expect(canvas.history.getEntries().length).toBe(countBeforeSame);

    // Out-of-bounds floodFill is ignored
    canvas.floodFill(-1, 50, "#00ff00");
    expect(canvas.history.getEntries().length).toBe(countBeforeSame);
  });

  it("preserves pixel alpha channel and leaves zero-alpha pixels untouched when alphaLock is true", () => {
    const active = canvas.getActiveLayer();
    const ctx = active.canvas.getContext("2d")!;
    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
    ctx.fillRect(10, 10, 40, 40);

    const initialSample = canvas.getColorAt(20, 20, "activeLayer");
    const initialA = initialSample.a;
    expect(initialA).toBeGreaterThan(0);
    expect(initialA).toBeLessThan(255);

    canvas.updateLayer(active.id, { alphaLock: true });

    // Transparent pixel flood fill is ignored under alphaLock
    canvas.floodFill(0, 0, "#00ff00");
    expect(canvas.getColorAt(0, 0, "activeLayer").a).toBe(0);

    // Semi-transparent rectangle receives new RGB while preserving exact alpha
    canvas.floodFill(20, 20, "#0000ff", 10);
    const filled = canvas.getColorAt(20, 20, "activeLayer");
    expect(filled.hex).toBe("#0000ff");
    expect(filled.a).toBe(initialA);
    expect(canvas.getColorAt(5, 5, "activeLayer").a).toBe(0);

    // Also fillActiveLayer under alphaLock keeps transparent outside untouched
    canvas.fillActiveLayer("#00ff00");
    expect(canvas.getColorAt(20, 20, "activeLayer").hex).toBe("#00ff00");
    expect(canvas.getColorAt(20, 20, "activeLayer").a).toBe(initialA);
    expect(canvas.getColorAt(5, 5, "activeLayer").a).toBe(0);

    canvas.undo();
    expect(canvas.getColorAt(20, 20, "activeLayer").hex).toBe("#0000ff");
    canvas.undo();
    expect(canvas.getColorAt(20, 20, "activeLayer").hex).toBe("#ff0000");
    expect(canvas.getColorAt(20, 20, "activeLayer").a).toBe(initialA);
  });

  it("syncs brush isAlphaLocked when updateLayer or setActiveLayer is called", () => {
    const active = canvas.getActiveLayer();
    expect(canvas.getBrush().isAlphaLocked).toBe(false);

    canvas.updateLayer(active.id, { alphaLock: true });
    expect(canvas.getBrush().isAlphaLocked).toBe(true);

    const layer2 = canvas.createLayer({ name: "L2", alphaLock: false });
    expect(canvas.getBrush().isAlphaLocked).toBe(false);

    canvas.setActiveLayer(active.id);
    expect(canvas.getBrush().isAlphaLocked).toBe(true);
    expect(layer2.alphaLock).toBe(false);
  });

  it("preserves fill pixels when drawing brush strokes afterwards", () => {
    canvas.fillActiveLayer("#ff0000");
    expect(canvas.getColorAt(20, 20, "activeLayer").hex).toBe("#ff0000");

    canvasEl.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 50,
        pointerId: 1,
      }),
    );

    expect(canvas.getColorAt(20, 20, "activeLayer").hex).toBe("#ff0000");
  });

  it("draws filled/stroked rectangle, ellipse, line, and text with verified geometry and undo", () => {
    // 1. Rectangle with fill + stroke
    canvas.drawRectangle({
      x: 10,
      y: 10,
      width: 30,
      height: 20,
      fillColor: "#00ffff",
      strokeColor: "#111111",
      strokeWidth: 2,
    });
    expect(canvas.getColorAt(25, 20, "activeLayer").hex).toBe("#00ffff");
    expect(canvas.getColorAt(10, 10, "activeLayer").hex).toBe("#111111");
    expect(canvas.getColorAt(5, 5, "activeLayer").a).toBe(0);

    // 2. Ellipse
    canvas.drawEllipse({
      x: 70,
      y: 30,
      radiusX: 15,
      radiusY: 10,
      fillColor: "#ff00ff",
      stroke: false,
    });
    expect(canvas.getColorAt(70, 30, "activeLayer").hex).toBe("#ff00ff");
    expect(canvas.getColorAt(55, 20, "activeLayer").a).toBe(0); // outside corner of ellipse AABB

    // 3. Line
    canvas.drawLine({
      x1: 10,
      y1: 70,
      x2: 90,
      y2: 70,
      strokeColor: "#123456",
      strokeWidth: 4,
    });
    expect(canvas.getColorAt(50, 70, "activeLayer").hex).toBe("#123456");
    expect(canvas.getColorAt(50, 85, "activeLayer").a).toBe(0);

    // 4. Text
    canvas.drawText("Test", 10, 80, {
      fontSize: 16,
      color: "#abcdef",
    });
    expect(canvas.getColorAt(12, 85, "activeLayer").hex).toBe("#abcdef");
    expect(canvas.history.getEntries().at(-1)?.description).toBe(
      'Draw text "Test"',
    );

    // Undo text clears its pixels cleanly
    canvas.undo();
    expect(canvas.getColorAt(12, 85, "activeLayer").a).toBe(0);
    // Line remains intact
    expect(canvas.getColorAt(50, 70, "activeLayer").hex).toBe("#123456");
  });

  it("skips completely off-document commands without pushing history patches", () => {
    expect(() => {
      canvas.drawRectangle({ x: 200, y: 200, width: 10, height: 10 });
      canvas.drawEllipse({ x: 200, y: 200, radiusX: 10, radiusY: 5 });
      canvas.drawLine({ x1: 200, y1: 200, x2: 300, y2: 300 });
      canvas.drawText("Outside", 200, 200);
      canvas.drawText("", 10, 10);
    }).not.toThrow();

    expect(canvas.history.canUndo()).toBe(false);
    expect(canvas.getActionLog()).toHaveLength(0);
  });
});

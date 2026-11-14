import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { Brush } from "../src/Brush";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Canvas2D Realistic Integration Tests", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let canvasEl: HTMLCanvasElement;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    canvasEl = document.createElement("canvas");
    canvasEl.width = 100;
    canvasEl.height = 100;
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  it("integrates real Brush instance with Canvas layer raster compositing and frozen snapshots", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });

    expect(painter.brush).toBeInstanceOf(Brush);
    expect(painter.getLayers()).toHaveLength(1);

    const snapshot = painter.getSnapshot();
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.layers)).toBe(true);
    expect(snapshot.layers[0]).toMatchObject({ width: 100, height: 100 });
  });

  it("composites layer order accurately before and after reorderLayers()", () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
    });

    const bottomLayer = painter.getActiveLayer();
    painter.drawRectangle({
      x: 10,
      y: 10,
      width: 50,
      height: 50,
      fillColor: "#ff0000",
      stroke: false,
    });

    const topLayer = painter.createLayer("Top");
    painter.setActiveLayer(topLayer.id);
    painter.drawRectangle({
      x: 20,
      y: 20,
      width: 50,
      height: 50,
      fillColor: "#0000ff",
      stroke: false,
    });

    // Overlap at (35,35): topLayer (blue) is above bottomLayer (red)
    expect(painter.getColorAt(35, 35, "composite").hex).toBe("#0000ff");
    // Non-overlap at (12,12): red
    expect(painter.getColorAt(12, 12, "composite").hex).toBe("#ff0000");

    // Reorder so bottomLayer sits above topLayer -> overlap flips to red!
    painter.reorderLayers([topLayer.id, bottomLayer.id]);
    expect(painter.getColorAt(35, 35, "composite").hex).toBe("#ff0000");
    // Non-overlap on topLayer at (60,60) remains blue
    expect(painter.getColorAt(60, 60, "composite").hex).toBe("#0000ff");

    // Undo topLayer rect, then redo it -> pixel integrity preserved
    painter.undo();
    expect(painter.getColorAt(60, 60, "composite").a).toBe(0);
    painter.redo();
    expect(painter.getColorAt(60, 60, "composite").hex).toBe("#0000ff");
  });

  it("draws real pointer strokes, clears via resetArtwork(), and replays stroke pixels identically", async () => {
    const painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 100 },
      brush: { size: 10, color: "#00ff00", opacity: 1, flow: 1 },
    });

    const initialLayerId = painter.getActiveLayer().id;

    // 1. Draw multi-point stroke across (10,10)->(50,50)
    canvasEl.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 1,
        clientX: 10,
        clientY: 10,
      }),
    );
    canvasEl.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerId: 1,
        clientX: 50,
        clientY: 50,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    await painter.brush.flush();

    // 2. Draw single-point dot at (80,80)
    canvasEl.dispatchEvent(
      new PointerEvent("pointerdown", {
        pointerId: 2,
        clientX: 80,
        clientY: 80,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }));
    await painter.brush.flush();

    expect(painter.getColorAt(30, 30, "activeLayer").hex).toBe("#00ff00");
    expect(painter.getColorAt(80, 80, "activeLayer").hex).toBe("#00ff00");
    expect(painter.getColorAt(95, 5, "activeLayer").a).toBe(0);

    const log = painter.getActionLog();
    expect(log).toHaveLength(2);

    // 3. Reset artwork clears all pixels while preserving log and base layer ID
    painter.resetArtwork();
    expect(painter.getActiveLayer().id).toBe(initialLayerId);
    expect(
      canvasEnv.countNonTransparentPixels(painter.getActiveLayer().canvas),
    ).toBe(0);
    expect(painter.getActionLog()).toHaveLength(2);

    // 4. Replay recorded strokes restores green pixels at both stroke locations
    await painter.replay(log);
    expect(painter.getActionLog()).toHaveLength(2);
    expect(painter.getColorAt(30, 30, "activeLayer").hex).toBe("#00ff00");
    expect(painter.getColorAt(80, 80, "activeLayer").hex).toBe("#00ff00");
    expect(painter.getColorAt(95, 5, "activeLayer").a).toBe(0);
  });
});

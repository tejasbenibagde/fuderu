import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Canvas } from "../src/Canvas";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Advanced Layer Controls", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let domCanvas: HTMLCanvasElement;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    domCanvas = document.createElement("canvas");
    domCanvas.width = 50;
    domCanvas.height = 50;
  });

  afterEach(() => {
    canvasEnv.restore();
  });

  describe("Alpha Lock", () => {
    it("should initialize with alphaLock = false and preserve transparency across all draw commands", () => {
      const fuderu = new Canvas({
        canvas: domCanvas,
        document: { width: 20, height: 20 },
      });
      const layer = fuderu.getActiveLayer();
      expect(layer.alphaLock).toBe(false);

      // Draw a 6x6 red square at (2, 2)
      fuderu.drawRectangle({
        x: 2,
        y: 2,
        width: 6,
        height: 6,
        fillColor: "#ff0000",
      });
      expect(fuderu.getColorAt(4, 4, "activeLayer").hex).toBe("#ff0000");
      expect(fuderu.getColorAt(15, 15, "activeLayer").a).toBe(0);

      // Enable alpha lock
      fuderu.updateLayer(layer.id, { alphaLock: true });
      expect(layer.alphaLock).toBe(true);
      expect(fuderu.brush.isAlphaLocked).toBe(true);

      // fillActiveLayer only paints existing opaque pixels
      fuderu.fillActiveLayer("#0000ff");
      expect(fuderu.getColorAt(4, 4, "activeLayer").hex).toBe("#0000ff");
      expect(fuderu.getColorAt(15, 15, "activeLayer").a).toBe(0);

      // drawRectangle overlapping both opaque and transparent areas
      fuderu.drawRectangle({
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        fillColor: "#00ff00",
      });
      expect(fuderu.getColorAt(4, 4, "activeLayer").hex).toBe("#00ff00");
      expect(fuderu.getColorAt(15, 15, "activeLayer").a).toBe(0);

      // drawLine crossing opaque and transparent areas
      fuderu.drawLine({
        x1: 0,
        y1: 5,
        x2: 19,
        y2: 5,
        strokeColor: "#ffffff",
        strokeWidth: 2,
      });
      expect(fuderu.getColorAt(5, 5, "activeLayer").hex).toBe("#ffffff");
      expect(fuderu.getColorAt(15, 5, "activeLayer").a).toBe(0);
    });

    it("should prevent floodFill on transparent area when alphaLock is true", () => {
      const fuderu = new Canvas({
        canvas: domCanvas,
        document: { width: 10, height: 10 },
      });
      const layer = fuderu.getActiveLayer();
      fuderu.updateLayer(layer.id, { alphaLock: true });

      fuderu.floodFill(2, 2, "#00ff00");
      expect(fuderu.getColorAt(2, 2, "activeLayer").a).toBe(0);
    });
  });

  describe("Compositing: visibility, opacity, and blend modes", () => {
    it("excludes invisible layers and composites opacity and blend modes accurately", () => {
      const fuderu = new Canvas({
        canvas: domCanvas,
        document: { width: 20, height: 20 },
      });

      const base = fuderu.getActiveLayer();
      fuderu.fillActiveLayer("#ff0000");

      const top = fuderu.createLayer({
        name: "MultiplyLayer",
        blendMode: "multiply",
      });
      fuderu.fillActiveLayer("#00ff00");

      // Red * Green under multiply => Black
      expect(fuderu.getColorAt(10, 10, "composite")).toMatchObject({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      });

      // Switch to screen => Yellow
      fuderu.updateLayer(top.id, { blendMode: "screen" });
      expect(fuderu.getColorAt(10, 10, "composite")).toMatchObject({
        r: 255,
        g: 255,
        b: 0,
        a: 255,
      });

      // Hide top layer => falls back to base red
      fuderu.updateLayer(top.id, { visible: false });
      expect(fuderu.getColorAt(10, 10, "composite").hex).toBe("#ff0000");

      // Unhide top layer with source-over at ~50% opacity
      fuderu.updateLayer(top.id, {
        visible: true,
        blendMode: "source-over",
        opacity: 0.5,
      });
      const blended = fuderu.getColorAt(10, 10, "composite");
      expect(blended.r).toBeGreaterThan(120);
      expect(blended.g).toBeGreaterThan(120);
      expect(base.id).not.toBe(top.id);
    });
  });

  describe("Layer Lock & Direct Methods", () => {
    it("blocks deletion, pointer strokes, and raster commands when locked", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const bg = fuderu.getActiveLayer();
      expect(bg.locked).toBe(false);

      const l2 = fuderu.createLayer("Layer 2");
      fuderu.updateLayer(l2.id, { locked: true });
      expect(l2.locked).toBe(true);

      expect(() => fuderu.deleteLayer(l2.id)).toThrow(
        "Cannot delete locked layer",
      );
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

      domCanvas.dispatchEvent(
        new PointerEvent("pointerdown", {
          pointerId: 1,
          clientX: 10,
          clientY: 10,
        }),
      );
      expect((fuderu as unknown as { isDrawing: boolean }).isDrawing).toBe(
        false,
      );
    });

    it("supports getLayers, getLayerById, reorderLayers, and undo/redo for layer properties", () => {
      const fuderu = new Canvas({ canvas: domCanvas });
      const bg = fuderu.getLayers()[0];
      const l2 = fuderu.createLayer("Layer 2");
      const l3 = fuderu.createLayer("Layer 3");

      expect(fuderu.getLayers().map((l) => l.id)).toEqual([
        bg.id,
        l2.id,
        l3.id,
      ]);
      expect(fuderu.getLayerById(l2.id)?.name).toBe("Layer 2");
      expect(fuderu.getLayerById("non-existent-id")).toBeUndefined();

      fuderu.reorderLayers([l3.id, bg.id, l2.id]);
      expect(fuderu.getLayers().map((l) => l.id)).toEqual([
        l3.id,
        bg.id,
        l2.id,
      ]);

      fuderu.updateLayer(l3.id, { alphaLock: true });
      expect(l3.alphaLock).toBe(true);
      fuderu.undo();
      expect(l3.alphaLock).toBe(false);
      fuderu.redo();
      expect(l3.alphaLock).toBe(true);

      fuderu.updateLayer(l3.id, { locked: true, opacity: 0.4 });
      expect(l3.locked).toBe(true);
      expect(l3.opacity).toBeCloseTo(0.4);
      fuderu.undo();
      expect(l3.locked).toBe(false);
      fuderu.undo();
      expect(l3.opacity).toBe(1);
    });
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import {
  migrateDocument,
  CURRENT_DOCUMENT_VERSION,
} from "../src/types/document";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Document Persistence API & Schema Migration", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let canvasEl: HTMLCanvasElement;
  let painter: Canvas;
  let originalImage: typeof Image;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    originalImage = globalThis.Image;

    globalThis.Image = class MockImage {
      public crossOrigin = "";
      public onload: (() => void) | null = null;
      public onerror: ((err: unknown) => void) | null = null;
      public width = 0;
      public height = 0;
      public naturalWidth = 0;
      public naturalHeight = 0;
      private _src = "";

      get src() {
        return this._src;
      }
      set src(val: string) {
        this._src = val;
        const snap = canvasEnv.encodedSnapshots.get(val);
        if (snap) {
          this.width = snap.width;
          this.height = snap.height;
          this.naturalWidth = snap.width;
          this.naturalHeight = snap.height;
        }
        setTimeout(() => {
          if (val.includes("broken")) {
            this.onerror?.(new Error("decode failed"));
          } else {
            this.onload?.();
          }
        }, 0);
      }
    } as unknown as typeof Image;

    canvasEl = document.createElement("canvas");
    painter = new Canvas({
      canvas: canvasEl,
      document: { width: 100, height: 80 },
    });
  });

  afterEach(() => {
    globalThis.Image = originalImage;
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("migrateDocument schema validation", () => {
    it("rejects non-objects, invalid dimensions, non-array layers, and unsupported future versions", () => {
      expect(() => migrateDocument(null)).toThrow("payload must be an object");
      expect(() => migrateDocument("invalid")).toThrow(
        "payload must be an object",
      );
      expect(() =>
        migrateDocument({ width: 0, height: 100, layers: [] }),
      ).toThrow("width and height must be positive numbers");
      expect(() =>
        migrateDocument({ width: 100, height: -5, layers: [] }),
      ).toThrow("width and height must be positive numbers");
      expect(() =>
        migrateDocument({ width: 100, height: 100, layers: "not-array" }),
      ).toThrow("layers must be an array");
      expect(() =>
        migrateDocument({
          version: CURRENT_DOCUMENT_VERSION + 1,
          width: 100,
          height: 100,
          layers: [],
        }),
      ).toThrow("Unsupported document version");
    });

    it("normalizes missing optional fields and clamps out-of-range layer opacity", () => {
      const migrated = migrateDocument({
        width: 200,
        height: 150,
        layers: [
          { opacity: 5 },
          {
            id: "l2",
            name: "Top",
            opacity: -0.5,
            visible: false,
            alphaLock: 1,
          },
        ],
      });

      expect(migrated.version).toBe(CURRENT_DOCUMENT_VERSION);
      expect(migrated.layers[0]).toMatchObject({
        id: "layer-0",
        name: "Layer 1",
        visible: true,
        opacity: 1,
        blendMode: "source-over",
        alphaLock: false,
        locked: false,
        dataUrl: "",
      });
      expect(migrated.layers[1]).toMatchObject({
        id: "l2",
        name: "Top",
        visible: false,
        opacity: 0,
        alphaLock: true,
      });
    });
  });

  describe("exportDocument & exportPNG", () => {
    it("exports document metadata, active layer ID, and requested bitmap format/quality", async () => {
      const layer2 = painter.createLayer({
        name: "Foreground",
        alphaLock: true,
        locked: false,
      });
      painter.setActiveLayer(layer2.id);

      const pngDoc = await painter.exportDocument();
      expect(pngDoc.version).toBe(1);
      expect(pngDoc.width).toBe(100);
      expect(pngDoc.height).toBe(80);
      expect(pngDoc.activeLayerId).toBe(layer2.id);
      expect(pngDoc.layers).toHaveLength(2);
      expect(pngDoc.layers[0].dataUrl).toContain("data:image/png;base64");

      const jpegDoc = await painter.exportDocument({
        bitmap: "jpeg",
        quality: 0.75,
      });
      expect(jpegDoc.layers[0].dataUrl).toContain("data:image/jpeg;base64");
      expect(jpegDoc.layers[0].dataUrl).toContain("q=0.75");
    });

    it("exportPNG composites visible layers only and paints #ffffff background when requested", async () => {
      const bg = painter.getActiveLayer();
      bg.ctx.fillStyle = "#ff0000";
      bg.ctx.fillRect(0, 0, 20, 20);

      painter.createLayer({ name: "Hidden", visible: false });
      const hidden = painter.getActiveLayer();
      hidden.ctx.fillStyle = "#00ff00";
      hidden.ctx.fillRect(40, 40, 20, 20);

      const transparentPng = await painter.exportPNG();
      const transparentSnap = canvasEnv.encodedSnapshots.get(transparentPng)!;
      // Red layer pixel included; hidden green pixel excluded; background pixel stays transparent
      expect(
        Array.from(
          transparentSnap.data.slice(
            (10 * 100 + 10) * 4,
            (10 * 100 + 10) * 4 + 4,
          ),
        ),
      ).toEqual([255, 0, 0, 255]);
      expect(transparentSnap.data[(50 * 100 + 50) * 4 + 3]).toBe(0);
      expect(transparentSnap.data[(70 * 100 + 90) * 4 + 3]).toBe(0);

      const whiteBgPng = await painter.exportPNG({ includeBackground: true });
      const whiteBgSnap = canvasEnv.encodedSnapshots.get(whiteBgPng)!;
      expect(
        Array.from(
          whiteBgSnap.data.slice((70 * 100 + 90) * 4, (70 * 100 + 90) * 4 + 4),
        ),
      ).toEqual([255, 255, 255, 255]);
    });
  });

  describe("importDocument & Pixel Round-Trip", () => {
    it("clears existing history and rejects when a layer image fails to decode", async () => {
      painter.drawRectangle({
        x: 5,
        y: 5,
        width: 10,
        height: 10,
        fillColor: "#ff0000",
      });
      expect(painter.history.canUndo()).toBe(true);

      await expect(
        painter.importDocument({
          version: 1,
          width: 100,
          height: 80,
          layers: [
            {
              id: "l1",
              name: "Broken",
              visible: true,
              opacity: 1,
              blendMode: "source-over",
              dataUrl: "data:image/png;base64,brokenImage",
            },
          ],
        }),
      ).rejects.toThrow('Failed to load image for layer "Broken"');
    });

    it("preserves exact RGBA pixels and layer metadata across exportDocument -> importDocument", async () => {
      const layer1 = painter.getActiveLayer();
      painter.updateLayer(layer1.id, {
        name: "Base Background",
        opacity: 0.9,
      });
      painter.drawRectangle({
        x: 5,
        y: 5,
        width: 25,
        height: 25,
        fillColor: "#ff0000",
        stroke: false,
      });

      const layer2 = painter.createLayer({
        name: "Inking Pass",
        opacity: 0.75,
        blendMode: "multiply",
        locked: false,
      });
      painter.drawRectangle({
        x: 40,
        y: 30,
        width: 20,
        height: 20,
        fillColor: "#00ff00",
        stroke: false,
      });
      painter.updateLayer(layer2.id, { alphaLock: true });

      painter.setActiveLayer(layer2.id);

      const exportedDoc = await painter.exportDocument();

      const canvasEl2 = document.createElement("canvas");
      const painter2 = new Canvas({
        canvas: canvasEl2,
        document: { width: 50, height: 50 },
      });
      painter2.drawRectangle({
        x: 0,
        y: 0,
        width: 10,
        height: 10,
        fillColor: "#0000ff",
      });
      expect(painter2.history.canUndo()).toBe(true);

      await painter2.importDocument(exportedDoc);

      expect(painter2.documentWidth).toBe(100);
      expect(painter2.documentHeight).toBe(80);
      expect(painter2.history.canUndo()).toBe(false);
      expect(painter2.history.canRedo()).toBe(false);
      expect(painter2.getActiveLayer().id).toBe(layer2.id);

      const importedLayers = painter2.getLayers();
      expect(importedLayers).toHaveLength(2);
      expect(importedLayers[0]).toMatchObject({
        id: layer1.id,
        name: "Base Background",
        opacity: 0.9,
      });
      expect(importedLayers[1]).toMatchObject({
        id: layer2.id,
        name: "Inking Pass",
        opacity: 0.75,
        blendMode: "multiply",
        alphaLock: true,
        locked: false,
      });

      // Exact pixels preserved per layer
      expect(canvasEnv.getPixel(importedLayers[0].canvas, 15, 15)).toEqual([
        255, 0, 0, 255,
      ]);
      expect(canvasEnv.getPixel(importedLayers[1].canvas, 50, 40)).toEqual([
        0, 255, 0, 255,
      ]);
      expect(canvasEnv.getPixel(importedLayers[1].canvas, 15, 15)[3]).toBe(0);
    });
  });
});

import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import type { FuderuDocument } from "../src/types/document";

const mockBrushInstance = {
  isSmooth: true,
  isSpacing: true,
  config: { size: 10 },
  putPoint: vi.fn(),
  render: vi.fn(),
  finalizeStroke: vi.fn(),
  clear: vi.fn(),
  loadConfig: vi.fn(),
  loadImageAsync: vi.fn(),
  loadContext: vi.fn(),
  syncOriCanvas: vi.fn(),
};

vi.mock("../src/Brush", () => {
  return {
    Brush: vi.fn(function () {
      return mockBrushInstance;
    }),
  };
});

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (contextId: string) {
      if (contextId === "2d") {
        return {
          scale: vi.fn(),
          setTransform: vi.fn(),
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({
            data: [],
            width: 100,
            height: 100,
          })),
          putImageData: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          fill: vi.fn(),
          ellipse: vi.fn(),
          translate: vi.fn(),
          rotate: vi.fn(),
          fillRect: vi.fn(),
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    },
  );

  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation(
    function (type = "image/png") {
      return `data:${type};base64,mockImageData`;
    },
  );
});

describe("Document Persistence API", () => {
  let canvasEl: HTMLCanvasElement;
  let painter: Canvas;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasEl = document.createElement("canvas");
    painter = new Canvas({
      canvas: canvasEl,
      document: { width: 500, height: 400 },
    });
  });

  describe("exportDocument", () => {
    it("should export a valid FuderuDocument payload with layers and dimensions", async () => {
      const layer2 = painter.createLayer({
        name: "Foreground",
        alphaLock: true,
        locked: false,
      });
      painter.setActiveLayer(layer2.id);

      const doc = await painter.exportDocument();

      expect(doc.version).toBe(1);
      expect(doc.width).toBe(500);
      expect(doc.height).toBe(400);
      expect(doc.layers.length).toBe(2);
      expect(doc.activeLayerId).toBe(layer2.id);

      expect(doc.layers[0].name).toBe("Background");
      expect(doc.layers[0].dataUrl).toContain("data:image/png;base64");
      expect(doc.layers[1].name).toBe("Foreground");
      expect(doc.layers[1].alphaLock).toBe(true);
      expect(doc.layers[1].locked).toBe(false);
    });

    it("should support custom bitmap format option", async () => {
      const doc = await painter.exportDocument({
        bitmap: "jpeg",
        quality: 0.8,
      });
      expect(doc.layers[0].dataUrl).toContain("data:image/jpeg;base64");
    });
  });

  describe("importDocument", () => {
    it("should throw error when given invalid document payload", async () => {
      await expect(
        painter.importDocument(null as unknown as FuderuDocument),
      ).rejects.toThrow("Invalid FuderuDocument payload");
      await expect(
        painter.importDocument({ width: -10 } as unknown as FuderuDocument),
      ).rejects.toThrow("Invalid FuderuDocument payload");
    });

    it("should atomically load a document and restore layer structure", async () => {
      // Mock Image loading for node / vitest canvas environment
      const originalImage = globalThis.Image;
      globalThis.Image = class MockImage {
        public crossOrigin = "";
        public onload: (() => void) | null = null;
        public onerror: ((err: unknown) => void) | null = null;
        private _src = "";

        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as unknown as typeof Image;

      const docToImport: FuderuDocument = {
        version: 1,
        width: 800,
        height: 600,
        activeLayerId: "layer-2",
        layers: [
          {
            id: "layer-1",
            name: "Background Imported",
            visible: true,
            opacity: 1,
            blendMode: "source-over",
            dataUrl: "data:image/png;base64,mockLayer1",
          },
          {
            id: "layer-2",
            name: "Sketch Imported",
            visible: true,
            opacity: 0.8,
            blendMode: "multiply",
            alphaLock: true,
            locked: true,
            dataUrl: "data:image/png;base64,mockLayer2",
          },
        ],
      };

      await painter.importDocument(docToImport);

      expect(painter.documentWidth).toBe(800);
      expect(painter.documentHeight).toBe(600);

      const layers = painter.getLayers();
      expect(layers.length).toBe(2);
      expect(layers[0].id).toBe("layer-1");
      expect(layers[0].name).toBe("Background Imported");
      expect(layers[1].id).toBe("layer-2");
      expect(layers[1].name).toBe("Sketch Imported");
      expect(layers[1].blendMode).toBe("multiply");
      expect(layers[1].opacity).toBe(0.8);
      expect(layers[1].alphaLock).toBe(true);
      expect(layers[1].locked).toBe(true);
      expect(painter.getActiveLayer().id).toBe("layer-2");

      globalThis.Image = originalImage;
    });
  });

  describe("exportPNG", () => {
    it("should export composite artwork as PNG data URL", async () => {
      const pngUrl = await painter.exportPNG();
      expect(pngUrl).toContain("data:image/png;base64");
    });

    it("should accept includeBackground option", async () => {
      const pngUrl = await painter.exportPNG({ includeBackground: true });
      expect(pngUrl).toContain("data:image/png;base64");
    });
  });

  describe("Persistence Round-Trip Testing", () => {
    it("should perform lossless metadata and data URL round-trip export and import", async () => {
      // 1. Setup multi-layer document with varied attributes
      const originalImage = globalThis.Image;
      globalThis.Image = class MockImage {
        public crossOrigin = "";
        public onload: (() => void) | null = null;
        public onerror: ((err: unknown) => void) | null = null;
        private _src = "";

        get src() {
          return this._src;
        }
        set src(val: string) {
          this._src = val;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as unknown as typeof Image;

      const layer1 = painter.getActiveLayer();
      painter.updateLayer(layer1.id, {
        name: "Base Background",
        opacity: 0.9,
        blendMode: "source-over",
      });

      const layer2 = painter.createLayer({
        name: "Inking Pass",
        opacity: 0.75,
        blendMode: "multiply",
        alphaLock: true,
        locked: false,
      });

      painter.createLayer({
        name: "Highlights (Locked)",
        opacity: 0.5,
        blendMode: "screen",
        alphaLock: false,
        locked: true,
      });

      painter.setActiveLayer(layer2.id);

      // 2. Export document
      const exportedDoc = await painter.exportDocument();
      expect(exportedDoc.version).toBe(1);
      expect(exportedDoc.width).toBe(500);
      expect(exportedDoc.height).toBe(400);
      expect(exportedDoc.activeLayerId).toBe(layer2.id);
      expect(exportedDoc.layers.length).toBe(3);

      // 3. Import into a fresh Canvas instance
      const canvasEl2 = document.createElement("canvas");
      const painter2 = new Canvas({
        canvas: canvasEl2,
        document: { width: 100, height: 100 },
      });

      await painter2.importDocument(exportedDoc);

      // 4. Verify round-trip fidelity
      expect(painter2.documentWidth).toBe(exportedDoc.width);
      expect(painter2.documentHeight).toBe(exportedDoc.height);
      expect(painter2.getActiveLayer().id).toBe(layer2.id);

      const importedLayers = painter2.getLayers();
      expect(importedLayers.length).toBe(exportedDoc.layers.length);

      for (let i = 0; i < exportedDoc.layers.length; i++) {
        const exportedLayer = exportedDoc.layers[i];
        const importedLayer = importedLayers[i];

        expect(importedLayer.id).toBe(exportedLayer.id);
        expect(importedLayer.name).toBe(exportedLayer.name);
        expect(importedLayer.opacity).toBe(exportedLayer.opacity);
        expect(importedLayer.blendMode).toBe(exportedLayer.blendMode);
        expect(importedLayer.alphaLock).toBe(Boolean(exportedLayer.alphaLock));
        expect(importedLayer.locked).toBe(Boolean(exportedLayer.locked));
        expect(importedLayer.visible).toBe(exportedLayer.visible);
      }

      globalThis.Image = originalImage;
    });
  });
});

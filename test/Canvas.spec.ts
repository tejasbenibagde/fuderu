import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

const mockBrushInstance = {
  isSmooth: true,
  isSpacing: true,
  isEraser: false,
  isAlphaLocked: false,
  config: { size: 10 },
  putPoint: vi.fn(),
  render: vi.fn(),
  finalizeStroke: vi.fn((cb?: () => void) => cb?.()),
  flush: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn(),
  loadConfig: vi.fn(),
  loadImageAsync: vi.fn(),
  loadContext: vi.fn(),
  syncOriCanvas: vi.fn(),
  setSelectionMask: vi.fn(),
};

vi.mock("../src/Brush", () => {
  return {
    Brush: vi.fn(function () {
      return mockBrushInstance;
    }),
  };
});

describe("Canvas", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasEnv = installCanvas2DMock();
    document.body.replaceChildren();
    mockBrushInstance.isSmooth = true;
    mockBrushInstance.isSpacing = true;
    mockBrushInstance.isEraser = false;
    mockBrushInstance.isAlphaLocked = false;
    mockBrushInstance.finalizeStroke.mockImplementation((cb?: () => void) =>
      cb?.(),
    );

    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect",
    ).mockImplementation(() => ({
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  const createCanvas = () => {
    const canvas = document.createElement("canvas");
    document.body.appendChild(canvas);
    return canvas;
  };

  it("should create canvas instance and accept selector string", () => {
    const canvas = createCanvas();
    canvas.id = "my-canvas";

    const byElement = new Canvas({ canvas });
    const bySelector = new Canvas({ canvas: "#my-canvas" });

    expect(byElement).toBeInstanceOf(Canvas);
    expect(bySelector).toBeInstanceOf(Canvas);
    expect(() => new Canvas({ canvas: "#missing" })).toThrow();
  });

  it("should resize canvas buffer correctly including devicePixelRatio", () => {
    const canvas = createCanvas();
    new Canvas({ canvas });
    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);

    const dprCanvas = createCanvas();
    const originalRatio = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      value: 2,
      configurable: true,
    });

    new Canvas({ canvas: dprCanvas });
    expect(dprCanvas.width).toBe(1000);
    expect(dprCanvas.height).toBe(1000);

    Object.defineProperty(window, "devicePixelRatio", {
      value: originalRatio,
      configurable: true,
    });
  });

  it("should resize and reload brush context when resize is called", () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });

    const rectSpy = vi
      .spyOn(canvas, "getBoundingClientRect")
      .mockReturnValueOnce({
        width: 320,
        height: 240,
        top: 0,
        left: 0,
        right: 320,
        bottom: 240,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

    instance.resize();

    expect(canvas.width).toBe(320);
    expect(canvas.height).toBe(240);
    expect(mockBrushInstance.loadContext).toHaveBeenCalledWith(
      instance.getActiveLayer().canvas,
    );

    rectSpy.mockRestore();
  });

  it("should disable pressure simulation by default and toggle brush flags", () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });

    expect(instance.pressureSimulation).toBe(false);

    instance.setSmooth(false);
    instance.setSpacing(false);
    instance.setEraser(true);

    expect(mockBrushInstance.isSmooth).toBe(false);
    expect(mockBrushInstance.isSpacing).toBe(false);
    expect(mockBrushInstance.isEraser).toBe(true);
  });

  it("should expose clear method", () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });

    instance.clear();

    expect(mockBrushInstance.clear).toHaveBeenCalledTimes(1);
    expect(instance.getActionLog().at(-1)).toMatchObject({
      type: "clearLayer",
      layerId: instance.getActiveLayer().id,
    });
  });

  it("should finalize a stroke when pointer input is cancelled", () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });
    mockBrushInstance.finalizeStroke.mockClear();

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 10,
        clientY: 10,
        pointerId: 7,
      }),
    );
    canvas.dispatchEvent(
      new PointerEvent("pointercancel", {
        pointerId: 7,
      }),
    );

    expect(mockBrushInstance.finalizeStroke).toHaveBeenCalledTimes(1);
    expect((instance as unknown as { isDrawing: boolean }).isDrawing).toBe(
      false,
    );
  });

  it("should manage layers and sync brush alphaLock/context accurately", () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });

    const baseLayer = instance.getActiveLayer();
    const inkLayer = instance.createLayer({
      name: "Ink",
      opacity: 0.5,
      blendMode: "multiply",
      alphaLock: true,
    });

    expect(instance.getLayers()).toHaveLength(2);
    expect(instance.getActiveLayer()).toBe(inkLayer);
    expect(mockBrushInstance.loadContext).toHaveBeenCalledWith(inkLayer.canvas);
    expect(mockBrushInstance.isAlphaLocked).toBe(true);

    // Identical updateLayer should not push redundant history/action entries
    const historyLenBefore = instance.history.getHistoryState().length;
    const actionLenBefore = instance.getActionLog().length;
    instance.updateLayer(inkLayer.id, { opacity: 0.5 });
    expect(instance.history.getHistoryState().length).toBe(historyLenBefore);
    expect(instance.getActionLog().length).toBe(actionLenBefore);

    const updatedLayer = instance.updateLayer(inkLayer.id, {
      opacity: 0.25,
      visible: false,
      alphaLock: false,
    });
    expect(updatedLayer.opacity).toBe(0.25);
    expect(updatedLayer.visible).toBe(false);
    expect(mockBrushInstance.isAlphaLocked).toBe(false);

    const duplicate = instance.duplicateLayer(inkLayer.id);
    expect(instance.getActiveLayer()).toBe(duplicate);

    // Moving layer to its current index should not add history/action entries
    const lenBeforeNoopMove = instance.history.getHistoryState().length;
    const dupIndex = instance.getLayers().indexOf(duplicate);
    instance.moveLayer(duplicate.id, dupIndex);
    expect(instance.history.getHistoryState().length).toBe(lenBeforeNoopMove);

    instance.moveLayer(duplicate.id, 0);
    expect(instance.getLayers()[0]).toBe(duplicate);
    expect(instance.history.getHistoryState().length).toBe(
      lenBeforeNoopMove + 1,
    );

    // Deleting active layer switches brush context back cleanly
    instance.deleteLayer(duplicate.id);
    instance.setActiveLayer(baseLayer.id);
    expect(instance.getActiveLayer()).toBe(baseLayer);

    // Cannot delete the last remaining layer
    instance.deleteLayer(inkLayer.id);
    expect(() => instance.deleteLayer(baseLayer.id)).toThrow();
  });

  it("should expose undo/redo/loadConfig/loadImage methods", async () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });

    const undoSpy = vi.spyOn(instance.history, "undo");
    const redoSpy = vi.spyOn(instance.history, "redo");

    instance.undo();
    instance.redo();
    expect(undoSpy).toHaveBeenCalledTimes(1);
    expect(redoSpy).toHaveBeenCalledTimes(1);

    const config = {
      size: 50,
      opacity: 1,
      flow: 1,
      color: "#fff",
      angle: 0,
      roundness: 1,
      spacing: 1,
    };
    instance.loadConfig(config);
    expect(mockBrushInstance.loadConfig).toHaveBeenCalledWith(config);

    const imageCanvas = document.createElement("canvas");
    mockBrushInstance.loadImageAsync.mockResolvedValueOnce(undefined);
    await expect(instance.loadImage(imageCanvas)).resolves.toBeUndefined();
    expect(mockBrushInstance.loadImageAsync).toHaveBeenCalledWith(imageCanvas);
  });

  it("should bind and remove pointer event listeners and isolate listener errors", () => {
    const canvas = createCanvas();
    const addCanvasSpy = vi.spyOn(canvas, "addEventListener");
    const removeCanvasSpy = vi.spyOn(canvas, "removeEventListener");
    const removeWindowSpy = vi.spyOn(window, "removeEventListener");
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const instance = new Canvas({ canvas });
    const failingListener = vi.fn(() => {
      throw new Error("boom");
    });
    const healthyListener = vi.fn();
    instance.on("change", failingListener);
    instance.on("change", healthyListener);

    instance.createLayer("L2");
    expect(failingListener).toHaveBeenCalledTimes(1);
    expect(healthyListener).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalled();

    instance.off("change", healthyListener);
    instance.createLayer("L3");
    expect(healthyListener).toHaveBeenCalledTimes(1);

    expect(addCanvasSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
    );
    expect(addCanvasSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );

    instance.destroy();

    expect(removeCanvasSpy).toHaveBeenCalledWith(
      "pointerdown",
      expect.any(Function),
    );
    expect(removeCanvasSpy).toHaveBeenCalledWith(
      "pointermove",
      expect.any(Function),
    );
    expect(removeWindowSpy).toHaveBeenCalledWith(
      "pointerup",
      expect.any(Function),
    );
  });

  it("should handle pointer drawing events and pointerId isolation", () => {
    const canvas = createCanvas();
    new Canvas({ canvas });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 10,
        clientY: 20,
        pointerType: "mouse",
        pressure: 0,
        pointerId: 1,
      }),
    );

    expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(10, 20, 1);
    expect(mockBrushInstance.render).toHaveBeenCalledTimes(1);

    // Secondary pointer is ignored while pointer 1 is active
    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 99,
        clientY: 99,
        pointerId: 2,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }));
    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(1);
    expect(mockBrushInstance.finalizeStroke).not.toHaveBeenCalled();

    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 15,
        clientY: 25,
        pointerId: 1,
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));

    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(2);
    expect(mockBrushInstance.finalizeStroke).toHaveBeenCalledTimes(1);
  });

  it("should scale pointer coordinates to canvas buffer and process coalesced events", () => {
    const canvas = createCanvas();
    vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({
      width: 500,
      height: 250,
      top: 20,
      left: 10,
      right: 510,
      bottom: 270,
      x: 10,
      y: 20,
      toJSON: () => {},
    });

    new Canvas({
      canvas,
      document: { width: 1000, height: 500 },
      pressureSimulation: false,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 260,
        clientY: 145,
        pointerType: "mouse",
        pressure: 0,
      }),
    );

    expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(500, 250, 1);

    const moveEvent = new PointerEvent("pointermove", {
      clientX: 10,
      clientY: 20,
    });
    Object.defineProperty(moveEvent, "getCoalescedEvents", {
      value: () => [
        new PointerEvent("pointermove", { clientX: 60, clientY: 70 }),
        new PointerEvent("pointermove", { clientX: 110, clientY: 120 }),
      ],
    });

    canvas.dispatchEvent(moveEvent);
    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(3);
    expect(mockBrushInstance.putPoint).toHaveBeenNthCalledWith(2, 100, 100, 1);
    expect(mockBrushInstance.putPoint).toHaveBeenNthCalledWith(3, 200, 200, 1);
  });

  it("should use real pen pressure and optional mouse pressure simulation", () => {
    const penCanvas = createCanvas();
    new Canvas({ canvas: penCanvas });

    penCanvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerType: "pen",
        pressure: 0.42,
      }),
    );
    expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(
      100,
      100,
      expect.closeTo(0.42),
    );

    mockBrushInstance.putPoint.mockClear();

    const simCanvas = createCanvas();
    new Canvas({ canvas: simCanvas, pressureSimulation: true });
    simCanvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerType: "mouse",
        pressure: 0,
      }),
    );
    expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(100, 100, 0.5);
  });

  it("should track sparse stroke bounds and leverage cacheBelowCanvas during strokes", () => {
    const canvas = createCanvas();
    const instance = new Canvas({ canvas });
    instance.createLayer({ name: "Layer 2" });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 60,
        pointerType: "mouse",
      }),
    );

    const internal = instance as unknown as {
      isDrawing: boolean;
      cacheBelowCanvas: HTMLCanvasElement;
      cacheBelowValid: boolean;
      strokeMinX: number;
      strokeMinY: number;
      strokeMaxX: number;
      strokeMaxY: number;
    };

    expect(internal.isDrawing).toBe(true);
    expect(internal.cacheBelowCanvas).toBeDefined();

    instance.renderLayers();
    expect(internal.cacheBelowValid).toBe(true);

    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 180,
        pointerType: "mouse",
      }),
    );
    window.dispatchEvent(new PointerEvent("pointerup"));

    expect(internal.strokeMinX).toBe(50);
    expect(internal.strokeMinY).toBe(60);
    expect(internal.strokeMaxX).toBe(150);
    expect(internal.strokeMaxY).toBe(180);
    expect(internal.isDrawing).toBe(false);
    expect(internal.cacheBelowValid).toBe(false);
  });

  it("should resize document with preserve vs clearArtwork and reject non-positive dimensions", () => {
    const canvas = createCanvas();
    const instance = new Canvas({
      canvas,
      document: { width: 40, height: 40 },
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    instance.drawRectangle({
      x: 5,
      y: 5,
      width: 10,
      height: 10,
      fillColor: "#00ff00",
    });

    // Invalid dimensions are rejected with warning
    instance.setDocumentSize(0, 100);
    instance.setDocumentSize(100, -10);
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(canvas.width).toBe(40);
    expect(canvas.height).toBe(40);

    // clearArtwork = false preserves existing pixels and clears history
    expect(instance.history.canUndo()).toBe(true);
    instance.setDocumentSize(80, 60, false);
    expect(canvas.width).toBe(80);
    expect(canvas.height).toBe(60);
    expect(instance.history.canUndo()).toBe(false);
    expect(instance.getColorAt(10, 10, "activeLayer").hex).toBe("#00ff00");

    // clearArtwork = true wipes pixels
    instance.setDocumentSize(50, 50, true);
    expect(canvas.width).toBe(50);
    expect(canvas.height).toBe(50);
    expect(instance.getColorAt(10, 10, "activeLayer").a).toBe(0);
  });

  describe("Locked Layer Enforcement Matrix", () => {
    it("should reject brush drawing, raster ops, and deletion on locked layers", () => {
      const canvas = createCanvas();
      const instance = new Canvas({ canvas });
      const active = instance.getActiveLayer();
      instance.updateLayer(active.id, { locked: true });

      mockBrushInstance.putPoint.mockClear();
      canvas.dispatchEvent(
        new PointerEvent("pointerdown", { clientX: 50, clientY: 50 }),
      );
      expect(mockBrushInstance.putPoint).not.toHaveBeenCalled();

      expect(() => instance.clear()).toThrow("Active layer is locked");
      expect(() => instance.clearActiveLayer()).toThrow(
        "Active layer is locked",
      );
      expect(() => instance.fillActiveLayer("#ff0000")).toThrow(
        "Active layer is locked",
      );
      expect(() => instance.floodFill(10, 10, "#00ff00")).toThrow(
        "Active layer is locked",
      );
      expect(() =>
        instance.drawRectangle({ x: 0, y: 0, width: 20, height: 20 }),
      ).toThrow("Active layer is locked");
      expect(() =>
        instance.drawEllipse({ x: 10, y: 10, radiusX: 5, radiusY: 5 }),
      ).toThrow("Active layer is locked");
      expect(() => instance.drawLine({ x1: 0, y1: 0, x2: 10, y2: 10 })).toThrow(
        "Active layer is locked",
      );
      expect(() => instance.drawText("Hello", 10, 10)).toThrow(
        "Active layer is locked",
      );

      const layer2 = instance.createLayer({ name: "Second Layer" });
      instance.updateLayer(layer2.id, { locked: true });
      expect(() => instance.deleteLayer(layer2.id)).toThrow(
        "Cannot delete locked layer",
      );
    });
  });

  describe("Action Replay & Artwork Reset", () => {
    it("resetArtwork resets layers to base layer while preserving action log", () => {
      const canvas = createCanvas();
      const instance = new Canvas({ canvas });

      instance.createLayer({ name: "Layer 2" });
      instance.createLayer({ name: "Layer 3" });
      const initialLog = instance.getActionLog();
      expect(initialLog).toHaveLength(2);

      instance.resetArtwork();

      expect(instance.getLayers()).toHaveLength(1);
      expect(instance.getActiveLayer().name).toBe("Background");
      expect(instance.getActionLog()).toEqual(initialLog);
      expect(mockBrushInstance.clear).toHaveBeenCalled();
      expect(mockBrushInstance.loadContext).toHaveBeenCalled();
    });

    it("replayAction flushes brush strokes before committing", async () => {
      const canvas = createCanvas();
      const instance = new Canvas({ canvas });
      const layer = instance.getActiveLayer();

      await instance.replayAction({
        type: "stroke",
        layerId: layer.id,
        brushConfig: { size: 12 },
        points: [
          { x: 10, y: 10, pressure: 0.5 },
          { x: 20, y: 20, pressure: 0.8 },
        ],
      });

      expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(10, 10, 0.5);
      expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(20, 20, 0.8);
      expect(mockBrushInstance.render).toHaveBeenCalled();
      expect(mockBrushInstance.flush).toHaveBeenCalled();
    });
  });
});

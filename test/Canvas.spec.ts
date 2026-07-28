import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";

const mockBrushInstance = {
  isSmooth: true,
  isSpacing: true,
  config: { size: 10 },
  putPoint: vi.fn(),
  render: vi.fn(),
  finalizeStroke: vi.fn(),
  clear: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
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
          rect: vi.fn(),
          globalAlpha: 1,
          globalCompositeOperation: "source-over",
          filter: "none",
          fillStyle: "#000000",
        } as unknown as CanvasRenderingContext2D;
      }

      return null;
    },
  );

  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockImplementation(function () {
    return {
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {},
    };
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  document.body.replaceChildren();
  mockBrushInstance.isSmooth = true;
  mockBrushInstance.isSpacing = true;
});

describe("Canvas", () => {
  const createCanvas = () => {
    const canvas = document.createElement("canvas");

    document.body.appendChild(canvas);

    return canvas;
  };

  it("should create canvas instance", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    expect(instance).toBeInstanceOf(Canvas);
  });

  it("should accept selector string", () => {
    const canvas = createCanvas();

    canvas.id = "my-canvas";

    const instance = new Canvas({
      canvas: "#my-canvas",
    });

    expect(instance).toBeInstanceOf(Canvas);
  });

  it("should throw if selector does not exist", () => {
    expect(() => {
      new Canvas({
        canvas: "#missing",
      });
    }).toThrow();
  });

  it("should resize canvas correctly", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
    });

    expect(canvas.width).toBe(500);
    expect(canvas.height).toBe(500);
  });

  it("should scale canvas by devicePixelRatio", () => {
    const canvas = createCanvas();
    const originalRatio = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", {
      value: 2,
      configurable: true,
    });

    new Canvas({
      canvas,
    });

    expect(canvas.width).toBe(1000);
    expect(canvas.height).toBe(1000);

    Object.defineProperty(window, "devicePixelRatio", {
      value: originalRatio,
      configurable: true,
    });
  });

  it("should resize and reload brush context when resize is called", () => {
    const canvas = createCanvas();
    const instance = new Canvas({
      canvas,
    });

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

  it("should disable pressure simulation by default", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    expect(instance.pressureSimulation).toBe(false);
  });

  it("should expose clear method", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    instance.clear();

    expect(mockBrushInstance.clear).toHaveBeenCalledTimes(1);
  });

  it("should finalize a stroke when pointer input is cancelled", () => {
    const canvas = createCanvas();
    const instance = new Canvas({
      canvas,
    });

    (instance as unknown as { isDrawing: boolean }).isDrawing = true;

    (
      instance as unknown as { handlePointerCancel: (e: PointerEvent) => void }
    ).handlePointerCancel({
      pointerId: 1,
    } as PointerEvent);

    expect(mockBrushInstance.finalizeStroke).toHaveBeenCalledTimes(1);
    expect((instance as unknown as { isDrawing: boolean }).isDrawing).toBe(
      false,
    );
  });

  it("should expose layer management methods", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    const baseLayer = instance.getActiveLayer();
    const inkLayer = instance.createLayer({
      name: "Ink",
      opacity: 0.5,
      blendMode: "multiply",
    });

    expect(instance.getLayers()).toHaveLength(2);
    expect(instance.getActiveLayer()).toBe(inkLayer);
    expect(mockBrushInstance.loadContext).toHaveBeenCalledWith(inkLayer.canvas);

    const updatedLayer = instance.updateLayer(inkLayer.id, {
      opacity: 0.25,
      visible: false,
    });

    expect(updatedLayer.opacity).toBe(0.25);
    expect(updatedLayer.visible).toBe(false);

    const duplicate = instance.duplicateLayer(inkLayer.id);
    expect(instance.getActiveLayer()).toBe(duplicate);

    instance.moveLayer(duplicate.id, 0);
    expect(instance.getLayers()[0]).toBe(duplicate);

    instance.deleteLayer(duplicate.id);
    instance.setActiveLayer(baseLayer.id);

    expect(instance.getActiveLayer()).toBe(baseLayer);
  });

  it("should expose undo/redo methods", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    instance.undo();
    instance.redo();

    expect(mockBrushInstance.undo).toHaveBeenCalled();
    expect(mockBrushInstance.redo).toHaveBeenCalled();
  });

  it("should expose loadConfig method", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

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

    expect(mockBrushInstance.loadConfig).toHaveBeenCalledTimes(1);
    expect(mockBrushInstance.loadConfig).toHaveBeenCalledWith(config);
  });

  it("should bind and remove pointer event listeners", () => {
    const canvas = createCanvas();
    const addCanvasSpy = vi.spyOn(canvas, "addEventListener");
    const removeCanvasSpy = vi.spyOn(canvas, "removeEventListener");
    const removeWindowSpy = vi.spyOn(window, "removeEventListener");

    const instance = new Canvas({
      canvas,
    });

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

  it("should handle pointer drawing events and call brush lifecycle methods", () => {
    const canvas = createCanvas();
    new Canvas({
      canvas,
    });

    const pointerDown = new PointerEvent("pointerdown", {
      clientX: 10,
      clientY: 20,
      pointerType: "mouse",
      pressure: 0,
      button: 0,
      buttons: 1,
      bubbles: true,
    });

    canvas.dispatchEvent(pointerDown);

    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(1);
    expect(mockBrushInstance.render).toHaveBeenCalledTimes(1);

    const pointerMove = new PointerEvent("pointermove", {
      clientX: 15,
      clientY: 25,
      pointerType: "mouse",
      pressure: 0,
      buttons: 1,
      bubbles: true,
    });

    canvas.dispatchEvent(pointerMove);

    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(2);
    expect(mockBrushInstance.render).toHaveBeenCalledTimes(2);

    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(mockBrushInstance.finalizeStroke).toHaveBeenCalledTimes(1);
  });

  it("should scale pointer coordinates to the canvas document buffer", () => {
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
  });

  it("should expose smoothing and spacing toggles", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    instance.setSmooth(false);
    instance.setSpacing(false);

    expect(mockBrushInstance.isSmooth).toBe(false);
    expect(mockBrushInstance.isSpacing).toBe(false);
  });

  it("should expose loadImage method", async () => {
    const canvas = createCanvas();
    const imageCanvas = document.createElement("canvas");

    mockBrushInstance.loadImageAsync.mockResolvedValueOnce(undefined);

    const instance = new Canvas({
      canvas,
    });

    await expect(instance.loadImage(imageCanvas)).resolves.toBeUndefined();
    expect(mockBrushInstance.loadImageAsync).toHaveBeenCalledWith(imageCanvas);
  });

  it("should destroy event listeners safely", () => {
    const canvas = createCanvas();

    const instance = new Canvas({
      canvas,
    });

    expect(() => {
      instance.destroy();
    }).not.toThrow();
  });

  it("should process coalesced pointer events", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 0,
        clientY: 0,
        bubbles: true,
      }),
    );

    const moveEvent = new PointerEvent("pointermove", {
      clientX: 10,
      clientY: 10,
      bubbles: true,
    });

    const coalescedEvents = [
      new PointerEvent("pointermove", {
        clientX: 20,
        clientY: 20,
        bubbles: true,
      }),
      new PointerEvent("pointermove", {
        clientX: 30,
        clientY: 30,
        bubbles: true,
      }),
    ];

    Object.defineProperty(moveEvent, "getCoalescedEvents", {
      value: () => coalescedEvents,
    });

    canvas.dispatchEvent(moveEvent);

    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(3);
    expect(mockBrushInstance.render).toHaveBeenCalledTimes(2);
  });

  it("should fallback to original event when coalesced events are unavailable", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 0,
        clientY: 0,
        button: 0,
        buttons: 1,
        pointerId: 1,
        bubbles: true,
      }),
    );

    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 10,
        clientY: 10,
        buttons: 1,
        pointerId: 1,
        bubbles: true,
      }),
    );

    expect(mockBrushInstance.putPoint).toHaveBeenCalledTimes(2);
    expect(mockBrushInstance.render).toHaveBeenCalledTimes(2);
  });

  it("should handle pointer events", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pressure: 1,
      }),
    );

    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 120,
        clientY: 120,
        pressure: 1,
      }),
    );

    window.dispatchEvent(new PointerEvent("pointerup"));

    expect(mockBrushInstance.putPoint).toHaveBeenCalled();

    expect(mockBrushInstance.render).toHaveBeenCalled();

    expect(mockBrushInstance.finalizeStroke).toHaveBeenCalled();
  });

  it("should use real pen pressure when available", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
    });

    canvas.dispatchEvent(
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
  });

  it("should simulate mouse pressure when enabled", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
      pressureSimulation: true,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerType: "mouse",
        pressure: 0,
      }),
    );

    expect(mockBrushInstance.putPoint).toHaveBeenCalled();

    const pressure = mockBrushInstance.putPoint.mock.calls[0][2];

    expect(pressure).toBeGreaterThan(0);
    expect(pressure).toBeLessThanOrEqual(1);
  });

  it("should use flat pressure when no option is provided", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 50,
        pointerType: "mouse",
        pressure: 0,
      }),
    );

    expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(50, 50, 1);
  });

  it("should use flat pressure when pressure simulation is disabled", () => {
    const canvas = createCanvas();

    new Canvas({
      canvas,
      pressureSimulation: false,
    });

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 100,
        pointerType: "mouse",
        pressure: 0,
      }),
    );

    expect(mockBrushInstance.putPoint).toHaveBeenCalledWith(100, 100, 1);
  });

  it("should calculate sparse stroke bounding box and track bounds", () => {
    const canvas = createCanvas();
    const instance = new Canvas({
      canvas,
    });

    mockBrushInstance.finalizeStroke.mockImplementationOnce(
      (cb: () => void) => {
        cb();
      },
    );

    // Start a stroke
    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 60,
        pointerType: "mouse",
      }),
    );

    // Drag pointer
    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        clientX: 150,
        clientY: 180,
        pointerType: "mouse",
      }),
    );

    // End stroke
    window.dispatchEvent(new PointerEvent("pointerup"));

    const internal = instance as unknown as {
      strokeMinX: number;
      strokeMinY: number;
      strokeMaxX: number;
      strokeMaxY: number;
    };
    expect(internal.strokeMinX).toBe(50);
    expect(internal.strokeMinY).toBe(60);
    expect(internal.strokeMaxX).toBe(150);
    expect(internal.strokeMaxY).toBe(180);
  });

  it("should pre-composite and leverage cacheBelowCanvas during active stroke drawing", () => {
    const canvas = createCanvas();
    const instance = new Canvas({
      canvas,
    });

    // Create layers and set layer2 as active
    instance.createLayer({ name: "Layer 2" });

    // Start drawing
    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        clientX: 50,
        clientY: 50,
        pointerType: "mouse",
      }),
    );

    const internal = instance as unknown as {
      isDrawing: boolean;
      cacheBelowCanvas: HTMLCanvasElement;
      cacheBelowValid: boolean;
    };
    expect(internal.isDrawing).toBe(true);
    expect(internal.cacheBelowCanvas).toBeDefined();

    // Trigger render layers which populates the cache
    instance.renderLayers();
    expect(internal.cacheBelowValid).toBe(true);

    // End drawing which resets the cache validity
    window.dispatchEvent(new PointerEvent("pointerup"));
    expect(internal.isDrawing).toBe(false);
    expect(internal.cacheBelowValid).toBe(false);
  });

  it("should change document size and optionally clear artwork or crop/pad it", () => {
    const canvas = createCanvas();
    const instance = new Canvas({
      canvas,
    });

    const layersSpy = vi.spyOn(instance.layers, "resize");
    const clearSpy = vi.spyOn(instance.layers, "clear");

    // Test with clearArtwork = true
    instance.setDocumentSize(800, 600, true);

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(layersSpy).toHaveBeenCalledWith(800, 600);
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(600);

    // Test with clearArtwork = false (default)
    clearSpy.mockClear();
    instance.setDocumentSize(400, 300);

    expect(clearSpy).not.toHaveBeenCalled();
    expect(layersSpy).toHaveBeenCalledWith(400, 300);
    expect(canvas.width).toBe(400);
    expect(canvas.height).toBe(300);
  });
});

import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { Brush } from "../src/Brush";
import type { Point, PurePoint } from "../src/types/point";

let mockContext: CanvasRenderingContext2D;

beforeAll(() => {
  mockContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(0),
      width: 500,
      height: 500,
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
    fillStyle: "#000000",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    filter: "none",
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (contextId: string) => {
      if (contextId === "2d") {
        return mockContext;
      }
      return null;
    },
  );
});

beforeEach(() => {
  vi.clearAllMocks();
});

const createMockCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 500;
  return canvas;
};

type InternalBrush = {
  points: Point[];
  prePoint?: PurePoint;
  prePrePoint?: PurePoint;
  canvasStackIndex: number;
  lastProcessedPointForRotation?: PurePoint;
};

const getInternalBrush = (brush: Brush) => brush as unknown as InternalBrush;

const getInternalRotationAngle = (brush: Brush) =>
  (brush as unknown as { previousRotationAngle: number }).previousRotationAngle;

describe("Brush — instantiation and setup", () => {
  it("creates a Brush instance and initializes internal canvas contexts", () => {
    const brush = new Brush(createMockCanvas());

    expect(brush).toBeInstanceOf(Brush);
    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(4);
  });

  it("uses a fresh internal state for each Brush instance", () => {
    new Brush(createMockCanvas());
    new Brush(createMockCanvas());

    expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledTimes(8);
  });
});

describe("Brush — configuration", () => {
  it("applies default configuration values", () => {
    const brush = new Brush(createMockCanvas());

    expect(brush.config).toEqual(
      expect.objectContaining({
        size: 20,
        opacity: 1,
        flow: 1,
        color: "#000000",
        spacing: 0.12,
        eraser: false,
      }),
    );
  });

  it("updates only the specified fields from loadConfig", () => {
    const brush = new Brush(createMockCanvas(), { size: 10, opacity: 0.5 });

    brush.loadConfig({ color: "#00ff00" });

    expect(brush.config).toEqual(
      expect.objectContaining({
        size: 10,
        opacity: 0.5,
        color: "#00ff00",
      }),
    );
  });

  it("bindConfig keeps the external reference intact", () => {
    const brush = new Brush(createMockCanvas());
    const external = {
      size: 99,
      opacity: 1,
      flow: 1,
      color: "#ffffff",
      angle: 0,
      roundness: 1,
      spacing: 0.12,
      eraser: false,
    };

    brush.bindConfig(external);

    expect(brush.config).toBe(external);
  });
});

describe("Brush — runtime flags", () => {
  it("defaults isSmooth to true and allows toggling", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush.isSmooth).toBe(true);
    brush.isSmooth = false;
    expect(brush.isSmooth).toBe(false);
  });

  it("defaults isSpacing to true and allows toggling", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush.isSpacing).toBe(true);
    brush.isSpacing = false;
    expect(brush.isSpacing).toBe(false);
  });
});

describe("Brush — point processing", () => {
  it("holds the first point until a second point arrives", () => {
    const brush = new Brush(createMockCanvas());

    brush.putPoint(10, 20, 1);
    expect(getInternalBrush(brush).points.length).toBe(0);

    brush.putPoint(30, 40, 0.8);
    expect(getInternalBrush(brush).points.length).toBeGreaterThan(0);

    const prePoint = getInternalBrush(brush).prePoint;
    expect(prePoint).toBeDefined();
    expect(prePoint).toEqual(expect.objectContaining({ pressure: 0.8 }));

    const definedPrePoint = prePoint as PurePoint;
    expect(definedPrePoint.x).toBeGreaterThan(10);
    expect(definedPrePoint.x).toBeLessThan(30);
    expect(definedPrePoint.y).toBeGreaterThan(20);
    expect(definedPrePoint.y).toBeLessThan(40);
  });

  it("applies a fixed rotation offset on the first processed point", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "fixed", offset: Math.PI / 2 },
    });

    brush.putPoint(0, 0, 1);
    brush.putPoint(50, 0, 1);

    const queued = getInternalBrush(brush).points;
    expect(queued.length).toBeGreaterThan(0);
    expect(queued[0].rotation).toBeCloseTo(Math.PI / 2);
  });

  it("processes flow rotation configuration and enqueues points", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "flow", smoothing: 0.15 },
    });

    brush.putPoint(0, 0, 1);
    brush.putPoint(50, 50, 1);

    expect(getInternalBrush(brush).points.length).toBeGreaterThan(0);
    expect(typeof getInternalBrush(brush).points[0].rotation).toBe("number");
  });

  it("processes random rotation configuration and enqueues points", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "random" },
    });

    brush.putPoint(0, 0, 1);
    brush.putPoint(30, 40, 1);

    expect(getInternalBrush(brush).points.length).toBeGreaterThan(0);
    expect(typeof getInternalBrush(brush).points[0].rotation).toBe("number");
  });
});

describe("Brush — stroke lifecycle", () => {
  it("finalizes a stroke without queued points and commits to the undo stack", () => {
    const brush = new Brush(createMockCanvas());

    brush.finalizeStroke();

    expect(mockContext.drawImage).toHaveBeenCalled();
    expect(getInternalBrush(brush).canvasStackIndex).toBeGreaterThanOrEqual(0);
  });

  it("resets rotation state between successive strokes", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "flow" },
    });

    brush.putPoint(0, 0, 1);
    brush.putPoint(100, 0, 1);
    brush.finalizeStroke();

    brush.putPoint(200, 200, 1);
    brush.putPoint(300, 100, 1);
    brush.finalizeStroke();

    expect(
      getInternalBrush(brush).lastProcessedPointForRotation,
    ).toBeUndefined();
    expect(getInternalRotationAngle(brush)).toBe(0);
  });
});

describe("Brush — canvas behavior", () => {
  it("clears all drawing buffers and resets internal state", () => {
    const brush = new Brush(createMockCanvas());

    brush.putPoint(0, 0, 1);
    brush.putPoint(20, 20, 1);
    brush.clear();

    expect(getInternalBrush(brush).points.length).toBe(0);
    expect(getInternalBrush(brush).prePoint).toBeUndefined();
    expect(getInternalBrush(brush).prePrePoint).toBeUndefined();
    expect(mockContext.clearRect).toHaveBeenCalledTimes(4);
  });

  it("stores image history and restores it via undo/redo", () => {
    const brush = new Brush(createMockCanvas());

    brush.finalizeStroke();
    brush.undo();
    expect(mockContext.putImageData).toHaveBeenCalledTimes(2);

    brush.redo();
    expect(mockContext.putImageData).toHaveBeenCalledTimes(4);
  });
});

describe("Brush — rendering", () => {
  it("consumes queued points and draws a stroke", () => {
    const brush = new Brush(createMockCanvas());
    const rafSpy = vi
      .spyOn(globalThis, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0);
        return 0;
      });

    brush.putPoint(0, 0, 1);
    brush.putPoint(50, 0, 1);
    brush.render();

    expect(getInternalBrush(brush).points.length).toBe(0);
    expect(mockContext.ellipse).toHaveBeenCalled();
    expect(mockContext.drawImage).toHaveBeenCalled();

    rafSpy.mockRestore();
  });
});

describe("Brush — modules", () => {
  it("registers the same module instance only once and returns a stable id", () => {
    const brush = new Brush(createMockCanvas());
    const module = {} as never;

    const id1 = brush.useModule(module);
    const id2 = brush.useModule(module);

    expect(typeof id1).toBe("string");
    expect(id1).toBe(id2);
    expect(id1.length).toBeGreaterThan(0);
  });

  it("removes modules correctly and returns false for missing ids", () => {
    const brush = new Brush(createMockCanvas());
    const id = brush.useModule({} as never);

    expect(brush.removeModule(id)).toBe(true);
    expect(brush.removeModule("non-existent-id")).toBe(false);
  });

  it("calls module config hooks after pressure modulation", () => {
    const brush = new Brush(createMockCanvas());
    const onChangeConfig = vi.fn();

    brush.isSmooth = false;
    brush.useModule({ onChangeConfig });

    brush.putPoint(0, 0, 0.5);
    brush.putPoint(100, 0, 0.5);

    expect(onChangeConfig).toHaveBeenCalled();
    expect(onChangeConfig.mock.calls[0][1]).toBe(0.5);
    expect(onChangeConfig.mock.calls[0][0].size).toBe(10);
    expect(onChangeConfig.mock.calls[0][0].flow).toBe(0.5);
    expect(onChangeConfig.mock.calls[0][0].opacity).toBe(1);
  });

  it("normalizes queued point flow for dense stamp spacing", () => {
    const brush = new Brush(createMockCanvas(), {
      size: 25,
      flow: 0.18,
      spacing: 0.01,
    });

    brush.isSmooth = false;
    brush.putPoint(0, 0, 1);
    brush.putPoint(100, 0, 1);

    const points = getInternalBrush(brush).points;

    expect(points.length).toBeGreaterThan(0);
    expect(points[0].config.flow).toBeLessThan(0.18);
  });

  it("expands input into multiple points when a module returns an array", () => {
    const brush = new Brush(createMockCanvas());
    const onChangePoint = vi.fn((point) => [
      point,
      { ...point, x: point.x + 1 },
    ]);
    const onChangeConfig = vi.fn();

    brush.isSmooth = false;
    brush.useModule({ onChangePoint, onChangeConfig });

    brush.putPoint(0, 0, 1);
    brush.putPoint(100, 0, 1);

    const points = getInternalBrush(brush).points;

    expect(onChangePoint).toHaveBeenCalled();
    expect(onChangeConfig.mock.calls.length).toBe(points.length);
    expect(onChangePoint.mock.calls.length * 2).toBe(points.length);
    expect(points.length).toBeGreaterThan(1);
    expect(points[0].x).toBe(0);
    expect(points[1].x).toBe(1);
  });

  it("invokes mixin and end-stroke module hooks on finalizeStroke", () => {
    const brush = new Brush(createMockCanvas());
    const onMixinCanvas = vi.fn(
      (
        canvas: HTMLCanvasElement,
        context: CanvasRenderingContext2D,
      ): [HTMLCanvasElement, CanvasRenderingContext2D] => [canvas, context],
    );
    const onEndStroke = vi.fn();

    brush.useModule({ onMixinCanvas, onEndStroke });
    brush.finalizeStroke();

    expect(onMixinCanvas).toHaveBeenCalledTimes(1);
    expect(onEndStroke).toHaveBeenCalledTimes(1);
  });
});

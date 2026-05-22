import { describe, expect, it, beforeAll, vi } from "vitest";
import { Brush } from "../src/Brush";

// ─────────────────────────────────────────────
// Shared mock context (covers every canvas the
// Brush creates internally: ori, stroke, transfer)
// ─────────────────────────────────────────────
beforeAll(() => {
  const mockContext = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(),
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
    fillStyle: "#000000",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
    filter: "none",
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (contextId: string) => {
      if (contextId === "2d") return mockContext;
      return null;
    },
  );
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const createMockCanvas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 500;
  return canvas;
};

// ─────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────
describe("Brush — instantiation", () => {
  it("creates a Brush instance", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush).toBeInstanceOf(Brush);
  });

  it("applies defaults when no config is supplied", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush.config.size).toBe(20);
    expect(brush.config.opacity).toBe(1);
    expect(brush.config.flow).toBe(1);
    expect(brush.config.color).toBe("#000000");
    expect(brush.config.spacing).toBe(0.5);
  });
});

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────
describe("Brush — loadConfig", () => {
  it("loads basic properties from constructor config", () => {
    const brush = new Brush(createMockCanvas(), {
      size: 40,
      color: "#ff0000",
    });
    expect(brush.config.size).toBe(40);
    expect(brush.config.color).toBe("#ff0000");
  });

  it("partially updates config without touching other fields", () => {
    const brush = new Brush(createMockCanvas(), { size: 10, opacity: 0.5 });
    brush.loadConfig({ color: "#00ff00" });
    expect(brush.config.size).toBe(10); // unchanged
    expect(brush.config.opacity).toBe(0.5); // unchanged
    expect(brush.config.color).toBe("#00ff00");
  });

  it("loads rotation config — fixed mode", () => {
    const brush = new Brush(createMockCanvas());
    brush.loadConfig({
      rotation: { mode: "fixed", offset: Math.PI / 4 },
    });
    expect(brush.config.rotation?.mode).toBe("fixed");
    expect(brush.config.rotation?.offset).toBeCloseTo(Math.PI / 4);
  });

  it("loads rotation config — flow mode", () => {
    const brush = new Brush(createMockCanvas());
    brush.loadConfig({
      rotation: { mode: "flow", smoothing: 0.15 },
    });
    expect(brush.config.rotation?.mode).toBe("flow");
    expect(brush.config.rotation?.smoothing).toBe(0.15);
  });

  it("loads rotation config — random mode", () => {
    const brush = new Brush(createMockCanvas());
    brush.loadConfig({
      rotation: { mode: "random", jitter: Math.PI },
    });
    expect(brush.config.rotation?.mode).toBe("random");
    expect(brush.config.rotation?.jitter).toBeCloseTo(Math.PI);
  });

  it("replaces entire rotation object on successive loadConfig calls", () => {
    const brush = new Brush(createMockCanvas());
    brush.loadConfig({ rotation: { mode: "flow", offset: 1 } });
    brush.loadConfig({ rotation: { mode: "fixed", offset: 0 } });
    expect(brush.config.rotation?.mode).toBe("fixed");
    expect(brush.config.rotation?.offset).toBe(0);
  });

  it("bindConfig replaces the config reference", () => {
    const brush = new Brush(createMockCanvas());
    const external = {
      size: 99,
      opacity: 1,
      flow: 1,
      color: "#ffffff",
      angle: 0,
      roundness: 1,
      spacing: 1,
    };
    brush.bindConfig(external);
    expect(brush.config).toBe(external); // same reference
  });
});

// ─────────────────────────────────────────────
// Runtime flags
// ─────────────────────────────────────────────
describe("Brush — runtime flags", () => {
  it("isSmooth defaults to true and can be toggled", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush.isSmooth).toBe(true);
    brush.isSmooth = false;
    expect(brush.isSmooth).toBe(false);
  });

  it("isSpacing defaults to true and can be toggled", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush.isSpacing).toBe(true);
    brush.isSpacing = false;
    expect(brush.isSpacing).toBe(false);
  });
});

// ─────────────────────────────────────────────
// Drawing
// ─────────────────────────────────────────────
describe("Brush — putPoint", () => {
  it("accepts a single point without throwing", () => {
    const brush = new Brush(createMockCanvas());
    expect(() => brush.putPoint(10, 20, 1)).not.toThrow();
  });

  it("accepts multiple points without throwing", () => {
    const brush = new Brush(createMockCanvas());
    expect(() => {
      brush.putPoint(0, 0, 1);
      brush.putPoint(10, 10, 0.8);
      brush.putPoint(20, 5, 0.6);
    }).not.toThrow();
  });

  it("accepts a point with rotation config set to flow mode", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "flow", smoothing: 0.15 },
    });
    expect(() => {
      brush.putPoint(0, 0, 1);
      brush.putPoint(50, 50, 1);
    }).not.toThrow();
  });

  it("accepts a point with rotation config set to random mode", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "random" },
    });
    expect(() => {
      brush.putPoint(0, 0, 1);
      brush.putPoint(30, 40, 1);
    }).not.toThrow();
  });

  it("accepts a point with rotation config set to fixed mode", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "fixed", offset: Math.PI / 2 },
    });
    expect(() => {
      brush.putPoint(0, 0, 1);
      brush.putPoint(30, 0, 1);
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// Stroke lifecycle
// ─────────────────────────────────────────────
describe("Brush — stroke lifecycle", () => {
  it("finalizes a stroke without crashing", () => {
    const brush = new Brush(createMockCanvas());
    brush.putPoint(10, 20, 1);
    expect(() => brush.finalizeStroke()).not.toThrow();
  });

  it("finalizes a stroke mid-flow-rotation without crashing", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "flow", smoothing: 0.2 },
    });
    brush.putPoint(0, 0, 1);
    brush.putPoint(100, 100, 1);
    expect(() => brush.finalizeStroke()).not.toThrow();
  });

  it("resets rotation state between strokes", () => {
    const brush = new Brush(createMockCanvas(), {
      rotation: { mode: "flow" },
    });
    // First stroke
    brush.putPoint(0, 0, 1);
    brush.putPoint(100, 0, 1);
    brush.finalizeStroke();

    // Second stroke should not carry over rotation from first
    expect(() => {
      brush.putPoint(200, 200, 1);
      brush.putPoint(300, 100, 1);
      brush.finalizeStroke();
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// Canvas operations
// ─────────────────────────────────────────────
describe("Brush — canvas operations", () => {
  it("clears all canvases without throwing", () => {
    const brush = new Brush(createMockCanvas());
    expect(() => brush.clear()).not.toThrow();
  });

  it("undo/redo does not throw on empty stack", () => {
    const brush = new Brush(createMockCanvas());
    expect(() => {
      brush.undo();
      brush.redo();
    }).not.toThrow();
  });
});

// ─────────────────────────────────────────────
// Modules
// ─────────────────────────────────────────────
describe("Brush — modules", () => {
  it("registers a module and returns a string id", () => {
    const brush = new Brush(createMockCanvas());
    const id = brush.useModule({} as never);
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("removes a registered module successfully", () => {
    const brush = new Brush(createMockCanvas());
    const id = brush.useModule({} as never);
    expect(brush.removeModule(id)).toBe(true);
  });

  it("returns false when removing a non-existent module", () => {
    const brush = new Brush(createMockCanvas());
    expect(brush.removeModule("non-existent-id")).toBe(false);
  });

  it("does not register the same module instance twice", () => {
    const brush = new Brush(createMockCanvas());
    const module = {} as never;
    const id1 = brush.useModule(module);
    const id2 = brush.useModule(module);
    expect(id1).toBe(id2);
  });
});

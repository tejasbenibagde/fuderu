import { beforeEach, describe, expect, it, vi } from "vitest";

import { PatternModule } from "../../src/modules";

const createMockContext = () =>
  ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillRect: vi.fn(),
    createPattern: vi.fn(() => ({}) as CanvasPattern),
    fillStyle: "#000000",
    filter: "none",
    globalAlpha: 1,
    globalCompositeOperation: "source-over",
  }) as unknown as CanvasRenderingContext2D;

describe("PatternModule", () => {
  let contexts: CanvasRenderingContext2D[];

  beforeEach(() => {
    contexts = [];

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
      (contextId: string) => {
        if (contextId !== "2d") return null;

        const context = createMockContext();
        contexts.push(context);
        return context;
      },
    );
  });

  it("uses defaults when no config is provided", () => {
    const module = new PatternModule();

    expect(module.config.scale).toBe(1);
    expect(module.config.brightness).toBe(0);
    expect(module.config.contrast).toBe(0);
    expect(module.config.blendMode).toBe("source-over");
  });

  it("bindConfig replaces the live config reference", () => {
    const module = new PatternModule();
    const config = {
      scale: 2,
      brightness: 120,
      contrast: 80,
      blendMode: "multiply" as GlobalCompositeOperation,
    };

    module.bindConfig(config);

    expect(module.config).toBe(config);
  });

  it("returns the original stroke canvas when no pattern is loaded", () => {
    const module = new PatternModule();
    const strokeCanvas = document.createElement("canvas");
    const strokeContext = createMockContext();

    expect(module.onMixinCanvas(strokeCanvas, strokeContext)).toEqual([
      strokeCanvas,
      strokeContext,
    ]);
  });

  it("loads a canvas pattern and applies filter and tint", async () => {
    const module = new PatternModule({
      scale: 2,
      brightness: 120,
      contrast: 80,
    });
    const image = document.createElement("canvas");

    image.width = 10;
    image.height = 5;

    await module.loadPattern(image, 100, 80, "#ff0000");

    const scaledContext = contexts[2];
    const patternContext = contexts[0];

    expect(scaledContext.filter).toBe("brightness(120%) contrast(80%)");
    expect(scaledContext.globalAlpha).toBe(1);
    expect(scaledContext.globalCompositeOperation).toBe("source-over");
    expect(scaledContext.fillStyle).toBe("#ff0000");
    expect(patternContext.createPattern).toHaveBeenCalledWith(
      expect.objectContaining({ width: 20, height: 10 }),
      "repeat",
    );
    expect(patternContext.fillRect).toHaveBeenCalledWith(0, 0, 100, 80);
  });

  it("composites loaded patterns with the stroke canvas", async () => {
    const module = new PatternModule({
      blendMode: "multiply",
    });
    const image = document.createElement("canvas");
    const strokeCanvas = document.createElement("canvas");
    const strokeContext = createMockContext();

    image.width = 10;
    image.height = 10;
    strokeCanvas.width = 100;
    strokeCanvas.height = 80;

    await module.loadPattern(image, 100, 80);

    const [mixedCanvas, mixedContext] = module.onMixinCanvas(
      strokeCanvas,
      strokeContext,
    );
    const blendContext = contexts[1];

    expect(mixedCanvas.width).toBe(100);
    expect(mixedCanvas.height).toBe(80);
    expect(mixedContext).toBe(blendContext);
    expect(blendContext.clearRect).toHaveBeenCalledWith(0, 0, 100, 80);
    expect(blendContext.drawImage).toHaveBeenCalledTimes(3);
    expect(blendContext.globalCompositeOperation).toBe("source-over");
  });

  it("removePattern disables pattern compositing", async () => {
    const module = new PatternModule();
    const image = document.createElement("canvas");
    const strokeCanvas = document.createElement("canvas");
    const strokeContext = createMockContext();

    image.width = 10;
    image.height = 10;

    await module.loadPattern(image, 100, 80);
    module.removePattern();

    expect(module.onMixinCanvas(strokeCanvas, strokeContext)).toEqual([
      strokeCanvas,
      strokeContext,
    ]);
  });
});

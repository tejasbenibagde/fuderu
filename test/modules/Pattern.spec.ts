import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PatternModule } from "../../src/modules";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "../helpers/mockCanvas2D";

describe("PatternModule", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let originalImage: typeof Image;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    originalImage = globalThis.Image;
  });

  afterEach(() => {
    globalThis.Image = originalImage;
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  it("uses defaults when no config is provided and ignores nullish overrides", () => {
    const defaults = new PatternModule();
    expect(defaults.config).toEqual({
      scale: 1,
      brightness: 0,
      contrast: 0,
      blendMode: "source-over",
    });

    const partial = new PatternModule({
      scale: null as unknown as number,
      brightness: 110,
    });
    expect(partial.config.scale).toBe(1);
    expect(partial.config.brightness).toBe(110);
  });

  it("bindConfig replaces live config reference", () => {
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

  it("returns original stroke canvas unchanged when no pattern is loaded or after removePattern", async () => {
    const module = new PatternModule();
    const strokeCanvas = document.createElement("canvas");
    strokeCanvas.width = 20;
    strokeCanvas.height = 20;
    const strokeContext = strokeCanvas.getContext("2d")!;

    expect(module.onMixinCanvas(strokeCanvas, strokeContext)).toEqual([
      strokeCanvas,
      strokeContext,
    ]);

    const tile = document.createElement("canvas");
    tile.width = 4;
    tile.height = 4;
    await module.loadPattern(tile, 20, 20);
    module.removePattern();

    expect(module.onMixinCanvas(strokeCanvas, strokeContext)).toEqual([
      strokeCanvas,
      strokeContext,
    ]);
  });

  it("loads canvas pattern, sets filter, tints via multiply/0.5 then restores context state", async () => {
    const module = new PatternModule({
      scale: 2,
      brightness: 120,
      contrast: 80,
    });
    const tile = document.createElement("canvas");
    tile.width = 4;
    tile.height = 4;
    const tileCtx = tile.getContext("2d")!;
    tileCtx.fillStyle = "#ffffff";
    tileCtx.fillRect(0, 0, 4, 4);

    const createdCanvases: HTMLCanvasElement[] = [];
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "canvas") {
        createdCanvases.push(el as HTMLCanvasElement);
      }
      return el;
    });

    await module.loadPattern(tile, 20, 16, "#ff0000");

    const scaledCanvas = createdCanvases.find(
      (c) => c.width === 8 && c.height === 8,
    );
    expect(scaledCanvas).toBeDefined();
    const scaledCtx = scaledCanvas!.getContext("2d")!;
    expect(scaledCtx.filter).toBe("brightness(120%) contrast(80%)");
    expect(scaledCtx.globalCompositeOperation).toBe("source-over");
    expect(scaledCtx.globalAlpha).toBe(1);

    // #ffffff multiplied by 50% #ff0000 drops G and B channels cleanly
    const [r, g, b, a] = canvasEnv.getPixel(scaledCanvas!, 2, 2);
    expect(r).toBe(255);
    expect(g).toBeLessThan(200);
    expect(b).toBeLessThan(200);
    expect(a).toBe(255);
  });

  it("loads pattern from URL string and HTMLImageElement and rejects broken URLs", async () => {
    const source = document.createElement("canvas");
    source.width = 4;
    source.height = 4;
    source.getContext("2d")!.fillStyle = "#00ff00";
    source.getContext("2d")!.fillRect(0, 0, 4, 4);
    const dataUrl = source.toDataURL();

    globalThis.Image = class MockImage {
      public width = 0;
      public height = 0;
      public naturalWidth = 0;
      public naturalHeight = 0;
      public onload: (() => void) | null = null;
      public onerror: ((err: unknown) => void) | null = null;
      private _src = "";
      get src() {
        return this._src;
      }
      set src(val: string) {
        this._src = val;
        const snap = canvasEnv.encodedSnapshots.get(val);
        queueMicrotask(() => {
          if (snap) {
            this.width = snap.width;
            this.height = snap.height;
            this.naturalWidth = snap.width;
            this.naturalHeight = snap.height;
            this.onload?.();
          } else {
            this.onerror?.(new Error("Pattern load failed"));
          }
        });
      }
    } as unknown as typeof Image;

    const module = new PatternModule();
    await expect(module.loadPattern(dataUrl, 16, 16)).resolves.toBeUndefined();

    const strokeCanvas = document.createElement("canvas");
    strokeCanvas.width = 16;
    strokeCanvas.height = 16;
    const strokeCtx = strokeCanvas.getContext("2d")!;
    strokeCtx.fillStyle = "#ffffff";
    strokeCtx.fillRect(0, 0, 8, 8);

    const [mixedCanvas] = module.onMixinCanvas(strokeCanvas, strokeCtx);
    expect(canvasEnv.getPixel(mixedCanvas, 2, 2)[3]).toBeGreaterThan(0);
    expect(canvasEnv.getPixel(mixedCanvas, 12, 12)[3]).toBe(0);

    await expect(
      module.loadPattern("https://invalid.local/missing.png", 16, 16),
    ).rejects.toThrow();
  });

  it("resizes internal pattern buffers when strokeCanvas dimensions change", async () => {
    const module = new PatternModule({ blendMode: "multiply" });
    const tile = document.createElement("canvas");
    tile.width = 4;
    tile.height = 4;
    tile.getContext("2d")!.fillStyle = "#808080";
    tile.getContext("2d")!.fillRect(0, 0, 4, 4);

    await module.loadPattern(tile, 10, 10);

    const largerStroke = document.createElement("canvas");
    largerStroke.width = 24;
    largerStroke.height = 18;
    const largerCtx = largerStroke.getContext("2d")!;
    largerCtx.fillStyle = "#ff0000";
    largerCtx.fillRect(16, 12, 4, 4);

    const [mixedCanvas, mixedCtx] = module.onMixinCanvas(
      largerStroke,
      largerCtx,
    );
    expect(mixedCanvas.width).toBe(24);
    expect(mixedCanvas.height).toBe(18);
    expect(mixedCtx.globalCompositeOperation).toBe("source-over");
    expect(canvasEnv.getPixel(mixedCanvas, 17, 13)[3]).toBeGreaterThan(0);
    expect(canvasEnv.getPixel(mixedCanvas, 2, 2)[3]).toBe(0);
  });
});

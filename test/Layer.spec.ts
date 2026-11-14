import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Layer } from "../src/Layer";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Layer", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  it("initializes with sensible defaults and a unique generated ID", () => {
    const a = new Layer({ width: 120, height: 80 });
    const b = new Layer({ width: 120, height: 80 });

    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
    expect(a.name).toBe("Layer");
    expect(a.visible).toBe(true);
    expect(a.opacity).toBe(1);
    expect(a.blendMode).toBe("source-over");
    expect(a.alphaLock).toBe(false);
    expect(a.locked).toBe(false);
    expect(a.canvas.width).toBe(120);
    expect(a.canvas.height).toBe(80);
  });

  it("honors explicit options and clamps opacity including NaN and out-of-range values", () => {
    const tooHigh = new Layer({
      id: "layer-custom",
      name: "Ink",
      width: 64,
      height: 64,
      visible: false,
      opacity: 2.5,
      blendMode: "multiply",
      alphaLock: true,
      locked: true,
    });
    expect(tooHigh.id).toBe("layer-custom");
    expect(tooHigh.name).toBe("Ink");
    expect(tooHigh.visible).toBe(false);
    expect(tooHigh.opacity).toBe(1);
    expect(tooHigh.blendMode).toBe("multiply");
    expect(tooHigh.alphaLock).toBe(true);
    expect(tooHigh.locked).toBe(true);

    const tooLow = new Layer({ width: 10, height: 10, opacity: -0.5 });
    expect(tooLow.opacity).toBe(0);

    const nanOpacity = new Layer({
      width: 10,
      height: 10,
      opacity: Number.NaN,
    });
    expect(nanOpacity.opacity).toBe(1);

    nanOpacity.setOpacity(-2);
    expect(nanOpacity.opacity).toBe(0);
    nanOpacity.setOpacity(Number.NaN);
    expect(nanOpacity.opacity).toBe(1);
  });

  it("caches frozen snapshots and invalidates only when properties actually change", () => {
    const layer = new Layer({ id: "l1", name: "Base", width: 50, height: 40 });
    const snap1 = layer.toSnapshot();
    const snap2 = layer.toSnapshot();

    expect(Object.isFrozen(snap1)).toBe(true);
    expect(snap1).toBe(snap2);
    expect(snap1).toEqual({
      id: "l1",
      name: "Base",
      visible: true,
      opacity: 1,
      blendMode: "source-over",
      alphaLock: false,
      locked: false,
      width: 50,
      height: 40,
    });

    // Assigning identical values should keep the cached snapshot reference
    layer.name = "Base";
    layer.visible = true;
    layer.opacity = 1;
    layer.blendMode = "source-over";
    layer.alphaLock = false;
    layer.locked = false;
    expect(layer.toSnapshot()).toBe(snap1);

    // Assigning changed values invalidates and updates the snapshot
    layer.name = "Shading";
    const snap3 = layer.toSnapshot();
    expect(snap3).not.toBe(snap1);
    expect(snap3.name).toBe("Shading");

    layer.alphaLock = true;
    const snap4 = layer.toSnapshot();
    expect(snap4).not.toBe(snap3);
    expect(snap4.alphaLock).toBe(true);

    layer.locked = true;
    expect(layer.toSnapshot().locked).toBe(true);
  });

  it("clears all pixels cleanly via clear()", () => {
    const layer = new Layer({ width: 20, height: 20 });
    layer.ctx.fillStyle = "#ff0000";
    layer.ctx.fillRect(0, 0, 20, 20);
    expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([255, 0, 0, 255]);

    layer.clear();
    expect(canvasEnv.countNonTransparentPixels(layer.canvas)).toBe(0);
    expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([0, 0, 0, 0]);
  });

  it("preserves artwork on resize (padding and cropping) and updates snapshot dimensions", () => {
    const layer = new Layer({ width: 40, height: 40 });
    layer.ctx.fillStyle = "#00ff00";
    layer.ctx.fillRect(5, 5, 25, 25);

    const beforeResizeSnap = layer.toSnapshot();

    // No-op resize keeps cached snapshot and pixels intact
    layer.resize(40, 40);
    expect(layer.toSnapshot()).toBe(beforeResizeSnap);
    expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([0, 255, 0, 255]);

    // Expand (pad)
    layer.resize(80, 60);
    expect(layer.canvas.width).toBe(80);
    expect(layer.canvas.height).toBe(60);
    expect(layer.toSnapshot()).not.toBe(beforeResizeSnap);
    expect(layer.toSnapshot().width).toBe(80);
    expect(layer.toSnapshot().height).toBe(60);
    expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([0, 255, 0, 255]);
    expect(canvasEnv.getPixel(layer.canvas, 60, 50)).toEqual([0, 0, 0, 0]);

    // Shrink (crop) keeps top-left region within new bounds
    layer.resize(20, 20);
    expect(layer.canvas.width).toBe(20);
    expect(layer.canvas.height).toBe(20);
    expect(canvasEnv.getPixel(layer.canvas, 10, 10)).toEqual([0, 255, 0, 255]);
    expect(canvasEnv.getPixel(layer.canvas, 2, 2)).toEqual([0, 0, 0, 0]);
  });

  it("throws when 2D context creation fails", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValueOnce(
      null,
    );
    expect(() => new Layer({ width: 10, height: 10 })).toThrow(
      "Could not create layer context",
    );
  });
});

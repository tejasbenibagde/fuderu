import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Layer } from "../src/Layer";
import { LayerManager } from "../src/LayerManager";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("LayerManager", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  it("creates a Background layer and makes it active with cached frozen snapshots", () => {
    const manager = new LayerManager(320, 240);
    const layers = manager.getAll();

    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe("Background");
    expect(manager.getActive()).toBe(layers[0]);
    expect(manager.getActiveId()).toBe(layers[0].id);

    const snaps1 = manager.getLayerSnapshots();
    const snaps2 = manager.getSnapshots();
    expect(Object.isFrozen(snaps1)).toBe(true);
    expect(snaps1).toBe(snaps2);
    expect(snaps1).toHaveLength(1);
    expect(snaps1[0].width).toBe(320);
    expect(snaps1[0].height).toBe(240);
  });

  it("creates layers with composition options (or string shorthand) and activates them", () => {
    const manager = new LayerManager(100, 80);
    const layer = manager.createLayer({
      id: "custom-ink",
      name: "Ink",
      opacity: 0.5,
      blendMode: "multiply",
      visible: false,
      alphaLock: true,
      locked: true,
    });
    const prevSnaps = manager.getLayerSnapshots();

    expect(manager.getActive()).toBe(layer);
    expect(layer.id).toBe("custom-ink");
    expect(layer.name).toBe("Ink");
    expect(layer.opacity).toBe(0.5);
    expect(layer.blendMode).toBe("multiply");
    expect(layer.visible).toBe(false);
    expect(layer.alphaLock).toBe(true);
    expect(layer.locked).toBe(true);

    const simple = manager.createLayer("Sketch");
    expect(simple.name).toBe("Sketch");
    expect(manager.getActive()).toBe(simple);
    expect(manager.getLayerSnapshots()).not.toBe(prevSnaps);
    expect(manager.getLayerSnapshots()).toHaveLength(3);
  });

  it("validates layer lookups and setActive on missing layer IDs", () => {
    const manager = new LayerManager(100, 100);
    expect(() => manager.getById("missing-id")).toThrow(
      "Layer missing-id not found",
    );
    expect(() => manager.setActive("missing-id")).toThrow(
      "Layer missing-id not found",
    );
  });

  it("duplicates layer pixels and all metadata flags directly above the source", () => {
    const manager = new LayerManager(60, 60);
    const source = manager.createLayer({
      name: "Paint",
      opacity: 0.25,
      blendMode: "screen",
      visible: false,
      alphaLock: true,
      locked: true,
    });
    source.ctx.fillStyle = "#123456";
    source.ctx.fillRect(10, 15, 20, 20);

    const duplicate = manager.duplicateLayer(source.id);
    const layers = manager.getAll();

    expect(duplicate.id).not.toBe(source.id);
    expect(duplicate.name).toBe("Paint Copy");
    expect(duplicate.opacity).toBe(0.25);
    expect(duplicate.blendMode).toBe("screen");
    expect(duplicate.visible).toBe(false);
    expect(duplicate.alphaLock).toBe(true);
    expect(duplicate.locked).toBe(true);
    expect(layers.indexOf(duplicate)).toBe(layers.indexOf(source) + 1);
    expect(manager.getActive()).toBe(duplicate);

    // Pixels must actually be copied into the duplicate canvas (and isolated from further source edits)
    expect(canvasEnv.getPixel(duplicate.canvas, 15, 20)).toEqual([
      0x12, 0x34, 0x56, 255,
    ]);
    expect(canvasEnv.getPixel(duplicate.canvas, 0, 0)).toEqual([0, 0, 0, 0]);

    source.ctx.clearRect(0, 0, 60, 60);
    expect(canvasEnv.getPixel(duplicate.canvas, 15, 20)).toEqual([
      0x12, 0x34, 0x56, 255,
    ]);

    expect(() => manager.duplicateLayer("nope")).toThrow("Layer not found");
  });

  it("moves and reorders layers within valid stack bounds and handles partial/unknown IDs", () => {
    const manager = new LayerManager(100, 100);
    const first = manager.getActive();
    const second = manager.createLayer("Second");
    const third = manager.createLayer("Third");

    manager.moveLayer(third.id, -5);
    manager.moveLayer(first.id, 99);

    expect(manager.getAll().map((l) => l.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);

    expect(() => manager.moveLayer("missing", 0)).toThrow("Layer not found");

    // reorderLayers with partial list places specified IDs first and preserves remaining layers
    manager.reorderLayers(["non-existent", first.id, third.id]);
    expect(manager.getAll().map((l) => l.id)).toEqual([
      first.id,
      third.id,
      second.id,
    ]);
  });

  it("updates layer metadata safely and invalidates snapshots", () => {
    const manager = new LayerManager(100, 100);
    const layer = manager.createLayer("Layer");
    const before = manager.getLayerSnapshots();

    manager.updateLayer(layer.id, {
      name: "Updated",
      opacity: 2,
      visible: false,
      blendMode: "overlay",
      alphaLock: true,
      locked: true,
    });

    expect(layer.name).toBe("Updated");
    expect(layer.opacity).toBe(1);
    expect(layer.visible).toBe(false);
    expect(layer.blendMode).toBe("overlay");
    expect(layer.alphaLock).toBe(true);
    expect(layer.locked).toBe(true);
    expect(manager.getLayerSnapshots()).not.toBe(before);
    expect(manager.getLayerSnapshots()[1].alphaLock).toBe(true);
  });

  it("enforces deletion guards (last layer, missing layer, locked layer) and active layer fallback", () => {
    const manager = new LayerManager(100, 100);
    const background = manager.getActive();

    expect(() => manager.deleteLayer(background.id)).toThrow(
      "Cannot delete the last layer",
    );

    const middle = manager.createLayer("Middle");
    const top = manager.createLayer({ name: "Top", locked: true });

    expect(() => manager.deleteLayer("missing")).toThrow("Layer not found");
    expect(() => manager.deleteLayer(top.id)).toThrow(
      "Cannot delete locked layer",
    );

    manager.updateLayer(top.id, { locked: false });
    manager.setActive(top.id);
    manager.deleteLayer(top.id);
    expect(manager.getActive()).toBe(middle);

    // Deleting a non-active layer preserves the active selection
    manager.setActive(middle.id);
    manager.deleteLayer(background.id);
    expect(manager.getActive()).toBe(middle);
  });

  it("supports addLayerAt, removeLayerOnly, resize, clear, clearActiveLayer", () => {
    const manager = new LayerManager(50, 50);
    const base = manager.getActive();
    base.ctx.fillStyle = "#ff0000";
    base.ctx.fillRect(5, 5, 10, 10);

    const custom = new Layer({
      id: "inserted",
      name: "Inserted",
      width: 50,
      height: 50,
    });
    custom.ctx.fillStyle = "#0000ff";
    custom.ctx.fillRect(20, 20, 10, 10);

    manager.addLayerAt(custom, 0);
    expect(manager.getAll().map((l) => l.id)).toEqual(["inserted", base.id]);

    manager.resize(80, 70);
    expect(base.canvas.width).toBe(80);
    expect(base.canvas.height).toBe(70);
    expect(canvasEnv.getPixel(base.canvas, 8, 8)).toEqual([255, 0, 0, 255]);
    expect(canvasEnv.getPixel(custom.canvas, 25, 25)).toEqual([0, 0, 255, 255]);

    manager.setActive("inserted");
    manager.clearActiveLayer();
    expect(canvasEnv.countNonTransparentPixels(custom.canvas)).toBe(0);
    expect(canvasEnv.countNonTransparentPixels(base.canvas)).toBeGreaterThan(0);

    manager.removeLayerOnly("inserted");
    expect(manager.getAll()).toHaveLength(1);
    expect(manager.getActive()).toBe(base);

    manager.clear();
    expect(canvasEnv.countNonTransparentPixels(base.canvas)).toBe(0);
  });

  it("replaceAllLayers and resetToSingleLayer maintain valid state and preserve initialLayerId", () => {
    const manager = new LayerManager(60, 60);
    const originalId = manager.getActive().id;

    expect(() => manager.replaceAllLayers([])).toThrow(
      "Cannot replace with empty layers array",
    );

    const l1 = new Layer({ id: "a", name: "A", width: 60, height: 60 });
    const l2 = new Layer({ id: "b", name: "B", width: 60, height: 60 });
    manager.replaceAllLayers([l1, l2], "non-existent");
    expect(manager.getActiveId()).toBe("a");

    manager.replaceAllLayers([l1, l2], "b");
    expect(manager.getActiveId()).toBe("b");

    l2.ctx.fillStyle = "#ff0000";
    l2.ctx.fillRect(0, 0, 20, 20);
    l2.opacity = 0.3;
    l2.alphaLock = true;
    l2.locked = true;
    l2.visible = false;
    l2.blendMode = "multiply";

    const reset = manager.resetToSingleLayer();
    expect(manager.getAll()).toHaveLength(1);
    expect(reset.id).toBe(originalId);
    expect(reset.name).toBe("Background");
    expect(reset.visible).toBe(true);
    expect(reset.opacity).toBe(1);
    expect(reset.blendMode).toBe("source-over");
    expect(reset.alphaLock).toBe(false);
    expect(reset.locked).toBe(false);
    expect(canvasEnv.countNonTransparentPixels(reset.canvas)).toBe(0);
  });
});

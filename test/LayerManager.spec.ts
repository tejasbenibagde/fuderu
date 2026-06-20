import { describe, expect, it, beforeAll, vi } from "vitest";
import { LayerManager } from "../src/LayerManager";

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    (contextId: string) => {
      if (contextId === "2d") {
        return {
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({
            data: new Uint8ClampedArray(0),
            width: 100,
            height: 100,
          })),
          putImageData: vi.fn(),
          globalAlpha: 1,
          globalCompositeOperation: "source-over",
        } as unknown as CanvasRenderingContext2D;
      }

      return null;
    },
  );
});

describe("LayerManager", () => {
  it("creates a background layer and makes it active", () => {
    const manager = new LayerManager(320, 240);
    const layers = manager.getAll();

    expect(layers).toHaveLength(1);
    expect(layers[0].name).toBe("Background");
    expect(manager.getActive()).toBe(layers[0]);
  });

  it("creates layers with composition options and selects them", () => {
    const manager = new LayerManager(320, 240);
    const layer = manager.createLayer({
      name: "Ink",
      opacity: 0.5,
      blendMode: "multiply",
      visible: false,
    });

    expect(manager.getActive()).toBe(layer);
    expect(layer.name).toBe("Ink");
    expect(layer.opacity).toBe(0.5);
    expect(layer.blendMode).toBe("multiply");
    expect(layer.visible).toBe(false);
  });

  it("duplicates layer pixels and composition state above the source", () => {
    const manager = new LayerManager(320, 240);
    const source = manager.createLayer({
      name: "Paint",
      opacity: 0.25,
      blendMode: "screen",
    });

    const duplicate = manager.duplicateLayer(source.id);
    const layers = manager.getAll();

    expect(duplicate.name).toBe("Paint Copy");
    expect(duplicate.opacity).toBe(source.opacity);
    expect(duplicate.blendMode).toBe(source.blendMode);
    expect(layers.indexOf(duplicate)).toBe(layers.indexOf(source) + 1);
    expect(manager.getActive()).toBe(duplicate);
  });

  it("moves layers within valid stack bounds", () => {
    const manager = new LayerManager(320, 240);
    const first = manager.getActive();
    const second = manager.createLayer("Second");
    const third = manager.createLayer("Third");

    manager.moveLayer(third.id, 0);
    manager.moveLayer(first.id, 99);

    expect(manager.getAll().map((layer) => layer.id)).toEqual([
      third.id,
      second.id,
      first.id,
    ]);
  });

  it("updates layer metadata safely", () => {
    const manager = new LayerManager(320, 240);
    const layer = manager.createLayer("Layer");

    manager.updateLayer(layer.id, {
      name: "Updated",
      opacity: 2,
      visible: false,
      blendMode: "overlay",
    });

    expect(layer.name).toBe("Updated");
    expect(layer.opacity).toBe(1);
    expect(layer.visible).toBe(false);
    expect(layer.blendMode).toBe("overlay");
  });

  it("keeps a sensible active layer after deletion", () => {
    const manager = new LayerManager(320, 240);
    const background = manager.getActive();
    const paint = manager.createLayer("Paint");

    manager.deleteLayer(paint.id);

    expect(manager.getActive()).toBe(background);
  });
});

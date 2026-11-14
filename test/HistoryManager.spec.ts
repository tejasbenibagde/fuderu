import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  HistoryManager,
  CanvasStateHistoryEntry,
  LayerCreatedHistoryEntry,
  LayerDeletedHistoryEntry,
  LayerPropertyHistoryEntry,
  MoveLayerHistoryEntry,
  type HistoryContext,
} from "../src/HistoryManager";
import { Layer } from "../src/Layer";
import type { Brush } from "../src/Brush";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("HistoryManager & HistoryEntries", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  const createMockContext = () => {
    const layers: Layer[] = [];
    let activeLayerId = "";
    const brush = {
      loadContext: vi.fn(),
      isAlphaLocked: false,
    } as unknown as Brush;

    const context: HistoryContext = {
      getLayer: vi.fn((id) => layers.find((l) => l.id === id)),
      getLayers: vi.fn(() => layers),
      getActiveLayer: vi.fn(
        () => layers.find((l) => l.id === activeLayerId) ?? layers[0],
      ),
      setActiveLayer: vi.fn((id: string) => {
        activeLayerId = id;
      }),
      renderLayers: vi.fn(),
      getBrush: vi.fn(() => brush),
      deleteLayerOnly: vi.fn((id: string) => {
        const idx = layers.findIndex((l) => l.id === id);
        if (idx !== -1) layers.splice(idx, 1);
      }),
      insertLayerOnly: vi.fn((layer: Layer, index: number) => {
        layers.splice(index, 0, layer);
      }),
      moveLayerOnly: vi.fn(),
    };

    return { context, layers, brush };
  };

  describe("HistoryManager core stack semantics", () => {
    it("pushes, undoes, redoes, and clears entries while firing onHistoryChange accurately", () => {
      const manager = new HistoryManager(5);
      const onChange = vi.fn();
      manager.onHistoryChange = onChange;

      const entry1 = { undo: vi.fn(), redo: vi.fn() };
      const entry2 = { undo: vi.fn(), redo: vi.fn() };

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistoryState()).toEqual({
        canUndo: false,
        canRedo: false,
        index: 0,
        length: 0,
      });

      manager.push(entry1);
      manager.push(entry2);
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(manager.getHistoryState()).toEqual({
        canUndo: true,
        canRedo: false,
        index: 2,
        length: 2,
      });

      manager.undo();
      expect(entry2.undo).toHaveBeenCalledTimes(1);
      expect(manager.canRedo()).toBe(true);
      expect(onChange).toHaveBeenCalledTimes(3);

      // Undoing on empty redo/undo stack shouldn't crash or fire extra spurious events if nothing happened
      manager.redo();
      expect(entry2.redo).toHaveBeenCalledTimes(1);
      expect(manager.canRedo()).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(4);

      // No-op redo when redoStack empty
      manager.redo();
      expect(onChange).toHaveBeenCalledTimes(4);

      manager.clear();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(onChange).toHaveBeenCalledTimes(5);
    });

    it("clears redoStack when pushing a new entry after undo", () => {
      const manager = new HistoryManager(10);
      const e1 = { undo: vi.fn(), redo: vi.fn() };
      const e2 = { undo: vi.fn(), redo: vi.fn() };
      const e3 = { undo: vi.fn(), redo: vi.fn() };

      manager.push(e1);
      manager.push(e2);
      manager.undo();
      expect(manager.canRedo()).toBe(true);

      manager.push(e3);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getEntries()).toHaveLength(2);

      manager.undo();
      expect(e3.undo).toHaveBeenCalledTimes(1);
      expect(e2.redo).not.toHaveBeenCalled();
    });

    it("enforces maxStackSize FIFO eviction in exact order", () => {
      const manager = new HistoryManager(2);
      const e1 = { undo: vi.fn(), redo: vi.fn() };
      const e2 = { undo: vi.fn(), redo: vi.fn() };
      const e3 = { undo: vi.fn(), redo: vi.fn() };

      manager.push(e1);
      manager.push(e2);
      manager.push(e3);

      expect(manager.getHistoryState()).toEqual({
        canUndo: true,
        canRedo: false,
        index: 2,
        length: 2,
      });

      manager.undo();
      expect(e3.undo).toHaveBeenCalledTimes(1);
      manager.undo();
      expect(e2.undo).toHaveBeenCalledTimes(1);
      expect(manager.canUndo()).toBe(false);

      manager.undo();
      expect(e1.undo).not.toHaveBeenCalled();
    });

    it("navigates timeline using goTo(index), clamps out-of-bounds, and avoids firing onHistoryChange on no-op", () => {
      const manager = new HistoryManager(10);
      const onChange = vi.fn();
      manager.onHistoryChange = onChange;

      const e1 = { undo: vi.fn(), redo: vi.fn() };
      const e2 = { undo: vi.fn(), redo: vi.fn() };
      const e3 = { undo: vi.fn(), redo: vi.fn() };

      manager.push(e1);
      manager.push(e2);
      manager.push(e3);
      onChange.mockClear();

      // Same index is a strict no-op
      manager.goTo(3);
      expect(onChange).not.toHaveBeenCalled();

      manager.goTo(1);
      expect(e3.undo).toHaveBeenCalledTimes(1);
      expect(e2.undo).toHaveBeenCalledTimes(1);
      expect(e1.undo).not.toHaveBeenCalled();
      expect(manager.getHistoryState().index).toBe(1);
      expect(onChange).toHaveBeenCalledTimes(1);

      manager.goTo(3);
      expect(e2.redo).toHaveBeenCalledTimes(1);
      expect(e3.redo).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledTimes(2);

      manager.goTo(-10);
      expect(manager.getHistoryState().index).toBe(0);
      expect(e1.undo).toHaveBeenCalledTimes(1);

      manager.goTo(100);
      expect(manager.getHistoryState().index).toBe(3);
    });

    it("throws when pushPatch is called without a registered HistoryContext", () => {
      const manager = new HistoryManager(10);
      const img = {
        width: 10,
        height: 10,
        data: new Uint8ClampedArray(400),
      } as ImageData;
      expect(() => manager.pushPatch(img, img)).toThrow(
        "Cannot push patch without a registered HistoryContext",
      );
    });

    it("supports pushPatch with both options object and positional arguments and defaults to active layer", () => {
      const { context, layers } = createMockContext();
      const layer = new Layer({
        id: "layer-1",
        name: "Layer 1",
        width: 50,
        height: 50,
      });
      layers.push(layer);
      context.setActiveLayer(layer.id);

      const manager = new HistoryManager(10, context);
      const beforeImg = layer.ctx.getImageData(0, 0, 20, 20);
      const afterImg = layer.ctx.getImageData(0, 0, 20, 20);

      manager.pushPatch({
        beforeData: beforeImg,
        afterData: afterImg,
        x: 10,
        y: 15,
        description: "Auto layer patch",
      });

      manager.pushPatch(
        beforeImg,
        afterImg,
        5,
        5,
        "layer-1",
        "Positional patch",
      );

      const entries = manager.getEntries();
      expect(entries).toHaveLength(2);
      expect(entries[0]).toMatchObject({
        type: "patch",
        layerId: "layer-1",
        description: "Auto layer patch",
        bounds: { x: 10, y: 15, width: 20, height: 20 },
      });
      expect(entries[1]).toMatchObject({
        type: "patch",
        layerId: "layer-1",
        description: "Positional patch",
        bounds: { x: 5, y: 5, width: 20, height: 20 },
      });
    });
  });

  describe("Entry implementations", () => {
    it("CanvasStateHistoryEntry restores real pixels and reloads brush context ONLY for active layer", () => {
      const { context, layers, brush } = createMockContext();
      const layer1 = new Layer({
        id: "layer-1",
        name: "L1",
        width: 40,
        height: 40,
      });
      const layer2 = new Layer({
        id: "layer-2",
        name: "L2",
        width: 40,
        height: 40,
      });
      layers.push(layer1, layer2);
      context.setActiveLayer("layer-2");

      const beforeData = layer1.ctx.getImageData(10, 10, 10, 10);
      layer1.ctx.fillStyle = "#ff0000";
      layer1.ctx.fillRect(10, 10, 10, 10);
      const afterData = layer1.ctx.getImageData(10, 10, 10, 10);

      const entryOnInactive = new CanvasStateHistoryEntry(
        "layer-1",
        beforeData,
        afterData,
        context,
        10,
        10,
      );

      // layer-1 is NOT active -> brush.loadContext must not be called
      entryOnInactive.undo();
      expect(canvasEnv.getPixel(layer1.canvas, 12, 12)).toEqual([0, 0, 0, 0]);
      expect(brush.loadContext).not.toHaveBeenCalled();

      entryOnInactive.redo();
      expect(canvasEnv.getPixel(layer1.canvas, 12, 12)).toEqual([
        255, 0, 0, 255,
      ]);
      expect(brush.loadContext).not.toHaveBeenCalled();

      // Switch active layer to layer-1 -> now brush.loadContext MUST be called
      context.setActiveLayer("layer-1");
      entryOnInactive.undo();
      expect(brush.loadContext).toHaveBeenCalledWith(layer1.canvas);
    });

    it("LayerDeletedHistoryEntry only restores active layer when wasActive is true", () => {
      const { context } = createMockContext();
      const layer = new Layer({
        id: "l-del",
        name: "Del",
        width: 10,
        height: 10,
      });

      const inactiveDel = new LayerDeletedHistoryEntry(
        layer,
        1,
        false,
        context,
      );
      inactiveDel.undo();
      expect(context.insertLayerOnly).toHaveBeenCalledWith(layer, 1);
      expect(context.setActiveLayer).not.toHaveBeenCalled();

      const activeDel = new LayerDeletedHistoryEntry(layer, 1, true, context);
      activeDel.undo();
      expect(context.setActiveLayer).toHaveBeenCalledWith("l-del");
    });

    it("LayerPropertyHistoryEntry syncs brush.isAlphaLocked on active layer and handles all 6 properties", () => {
      const { context, layers, brush } = createMockContext();
      const layer1 = new Layer({
        id: "layer-1",
        name: "L1",
        width: 20,
        height: 20,
      });
      const layer2 = new Layer({
        id: "layer-2",
        name: "L2",
        width: 20,
        height: 20,
      });
      layers.push(layer1, layer2);
      context.setActiveLayer("layer-1");

      const alphaEntry = new LayerPropertyHistoryEntry(
        "layer-1",
        "alphaLock",
        false,
        true,
        context,
      );
      alphaEntry.redo();
      expect(layer1.alphaLock).toBe(true);
      expect(brush.isAlphaLocked).toBe(true);
      alphaEntry.undo();
      expect(layer1.alphaLock).toBe(false);
      expect(brush.isAlphaLocked).toBe(false);

      // Inactive layer alphaLock change must NOT mutate brush.isAlphaLocked
      brush.isAlphaLocked = false;
      const inactiveAlphaEntry = new LayerPropertyHistoryEntry(
        "layer-2",
        "alphaLock",
        false,
        true,
        context,
      );
      inactiveAlphaEntry.redo();
      expect(layer2.alphaLock).toBe(true);
      expect(brush.isAlphaLocked).toBe(false);

      const lockedEntry = new LayerPropertyHistoryEntry(
        "layer-1",
        "locked",
        false,
        true,
        context,
      );
      lockedEntry.redo();
      expect(layer1.locked).toBe(true);
      lockedEntry.undo();
      expect(layer1.locked).toBe(false);
    });

    it("routes multi-layer undo/redo patches accurately across arbitrary active layer switches", () => {
      const { context, layers } = createMockContext();
      const layer1 = new Layer({
        id: "layer-1",
        name: "L1",
        width: 40,
        height: 40,
      });
      const layer2 = new Layer({
        id: "layer-2",
        name: "L2",
        width: 40,
        height: 40,
      });
      const layer3 = new Layer({
        id: "layer-3",
        name: "L3",
        width: 40,
        height: 40,
      });
      layers.push(layer1, layer2, layer3);

      const manager = new HistoryManager(20, context);

      const recordRectPatch = (
        layer: Layer,
        color: string,
        x: number,
        y: number,
      ) => {
        context.setActiveLayer(layer.id);
        const beforeData = layer.ctx.getImageData(x, y, 10, 10);
        layer.ctx.fillStyle = color;
        layer.ctx.fillRect(x, y, 10, 10);
        const afterData = layer.ctx.getImageData(x, y, 10, 10);
        manager.pushPatch({
          layerId: layer.id,
          beforeData,
          afterData,
          x,
          y,
          description: `Rect ${color}`,
        });
      };

      recordRectPatch(layer1, "#ff0000", 0, 0);
      recordRectPatch(layer2, "#00ff00", 5, 5);
      recordRectPatch(layer3, "#0000ff", 15, 15);

      context.setActiveLayer(layer1.id);

      // Undo step 1 -> Layer 3 becomes transparent even while Layer 1 is active
      manager.undo();
      expect(canvasEnv.getPixel(layer3.canvas, 17, 17)).toEqual([0, 0, 0, 0]);
      expect(canvasEnv.getPixel(layer2.canvas, 7, 7)).toEqual([0, 255, 0, 255]);

      // Undo step 2 -> Layer 2 becomes transparent
      manager.undo();
      expect(canvasEnv.getPixel(layer2.canvas, 7, 7)).toEqual([0, 0, 0, 0]);
      expect(canvasEnv.getPixel(layer1.canvas, 2, 2)).toEqual([255, 0, 0, 255]);

      // Undo step 3 -> Layer 1 becomes transparent
      manager.undo();
      expect(canvasEnv.getPixel(layer1.canvas, 2, 2)).toEqual([0, 0, 0, 0]);

      // Redo back sequentially restores exact RGB colors
      manager.redo();
      expect(canvasEnv.getPixel(layer1.canvas, 2, 2)).toEqual([255, 0, 0, 255]);
      manager.redo();
      expect(canvasEnv.getPixel(layer2.canvas, 7, 7)).toEqual([0, 255, 0, 255]);
      manager.redo();
      expect(canvasEnv.getPixel(layer3.canvas, 17, 17)).toEqual([
        0, 0, 255, 255,
      ]);
    });

    it("LayerCreatedHistoryEntry & MoveLayerHistoryEntry invoke context methods with expected indices", () => {
      const { context, layers } = createMockContext();
      const layer = new Layer({
        id: "l-new",
        name: "Created",
        width: 10,
        height: 10,
      });
      const created = new LayerCreatedHistoryEntry(layer, context, 1);

      created.redo();
      expect(context.insertLayerOnly).toHaveBeenCalledWith(layer, 1);
      expect(context.setActiveLayer).toHaveBeenCalledWith("l-new");

      created.undo();
      expect(context.deleteLayerOnly).toHaveBeenCalledWith("l-new");
      expect(layers).toHaveLength(0);

      const moveEntry = new MoveLayerHistoryEntry("l-new", 0, 2, context);
      moveEntry.undo();
      expect(context.moveLayerOnly).toHaveBeenCalledWith("l-new", 0);
      moveEntry.redo();
      expect(context.moveLayerOnly).toHaveBeenCalledWith("l-new", 2);
    });
  });
});

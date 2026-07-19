import { describe, expect, it, vi } from "vitest";
import {
  HistoryManager,
  CanvasStateHistoryEntry,
  LayerCreatedHistoryEntry,
  LayerDeletedHistoryEntry,
  LayerPropertyHistoryEntry,
  MoveLayerHistoryEntry,
  HistoryContext,
} from "../src/HistoryManager";
import type { Layer } from "../src/Layer";
import type { Brush } from "../src/Brush";

describe("HistoryManager & HistoryEntries", () => {
  const createMockContext = () => {
    const layers: Layer[] = [];
    const brush = {
      loadContext: vi.fn(),
    } as unknown as Brush;

    const context: HistoryContext = {
      getLayer: vi.fn((id) => layers.find((l) => l.id === id)),
      getLayers: vi.fn(() => layers),
      getActiveLayer: vi.fn(() => layers[0]),
      setActiveLayer: vi.fn(),
      renderLayers: vi.fn(),
      getBrush: vi.fn(() => brush),
      deleteLayerOnly: vi.fn(),
      insertLayerOnly: vi.fn(),
      moveLayerOnly: vi.fn(),
    };

    return { context, layers, brush };
  };

  const createMockLayer = (id: string, name: string) => {
    const mockCtx = {
      putImageData: vi.fn(),
    };
    const mockCanvas = {
      getContext: vi.fn(() => mockCtx),
    } as unknown as HTMLCanvasElement;

    return {
      id,
      name,
      canvas: mockCanvas,
      visible: true,
      opacity: 1,
      blendMode: "source-over",
      setOpacity: vi.fn(function (this: { opacity: number }, val: number) {
        this.opacity = val;
      }),
    } as unknown as Layer;
  };

  describe("HistoryManager", () => {
    it("should push entries and pop them during undo/redo", () => {
      const manager = new HistoryManager(5);
      const entry1 = { undo: vi.fn(), redo: vi.fn() };
      const entry2 = { undo: vi.fn(), redo: vi.fn() };

      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);

      manager.push(entry1);
      expect(manager.canUndo()).toBe(true);
      expect(manager.canRedo()).toBe(false);

      manager.push(entry2);
      expect(manager.canUndo()).toBe(true);

      manager.undo();
      expect(entry2.undo).toHaveBeenCalledTimes(1);
      expect(manager.canRedo()).toBe(true);

      manager.redo();
      expect(entry2.redo).toHaveBeenCalledTimes(1);

      manager.clear();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
    });

    it("should respect max stack size limits", () => {
      const manager = new HistoryManager(2);
      const entry1 = { undo: vi.fn(), redo: vi.fn() };
      const entry2 = { undo: vi.fn(), redo: vi.fn() };
      const entry3 = { undo: vi.fn(), redo: vi.fn() };

      manager.push(entry1);
      manager.push(entry2);
      manager.push(entry3);

      manager.undo(); // undoes entry3
      expect(entry3.undo).toHaveBeenCalledTimes(1);

      manager.undo(); // undoes entry2
      expect(entry2.undo).toHaveBeenCalledTimes(1);

      manager.undo(); // nothing left (entry1 was shifted out)
      expect(entry1.undo).not.toHaveBeenCalled();
    });
  });

  describe("CanvasStateHistoryEntry", () => {
    it("should apply sparse image data updates during undo and redo", () => {
      const { context, layers } = createMockContext();
      const mockLayer = createMockLayer("layer-1", "Layer 1");
      layers.push(mockLayer);

      const beforeData = {} as ImageData;
      const afterData = {} as ImageData;
      const entry = new CanvasStateHistoryEntry(
        "layer-1",
        beforeData,
        afterData,
        context,
        15,
        25,
      );

      const ctx2d = mockLayer.canvas.getContext("2d") as unknown as {
        putImageData: ReturnType<typeof vi.fn>;
      };
      const putImageDataMock = ctx2d ? ctx2d.putImageData : null;

      entry.undo();
      expect(putImageDataMock).toHaveBeenCalledWith(beforeData, 15, 25);
      expect(context.renderLayers).toHaveBeenCalled();

      entry.redo();
      expect(putImageDataMock).toHaveBeenCalledWith(afterData, 15, 25);
      expect(context.renderLayers).toHaveBeenCalled();
    });
  });

  describe("LayerCreatedHistoryEntry", () => {
    it("should delete layer on undo and insert it on redo", () => {
      const { context, layers } = createMockContext();
      const mockLayer = createMockLayer("layer-1", "Layer 1");

      const entry = new LayerCreatedHistoryEntry(mockLayer, context);

      entry.undo();
      expect(context.deleteLayerOnly).toHaveBeenCalledWith("layer-1");

      entry.redo();
      expect(context.insertLayerOnly).toHaveBeenCalledWith(
        mockLayer,
        layers.length,
      );
      expect(context.setActiveLayer).toHaveBeenCalledWith("layer-1");
    });
  });

  describe("LayerDeletedHistoryEntry", () => {
    it("should insert layer back on undo and delete it on redo", () => {
      const { context } = createMockContext();
      const mockLayer = createMockLayer("layer-1", "Layer 1");

      const entry = new LayerDeletedHistoryEntry(mockLayer, 2, true, context);

      entry.undo();
      expect(context.insertLayerOnly).toHaveBeenCalledWith(mockLayer, 2);
      expect(context.setActiveLayer).toHaveBeenCalledWith("layer-1");

      entry.redo();
      expect(context.deleteLayerOnly).toHaveBeenCalledWith("layer-1");
    });
  });

  describe("LayerPropertyHistoryEntry", () => {
    it("should undo and redo opacity, name, visible, and blendMode modifications", () => {
      const { context, layers } = createMockContext();
      const mockLayer = createMockLayer("layer-1", "Layer 1");
      layers.push(mockLayer);

      // 1. Name
      const nameEntry = new LayerPropertyHistoryEntry(
        "layer-1",
        "name",
        "Old Name",
        "New Name",
        context,
      );
      nameEntry.undo();
      expect(mockLayer.name).toBe("Old Name");
      nameEntry.redo();
      expect(mockLayer.name).toBe("New Name");

      // 2. Opacity
      const opacityEntry = new LayerPropertyHistoryEntry(
        "layer-1",
        "opacity",
        0.5,
        0.8,
        context,
      );
      opacityEntry.undo();
      expect(mockLayer.opacity).toBe(0.5);
      opacityEntry.redo();
      expect(mockLayer.opacity).toBe(0.8);

      // 3. Visible
      const visibleEntry = new LayerPropertyHistoryEntry(
        "layer-1",
        "visible",
        false,
        true,
        context,
      );
      visibleEntry.undo();
      expect(mockLayer.visible).toBe(false);
      visibleEntry.redo();
      expect(mockLayer.visible).toBe(true);

      // 4. BlendMode
      const blendEntry = new LayerPropertyHistoryEntry(
        "layer-1",
        "blendMode",
        "multiply",
        "screen",
        context,
      );
      blendEntry.undo();
      expect(mockLayer.blendMode).toBe("multiply");
      blendEntry.redo();
      expect(mockLayer.blendMode).toBe("screen");
    });
  });

  describe("MoveLayerHistoryEntry", () => {
    it("should reorder layers on undo and redo", () => {
      const { context } = createMockContext();
      const entry = new MoveLayerHistoryEntry("layer-1", 1, 3, context);

      entry.undo();
      expect(context.moveLayerOnly).toHaveBeenCalledWith("layer-1", 1);

      entry.redo();
      expect(context.moveLayerOnly).toHaveBeenCalledWith("layer-1", 3);
    });
  });
});

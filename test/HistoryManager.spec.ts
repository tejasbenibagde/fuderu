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

    it("should return history summaries via getEntries()", () => {
      const { context, layers } = createMockContext();
      const mockLayer = createMockLayer("layer-1", "Layer 1");
      layers.push(mockLayer);

      const manager = new HistoryManager(10, context);
      const entry1 = new CanvasStateHistoryEntry(
        "layer-1",
        { width: 50, height: 50 } as ImageData,
        { width: 50, height: 50 } as ImageData,
        context,
        0,
        0,
        "Initial stroke",
        "stroke",
      );
      const entry2 = new LayerCreatedHistoryEntry(
        mockLayer,
        context,
        0,
        "Created test layer",
      );

      manager.push(entry1);
      manager.push(entry2);

      const entries = manager.getEntries();
      expect(entries.length).toBe(2);
      expect(entries[0].type).toBe("stroke");
      expect(entries[0].description).toBe("Initial stroke");
      expect(entries[1].type).toBe("layer-create");
      expect(entries[1].description).toBe("Created test layer");

      manager.undo(); // undo entry2
      const entriesAfterUndo = manager.getEntries();
      expect(entriesAfterUndo.length).toBe(2);
      expect(entriesAfterUndo[1].type).toBe("layer-create");
    });

    it("should navigate history timeline using goTo(index)", () => {
      const manager = new HistoryManager(10);
      const e1 = { undo: vi.fn(), redo: vi.fn() };
      const e2 = { undo: vi.fn(), redo: vi.fn() };
      const e3 = { undo: vi.fn(), redo: vi.fn() };

      manager.push(e1);
      manager.push(e2);
      manager.push(e3);

      expect(manager.getHistoryState().index).toBe(3);

      // Jump to index 1 (undo e3, undo e2)
      manager.goTo(1);
      expect(e3.undo).toHaveBeenCalledTimes(1);
      expect(e2.undo).toHaveBeenCalledTimes(1);
      expect(manager.getHistoryState().index).toBe(1);

      // Jump to index 3 (redo e2, redo e3)
      manager.goTo(3);
      expect(e2.redo).toHaveBeenCalledTimes(1);
      expect(e3.redo).toHaveBeenCalledTimes(1);
      expect(manager.getHistoryState().index).toBe(3);

      // Jump to index 0 (undo e3, e2, e1)
      manager.goTo(0);
      expect(manager.getHistoryState().index).toBe(0);

      // Jump out of bounds should clamp safely
      manager.goTo(-5);
      expect(manager.getHistoryState().index).toBe(0);

      manager.goTo(100);
      expect(manager.getHistoryState().index).toBe(3);
    });

    it("should support pushPatch with options object and positional arguments", () => {
      const { context, layers } = createMockContext();
      const mockLayer = createMockLayer("layer-1", "Layer 1");
      layers.push(mockLayer);

      const manager = new HistoryManager(10, context);
      const onHistoryChange = vi.fn();
      manager.onHistoryChange = onHistoryChange;

      const beforeImg = { width: 100, height: 100 } as ImageData;
      const afterImg = { width: 100, height: 100 } as ImageData;

      // Object format
      manager.pushPatch({
        layerId: "layer-1",
        beforeData: beforeImg,
        afterData: afterImg,
        x: 10,
        y: 20,
        description: "Text Tool Patch",
      });

      expect(manager.canUndo()).toBe(true);
      expect(onHistoryChange).toHaveBeenCalled();

      let entries = manager.getEntries();
      expect(entries[0].description).toBe("Text Tool Patch");
      expect(entries[0].type).toBe("patch");
      expect(entries[0].bounds).toEqual({
        x: 10,
        y: 20,
        width: 100,
        height: 100,
      });

      // Positional format
      manager.pushPatch(beforeImg, afterImg, 5, 5, "layer-1", "Filter Patch");
      entries = manager.getEntries();
      expect(entries[1].description).toBe("Filter Patch");
      expect(entries[1].type).toBe("patch");
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

  describe("Multi-Layer Global History Regression Suite", () => {
    it("should correctly route undo and redo across arbitrary active layer switches", () => {
      const { context, layers } = createMockContext();
      const layer1 = createMockLayer("layer-1", "Layer 1");
      const layer2 = createMockLayer("layer-2", "Layer 2");
      const layer3 = createMockLayer("layer-3", "Layer 3");
      layers.push(layer1, layer2, layer3);

      let currentActive = layer1;
      (
        context.getActiveLayer as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(() => currentActive);
      (
        context.setActiveLayer as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation((id: string) => {
        const found = layers.find((l) => l.id === id);
        if (found) currentActive = found;
      });

      const manager = new HistoryManager(20, context);

      const imgA1 = { width: 10, height: 10 } as ImageData;
      const imgA2 = { width: 10, height: 10 } as ImageData;
      const imgB1 = { width: 10, height: 10 } as ImageData;
      const imgB2 = { width: 10, height: 10 } as ImageData;
      const imgC1 = { width: 10, height: 10 } as ImageData;
      const imgC2 = { width: 10, height: 10 } as ImageData;

      // 1. Draw on Layer 1 (active is Layer 1)
      currentActive = layer1;
      manager.pushPatch({
        layerId: "layer-1",
        beforeData: imgA1,
        afterData: imgA2,
        x: 0,
        y: 0,
        description: "Stroke on Layer 1",
      });

      // 2. User switches to Layer 2, draws on Layer 2
      currentActive = layer2;
      manager.pushPatch({
        layerId: "layer-2",
        beforeData: imgB1,
        afterData: imgB2,
        x: 5,
        y: 5,
        description: "Stroke on Layer 2",
      });

      // 3. User switches to Layer 3, draws on Layer 3
      currentActive = layer3;
      manager.pushPatch({
        layerId: "layer-3",
        beforeData: imgC1,
        afterData: imgC2,
        x: 15,
        y: 15,
        description: "Stroke on Layer 3",
      });

      // 4. Now active layer is Layer 1 again
      currentActive = layer1;

      // Undo step 1: Undoes stroke on Layer 3
      const ctxL3 = layer3.canvas.getContext("2d")!;
      manager.undo();
      expect(ctxL3.putImageData).toHaveBeenCalledWith(imgC1, 15, 15);

      // Undo step 2: Undoes stroke on Layer 2 even though currentActive is Layer 1
      const ctxL2 = layer2.canvas.getContext("2d")!;
      manager.undo();
      expect(ctxL2.putImageData).toHaveBeenCalledWith(imgB1, 5, 5);

      // Switch active layer to Layer 3 and undo step 3: Undoes stroke on Layer 1
      currentActive = layer3;
      const ctxL1 = layer1.canvas.getContext("2d")!;
      manager.undo();
      expect(ctxL1.putImageData).toHaveBeenCalledWith(imgA1, 0, 0);

      // Redo step 1: Redoes stroke on Layer 1
      manager.redo();
      expect(ctxL1.putImageData).toHaveBeenCalledWith(imgA2, 0, 0);

      // Redo step 2: Redoes stroke on Layer 2
      manager.redo();
      expect(ctxL2.putImageData).toHaveBeenCalledWith(imgB2, 5, 5);

      // Redo step 3: Redoes stroke on Layer 3
      manager.redo();
      expect(ctxL3.putImageData).toHaveBeenCalledWith(imgC2, 15, 15);
    });
  });
});

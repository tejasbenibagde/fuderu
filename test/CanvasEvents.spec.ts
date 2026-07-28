import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import type {
  CanvasSnapshot,
  HistoryState,
  StrokeStartEvent,
  StrokeEndEvent,
} from "../src/types/events";

const mockBrushInstance = {
  isSmooth: true,
  isSpacing: true,
  config: { size: 10 },
  putPoint: vi.fn(),
  render: vi.fn(),
  finalizeStroke: vi.fn((cb: () => void) => cb()),
  clear: vi.fn(),
  undo: vi.fn(),
  redo: vi.fn(),
  loadConfig: vi.fn(),
  loadImageAsync: vi.fn(),
  loadContext: vi.fn(),
};

vi.mock("../src/Brush", () => {
  return {
    Brush: vi.fn(function () {
      return mockBrushInstance;
    }),
  };
});

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(
    function (contextId: string) {
      if (contextId === "2d") {
        return {
          scale: vi.fn(),
          setTransform: vi.fn(),
          clearRect: vi.fn(),
          drawImage: vi.fn(),
          getImageData: vi.fn(() => ({
            data: [],
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
        } as unknown as CanvasRenderingContext2D;
      }
      return null;
    },
  );

  vi.spyOn(
    HTMLCanvasElement.prototype,
    "getBoundingClientRect",
  ).mockImplementation(() => ({
    left: 0,
    top: 0,
    right: 500,
    bottom: 400,
    width: 500,
    height: 400,
    x: 0,
    y: 0,
    toJSON: () => {},
  }));
});

describe("Observable State Model & Change Event System", () => {
  let canvasEl: HTMLCanvasElement;
  let painter: Canvas;

  beforeEach(() => {
    vi.clearAllMocks();
    canvasEl = document.createElement("canvas");
    painter = new Canvas({
      canvas: canvasEl,
      document: { width: 500, height: 400 },
    });
  });

  describe("getSnapshot", () => {
    it("returns accurate canvas state snapshot", () => {
      const snapshot = painter.getSnapshot();
      expect(snapshot.documentWidth).toBe(500);
      expect(snapshot.documentHeight).toBe(400);
      expect(snapshot.layers.length).toBe(1);
      expect(snapshot.activeLayerId).toBe(snapshot.layers[0].id);
      expect(snapshot.history).toEqual({
        canUndo: false,
        canRedo: false,
        index: 0,
        length: 0,
      });
    });
  });

  describe("change event", () => {
    it("emits change event with updated snapshot when layer is added", () => {
      const listener = vi.fn();
      const unsub = painter.on("change", listener);

      const layer2 = painter.createLayer("Layer 2");

      expect(listener).toHaveBeenCalled();
      const snapshot: CanvasSnapshot = listener.mock.calls[0][0];
      expect(snapshot.layers.length).toBe(2);
      expect(snapshot.activeLayerId).toBe(layer2.id);

      unsub();
      painter.createLayer("Layer 3");
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it("emits change event when layer property is updated", () => {
      const listener = vi.fn();
      painter.on("change", listener);

      const layer1 = painter.getActiveLayer();
      painter.updateLayer(layer1.id, { opacity: 0.5, name: "Renamed" });

      expect(listener).toHaveBeenCalled();
      const snapshot: CanvasSnapshot =
        listener.mock.calls[listener.mock.calls.length - 1][0];
      expect(snapshot.layers[0].name).toBe("Renamed");
      expect(snapshot.layers[0].opacity).toBe(0.5);
    });
  });

  describe("history:change event", () => {
    it("emits history:change when actions are pushed, undone, and redone", () => {
      const historyListener = vi.fn();
      painter.on("history:change", historyListener);

      painter.createLayer("Test Layer");
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: true,
        canRedo: false,
        index: 1,
        length: 1,
      } as HistoryState);

      painter.undo();
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: false,
        canRedo: true,
        index: 0,
        length: 1,
      } as HistoryState);

      painter.redo();
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: true,
        canRedo: false,
        index: 1,
        length: 1,
      } as HistoryState);
    });
  });

  describe("stroke:start and stroke:end events", () => {
    it("emits stroke events during pointer drawing lifecycle", () => {
      const startListener = vi.fn();
      const endListener = vi.fn();
      painter.on("stroke:start", startListener);
      painter.on("stroke:end", endListener);

      const activeLayer = painter.getActiveLayer();

      const pointerDownEvent = new PointerEvent("pointerdown", {
        clientX: 100,
        clientY: 150,
        pointerType: "mouse",
      });
      canvasEl.dispatchEvent(pointerDownEvent);

      expect(startListener).toHaveBeenCalledTimes(1);
      const startPayload: StrokeStartEvent = startListener.mock.calls[0][0];
      expect(startPayload.layerId).toBe(activeLayer.id);
      expect(startPayload.point.x).toBe(100);
      expect(startPayload.point.y).toBe(150);

      const pointerMoveEvent = new PointerEvent("pointermove", {
        clientX: 200,
        clientY: 250,
        pointerType: "mouse",
      });
      canvasEl.dispatchEvent(pointerMoveEvent);

      const pointerUpEvent = new PointerEvent("pointerup", {
        clientX: 200,
        clientY: 250,
        pointerType: "mouse",
      });
      window.dispatchEvent(pointerUpEvent);

      expect(endListener).toHaveBeenCalledTimes(1);
      const endPayload: StrokeEndEvent = endListener.mock.calls[0][0];
      expect(endPayload.layerId).toBe(activeLayer.id);
      expect(endPayload.points.length).toBeGreaterThanOrEqual(2);
      expect(endPayload.bounds.width).toBeGreaterThan(0);
      expect(endPayload.bounds.height).toBeGreaterThan(0);
    });
  });

  describe("layer:change event", () => {
    it("emits layer:change with layer list and active layer ID", () => {
      const listener = vi.fn();
      painter.on("layer:change", listener);

      const l2 = painter.createLayer("New Layer");
      expect(listener).toHaveBeenCalledWith(painter.getLayers(), l2.id);
    });
  });
});

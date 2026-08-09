import { describe, expect, it, beforeAll, beforeEach, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import type { CanvasAction, StrokeAction } from "../src/types/actions";

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
  syncOriCanvas: vi.fn(),
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
            data: new Uint8ClampedArray(400),
            width: 10,
            height: 10,
          })),
          putImageData: vi.fn(),
          save: vi.fn(),
          restore: vi.fn(),
          beginPath: vi.fn(),
          closePath: vi.fn(),
          fill: vi.fn(),
          stroke: vi.fn(),
          ellipse: vi.fn(),
          rect: vi.fn(),
          roundRect: vi.fn(),
          moveTo: vi.fn(),
          lineTo: vi.fn(),
          fillText: vi.fn(),
          measureText: vi.fn(() => ({ width: 50 })),
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

describe("Operation Log & Action Replay API", () => {
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

  describe("Action Recording and Log Management", () => {
    it("records layer creation and emits action:record", () => {
      const actionListener = vi.fn();
      painter.on("action:record", actionListener);

      const layer2 = painter.createLayer("Layer 2");

      expect(actionListener).toHaveBeenCalledTimes(1);
      const action: CanvasAction = actionListener.mock.calls[0][0];
      expect(action.type).toBe("createLayer");
      expect(action.layerId).toBe(layer2.id);
      if (action.type === "createLayer") {
        expect(action.name).toBe("Layer 2");
      }

      const log = painter.getActionLog();
      expect(log.length).toBe(1);
      expect(log[0].id).toBeDefined();
      expect(log[0].timestamp).toBeDefined();
    });

    it("records vector shape commands", () => {
      const activeLayer = painter.getActiveLayer();

      painter.drawRectangle({
        x: 10,
        y: 10,
        width: 50,
        height: 50,
        fillColor: "#ff0000",
      });
      painter.drawEllipse({ x: 100, y: 100, radiusX: 20, radiusY: 30 });
      painter.drawLine({ x1: 0, y1: 0, x2: 100, y2: 100 });
      painter.drawText("Hello", 10, 20);

      const log = painter.getActionLog();
      expect(log.length).toBe(4);
      expect(log[0].type).toBe("drawRectangle");
      expect(log[1].type).toBe("drawEllipse");
      expect(log[2].type).toBe("drawLine");
      expect(log[3].type).toBe("drawText");

      expect(log[0].layerId).toBe(activeLayer.id);
    });

    it("records fill and flood fill actions", () => {
      painter.fillActiveLayer("#00ff00");
      painter.floodFill(25, 25, "#0000ff", 10);

      const log = painter.getActionLog();
      expect(log.length).toBe(2);
      expect(log[0].type).toBe("fillLayer");
      expect(log[1].type).toBe("floodFill");
    });

    it("records stroke actions and emits stroke:record event", () => {
      const strokeListener = vi.fn();
      painter.on("stroke:record", strokeListener);

      const pointerDown = new PointerEvent("pointerdown", {
        clientX: 10,
        clientY: 10,
      });
      const pointerMove = new PointerEvent("pointermove", {
        clientX: 20,
        clientY: 20,
      });
      const pointerUp = new PointerEvent("pointerup", {
        clientX: 20,
        clientY: 20,
      });

      canvasEl.dispatchEvent(pointerDown);
      canvasEl.dispatchEvent(pointerMove);
      window.dispatchEvent(pointerUp);

      expect(strokeListener).toHaveBeenCalledTimes(1);
      const strokeAction: StrokeAction = strokeListener.mock.calls[0][0];
      expect(strokeAction.type).toBe("stroke");
      expect(strokeAction.points.length).toBeGreaterThanOrEqual(2);
    });

    it("clears action log using clearActionLog()", () => {
      painter.createLayer("Layer 2");
      painter.fillActiveLayer("#ffffff");
      expect(painter.getActionLog().length).toBe(2);

      painter.clearActionLog();
      expect(painter.getActionLog().length).toBe(0);
    });
  });

  describe("Action Replay System", () => {
    it("replays single actions without appending to action log during replay", async () => {
      const activeLayer = painter.getActiveLayer();

      const action: CanvasAction = {
        type: "drawRectangle",
        id: "rect-1",
        timestamp: Date.now(),
        layerId: activeLayer.id,
        options: { x: 5, y: 5, width: 20, height: 20, fillColor: "#0000ff" },
      };

      await painter.replayAction(action);

      // Verify that replaying did not pollute the recorded action log
      expect(painter.getActionLog().length).toBe(0);
    });

    it("replays a full stream of recorded actions onto another canvas", async () => {
      painter.createLayer("Background");
      painter.fillActiveLayer("#ff0000");
      painter.drawRectangle({ x: 0, y: 0, width: 100, height: 100 });

      const recordedLog = painter.getActionLog();
      expect(recordedLog.length).toBe(3);

      const targetCanvasEl = document.createElement("canvas");
      const targetPainter = new Canvas({
        canvas: targetCanvasEl,
        document: { width: 500, height: 400 },
      });

      const onAction = vi.fn();
      const onProgress = vi.fn();

      await targetPainter.replay(recordedLog, {
        onAction,
        onProgress,
      });

      expect(onAction).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenCalledTimes(3);
      expect(onProgress).toHaveBeenLastCalledWith(1, 3, 3);

      // Verify target canvas has 2 layers now (initial default + created Background)
      expect(targetPainter.getLayers().length).toBe(2);
    });
  });
});

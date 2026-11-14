import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import type { CanvasAction, StrokeAction } from "../src/types/actions";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Operation Log & Action Replay API", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let canvasEl: HTMLCanvasElement;
  let painter: Canvas;

  beforeEach(() => {
    canvasEnv = installCanvas2DMock();
    vi.spyOn(
      HTMLCanvasElement.prototype,
      "getBoundingClientRect",
    ).mockImplementation(() => ({
      left: 0,
      top: 0,
      right: 200,
      bottom: 160,
      width: 200,
      height: 160,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    canvasEl = document.createElement("canvas");
    painter = new Canvas({
      canvas: canvasEl,
      document: { width: 200, height: 160 },
    });
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("Action Recording and Log Management", () => {
    it("records layer creation, metadata updates, duplication, movement, and deletion", () => {
      const actionListener = vi.fn();
      painter.on("action:record", actionListener);

      const layer2 = painter.createLayer("Ink");
      painter.updateLayer(layer2.id, { opacity: 0.6, visible: false });
      const dup = painter.duplicateLayer(layer2.id);
      painter.moveLayer(dup.id, 0);
      painter.deleteLayer(dup.id);

      const log = painter.getActionLog();
      expect(log.map((a) => a.type)).toEqual([
        "createLayer",
        "setLayerProperties",
        "duplicateLayer",
        "moveLayer",
        "deleteLayer",
      ]);
      expect(actionListener).toHaveBeenCalledTimes(5);
      expect(log[0].id).toBeTruthy();
      expect(typeof log[0].timestamp).toBe("number");
    });

    it("records vector shape commands, fills, and stroke:record events", async () => {
      const strokeListener = vi.fn();
      painter.on("stroke:record", strokeListener);

      painter.drawRectangle({
        x: 10,
        y: 10,
        width: 30,
        height: 30,
        fillColor: "#ff0000",
      });
      painter.drawEllipse({ x: 80, y: 80, radiusX: 15, radiusY: 15 });
      painter.drawLine({ x1: 0, y1: 0, x2: 50, y2: 50 });
      painter.drawText("Hello", 10, 100);
      painter.fillActiveLayer("#00ff00");
      painter.floodFill(25, 25, "#0000ff", 5);

      canvasEl.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 20,
          clientY: 20,
          pointerId: 1,
        }),
      );
      canvasEl.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 60,
          clientY: 60,
          pointerId: 1,
        }),
      );
      window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
      await painter.brush.flush();

      expect(strokeListener).toHaveBeenCalledTimes(1);
      const strokeAction: StrokeAction = strokeListener.mock.calls[0][0];
      expect(strokeAction.type).toBe("stroke");
      expect(strokeAction.points).toEqual([
        { x: 20, y: 20, pressure: 1 },
        { x: 60, y: 60, pressure: 1 },
      ]);

      expect(painter.getActionLog().map((a) => a.type)).toEqual([
        "drawRectangle",
        "drawEllipse",
        "drawLine",
        "drawText",
        "fillLayer",
        "floodFill",
        "stroke",
      ]);

      painter.clearActionLog();
      expect(painter.getActionLog()).toEqual([]);
    });
  });

  describe("Action Replay System", () => {
    it("replays single actions cleanly with expected pixel effects and without polluting action log", async () => {
      const activeLayer = painter.getActiveLayer();

      const action: CanvasAction = {
        type: "drawRectangle",
        id: "rect-1",
        timestamp: Date.now(),
        layerId: activeLayer.id,
        options: {
          x: 10,
          y: 10,
          width: 30,
          height: 30,
          fillColor: "#0000ff",
          stroke: false,
        },
      };

      await painter.replayAction(action);

      expect(painter.getActionLog()).toHaveLength(0);
      expect(painter.getColorAt(25, 25, "activeLayer").hex).toBe("#0000ff");
    });

    it("replays a full multi-layer action stream onto another canvas and reproduces identical pixels & hierarchy", async () => {
      painter.fillActiveLayer("#ff0000");
      const ink = painter.createLayer({ name: "Ink", opacity: 1 });
      painter.drawRectangle({
        x: 20,
        y: 20,
        width: 40,
        height: 40,
        fillColor: "#00ff00",
        stroke: false,
      });
      painter.floodFill(30, 30, "#ffff00");
      painter.updateLayer(ink.id, { opacity: 0.5 });

      const recordedLog = painter.getActionLog();

      const targetEl = document.createElement("canvas");
      const targetPainter = new Canvas({
        canvas: targetEl,
        document: { width: 200, height: 160 },
      });

      const onAction = vi.fn();
      const onProgress = vi.fn();

      await targetPainter.replay(recordedLog, { onAction, onProgress });

      expect(onAction).toHaveBeenCalledTimes(recordedLog.length);
      expect(onProgress).toHaveBeenLastCalledWith(
        1,
        recordedLog.length,
        recordedLog.length,
      );
      expect(targetPainter.getActionLog()).toHaveLength(0);
      expect(targetPainter.getLayers()).toHaveLength(2);
      expect(targetPainter.getLayers()[1].name).toBe("Ink");
      expect(targetPainter.getLayers()[1].opacity).toBe(0.5);
      expect(targetPainter.getColorAt(30, 30, "activeLayer").hex).toBe(
        "#ffff00",
      );
    });

    it("replays stroke actions onto a fresh canvas and restores previous brush config afterwards", async () => {
      const targetEl = document.createElement("canvas");
      const targetPainter = new Canvas({
        canvas: targetEl,
        document: { width: 200, height: 160 },
        brush: { size: 33, color: "#111111" },
      });

      const action: StrokeAction = {
        type: "stroke",
        layerId: "foreign-layer-id",
        brushConfig: { size: 12, color: "#ff0000", opacity: 1, flow: 1 },
        points: [
          { x: 20, y: 20, pressure: 1 },
          { x: 60, y: 20, pressure: 1 },
        ],
      };

      await targetPainter.replay([action]);

      // Stroke drew red pixels onto the fallback active layer
      expect(targetPainter.getColorAt(40, 20, "activeLayer").hex).toBe(
        "#ff0000",
      );
      // Original brush config restored after replay
      expect(targetPainter.brush.config.size).toBe(33);
      expect(targetPainter.brush.config.color).toBe("#111111");
      expect(targetPainter.getActionLog()).toHaveLength(0);
    });
  });
});

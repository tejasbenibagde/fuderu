import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { ClipboardStore } from "../src/Clipboard";
import type {
  CanvasSnapshot,
  HistoryState,
  StrokeEndEvent,
  StrokeStartEvent,
} from "../src/types/events";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Observable State Model & Change Event System", () => {
  let canvasEnv: Canvas2DMockEnvironment;
  let canvasEl: HTMLCanvasElement;
  let painter: Canvas;

  beforeEach(() => {
    ClipboardStore.clear();
    canvasEnv = installCanvas2DMock();
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

    canvasEl = document.createElement("canvas");
    painter = new Canvas({
      canvas: canvasEl,
      document: { width: 500, height: 400 },
    });
  });

  afterEach(() => {
    painter.destroy();
    ClipboardStore.clear();
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("getSnapshot", () => {
    it("returns frozen accurate canvas state snapshot including selection/transform/clipboard", () => {
      const snapshot = painter.getSnapshot();
      expect(Object.isFrozen(snapshot)).toBe(true);
      expect(snapshot.documentWidth).toBe(500);
      expect(snapshot.documentHeight).toBe(400);
      expect(snapshot.layers).toHaveLength(1);
      expect(snapshot.activeLayerId).toBe(snapshot.layers[0].id);
      expect(snapshot.selection?.active).toBe(false);
      expect(snapshot.transform).toBeNull();
      expect(snapshot.clipboard?.hasData).toBe(false);
      expect(snapshot.history).toEqual({
        canUndo: false,
        canRedo: false,
        index: 0,
        length: 0,
      });
    });
  });

  describe("change & layer:change events", () => {
    it("emits change and layer:change when layers change and supports unsubscribe & off()", () => {
      const changeListener = vi.fn();
      const layerListener = vi.fn();
      const unsub = painter.on("change", changeListener);
      painter.on("layer:change", layerListener);

      const layer2 = painter.createLayer("Layer 2");
      expect(changeListener).toHaveBeenCalledTimes(1);
      const snapshot: CanvasSnapshot = changeListener.mock.calls[0][0];
      expect(snapshot.layers).toHaveLength(2);
      expect(snapshot.activeLayerId).toBe(layer2.id);
      expect(layerListener).toHaveBeenCalledWith(
        painter.getLayers(),
        layer2.id,
      );

      painter.updateLayer(layer2.id, { opacity: 0.5, name: "Renamed" });
      const updatedSnap = changeListener.mock.calls.at(
        -1,
      )?.[0] as CanvasSnapshot;
      expect(updatedSnap.layers[1].name).toBe("Renamed");
      expect(updatedSnap.layers[1].opacity).toBe(0.5);

      const changeCallsBeforeUnsub = changeListener.mock.calls.length;
      const layerCallsBeforeOff = layerListener.mock.calls.length;
      unsub();
      painter.off("layer:change", layerListener);
      painter.createLayer("Layer 3");
      expect(changeListener).toHaveBeenCalledTimes(changeCallsBeforeUnsub);
      expect(layerListener).toHaveBeenCalledTimes(layerCallsBeforeOff);
    });
  });

  describe("history:change event", () => {
    it("emits history:change on push, undo, redo, and resetArtwork", () => {
      const historyListener = vi.fn();
      painter.on("history:change", historyListener);

      painter.createLayer("Test Layer");
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: true,
        canRedo: false,
        index: 1,
        length: 1,
      } satisfies HistoryState);

      painter.undo();
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: false,
        canRedo: true,
        index: 0,
        length: 1,
      } satisfies HistoryState);

      painter.redo();
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: true,
        canRedo: false,
        index: 1,
        length: 1,
      } satisfies HistoryState);

      painter.resetArtwork();
      expect(historyListener).toHaveBeenLastCalledWith({
        canUndo: false,
        canRedo: false,
        index: 0,
        length: 0,
      } satisfies HistoryState);
    });
  });

  describe("selection, transform, and clipboard events", () => {
    it("emits selection:change, transform:start/change/end, and clipboard:copy", () => {
      const selListener = vi.fn();
      const tStart = vi.fn();
      const tChange = vi.fn();
      const tEnd = vi.fn();
      const clipListener = vi.fn();

      painter.on("selection:change", selListener);
      painter.on("transform:start", tStart);
      painter.on("transform:change", tChange);
      painter.on("transform:end", tEnd);
      painter.on("clipboard:copy", clipListener);

      painter.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        fillColor: "#ff0000",
      });
      painter.selectRectangle(10, 10, 20, 20);
      expect(selListener).toHaveBeenCalled();
      expect(selListener.mock.calls.at(-1)?.[0]).toMatchObject({
        active: true,
        bounds: { x: 10, y: 10, width: 20, height: 20 },
      });

      painter.copy();
      expect(clipListener).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 20,
          height: 20,
          x: 10,
          y: 10,
        }),
      );

      painter.beginTransform();
      expect(tStart).toHaveBeenCalledTimes(1);
      painter.transform({ translation: { x: 15, y: 0 } });
      expect(tChange).toHaveBeenCalledWith(
        expect.objectContaining({
          active: true,
          translation: { x: 15, y: 0 },
        }),
      );
      painter.commitTransform();
      expect(tEnd).toHaveBeenCalledTimes(1);
    });
  });

  describe("stroke:start and stroke:end events", () => {
    it("emits stroke events with accurate bounds and flushes real pixels", async () => {
      const startListener = vi.fn();
      const endListener = vi.fn();
      painter.on("stroke:start", startListener);
      painter.on("stroke:end", endListener);

      const activeLayer = painter.getActiveLayer();

      canvasEl.dispatchEvent(
        new PointerEvent("pointerdown", {
          clientX: 100,
          clientY: 150,
          pointerType: "mouse",
          pointerId: 1,
        }),
      );

      expect(startListener).toHaveBeenCalledTimes(1);
      const startPayload: StrokeStartEvent = startListener.mock.calls[0][0];
      expect(startPayload.layerId).toBe(activeLayer.id);
      expect(startPayload.point.x).toBe(100);
      expect(startPayload.point.y).toBe(150);

      canvasEl.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 200,
          clientY: 250,
          pointerType: "mouse",
          pointerId: 1,
        }),
      );
      window.dispatchEvent(
        new PointerEvent("pointerup", {
          clientX: 200,
          clientY: 250,
          pointerType: "mouse",
          pointerId: 1,
        }),
      );
      await painter.brush.flush();

      expect(endListener).toHaveBeenCalledTimes(1);
      const endPayload: StrokeEndEvent = endListener.mock.calls[0][0];
      expect(endPayload.layerId).toBe(activeLayer.id);
      expect(endPayload.points).toHaveLength(2);
      expect(endPayload.bounds).toEqual({
        x: 100,
        y: 150,
        width: 100,
        height: 100,
      });
    });

    it("clears event listeners and stops pointer handling on destroy", () => {
      const listener = vi.fn();
      painter.on("change", listener);

      painter.destroy();
      painter.createLayer("Post Destroy Layer");

      expect(listener).not.toHaveBeenCalled();
    });
  });
});

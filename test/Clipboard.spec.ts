import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Canvas } from "../src/Canvas";
import { ClipboardStore } from "../src/Clipboard";
import type { ClipboardData } from "../src/types/clipboard";
import {
  installCanvas2DMock,
  type Canvas2DMockEnvironment,
} from "./helpers/mockCanvas2D";

describe("Clipboard Pipeline (Cut, Copy, Paste across Layers and Documents)", () => {
  let canvasEnv: Canvas2DMockEnvironment;

  beforeEach(() => {
    ClipboardStore.clear();
    canvasEnv = installCanvas2DMock();
  });

  afterEach(() => {
    canvasEnv.restore();
    vi.restoreAllMocks();
  });

  describe("ClipboardStore Unit Tests", () => {
    it("manages clipboard lifecycle, frozen snapshots, and error-isolated subscribers", () => {
      expect(ClipboardStore.has()).toBe(false);
      expect(ClipboardStore.get()).toBeNull();
      expect(ClipboardStore.getSnapshot()).toEqual({ hasData: false });

      const subscriber = vi.fn();
      const badSubscriber = vi.fn(() => {
        throw new Error("subscriber failure");
      });
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const unsubBad = ClipboardStore.subscribe(badSubscriber);
      const unsub = ClipboardStore.subscribe(subscriber);

      const fakeData: ClipboardData = {
        width: 50,
        height: 50,
        x: 10,
        y: 10,
        imageData: {
          data: new Uint8ClampedArray(50 * 50 * 4),
          width: 50,
          height: 50,
        } as ImageData,
        timestamp: 123456,
      };

      ClipboardStore.set(fakeData);
      expect(ClipboardStore.has()).toBe(true);
      expect(Object.isFrozen(ClipboardStore.get())).toBe(true);
      expect(subscriber).toHaveBeenCalledTimes(1);
      expect(badSubscriber).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      const snap = ClipboardStore.getSnapshot();
      expect(Object.isFrozen(snap)).toBe(true);
      expect(snap).toEqual({
        hasData: true,
        width: 50,
        height: 50,
        timestamp: 123456,
      });

      // Clearing when non-empty notifies; clearing again when empty does not
      ClipboardStore.clear();
      expect(subscriber).toHaveBeenCalledTimes(2);
      ClipboardStore.clear();
      expect(subscriber).toHaveBeenCalledTimes(2);

      unsubBad();
      unsub();
      ClipboardStore.set(fakeData);
      expect(subscriber).toHaveBeenCalledTimes(2);
    });
  });

  describe("Canvas Copy & Cut Operations", () => {
    let canvasEl: HTMLCanvasElement;
    let canvas: Canvas;

    beforeEach(() => {
      canvasEl = document.createElement("canvas");
      canvasEl.width = 120;
      canvasEl.height = 120;
      document.body.appendChild(canvasEl);

      canvas = new Canvas({
        canvas: canvasEl,
        document: { width: 120, height: 120 },
      });
    });

    it("copies only masked pixels inside a shaped selection into clipboardData", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(10, 10, 60, 60);

      // Circular selection centered at (40, 40) radius 20 -> bounds [20..60, 20..60]
      canvas.selectEllipse(40, 40, 20, 20);

      const copySpy = vi.fn();
      canvas.on("clipboard:copy", copySpy);

      const clipboardData = canvas.copy()!;
      expect(clipboardData).not.toBeNull();
      expect(clipboardData.x).toBe(20);
      expect(clipboardData.y).toBe(20);
      expect(clipboardData.width).toBe(40);
      expect(clipboardData.height).toBe(40);
      expect(copySpy).toHaveBeenCalledWith(clipboardData);

      // Center of copied buffer (local 20,20) must be opaque red
      const centerIdx = (20 * 40 + 20) * 4;
      expect(
        Array.from(
          clipboardData.imageData.data.slice(centerIdx, centerIdx + 4),
        ),
      ).toEqual([255, 0, 0, 255]);

      // Top-left corner of bounding box (local 0,0) is OUTSIDE circle -> must be transparent
      expect(clipboardData.imageData.data[3]).toBe(0);
      expect(clipboardData.maskData?.data[3]).toBe(0);
      expect(clipboardData.maskData?.data[centerIdx + 3]).toBe(255);
    });

    it("copies tight non-empty AABB when no selection is present and returns null on blank layer", () => {
      expect(canvas.copy()).toBeNull();
      expect(canvas.hasClipboard()).toBe(false);

      const ctx = canvas.getActiveLayer().canvas.getContext("2d")!;
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(15, 30, 50, 40);

      const clipboardData = canvas.copy()!;
      expect(clipboardData.x).toBe(15);
      expect(clipboardData.y).toBe(30);
      expect(clipboardData.width).toBe(50);
      expect(clipboardData.height).toBe(40);
      const centerIdx = (20 * 50 + 25) * 4;
      expect(
        Array.from(
          clipboardData.imageData.data.slice(centerIdx, centerIdx + 4),
        ),
      ).toEqual([0, 255, 0, 255]);
    });

    it("cuts selected pixels, leaves outside pixels intact, and accurately undoes/redoes", () => {
      const activeLayer = canvas.getActiveLayer();
      const ctx = activeLayer.canvas.getContext("2d")!;
      ctx.fillStyle = "#ff0000";
      ctx.fillRect(10, 10, 80, 80);

      canvas.selectRectangle(20, 20, 40, 40);

      const cutSpy = vi.fn();
      canvas.on("clipboard:cut", cutSpy);

      const data = canvas.cut();
      expect(data).not.toBeNull();
      expect(cutSpy).toHaveBeenCalledWith(data);

      // Inside selection is erased; outside remains red
      expect(canvas.getColorAt(30, 30, "activeLayer").a).toBe(0);
      expect(canvas.getColorAt(12, 12, "activeLayer").hex).toBe("#ff0000");

      canvas.undo();
      expect(canvas.getColorAt(30, 30, "activeLayer").hex).toBe("#ff0000");

      canvas.redo();
      expect(canvas.getColorAt(30, 30, "activeLayer").a).toBe(0);
    });

    it("throws error when attempting to cut from a locked layer", () => {
      const activeLayer = canvas.getActiveLayer();
      canvas.updateLayer(activeLayer.id, { locked: true });

      expect(() => canvas.cut()).toThrow("Cannot cut from locked layer");
    });
  });

  describe("Canvas Paste & System Clipboard Operations", () => {
    let canvasEl: HTMLCanvasElement;
    let canvas: Canvas;

    beforeEach(() => {
      canvasEl = document.createElement("canvas");
      canvasEl.width = 120;
      canvasEl.height = 120;
      document.body.appendChild(canvasEl);

      canvas = new Canvas({
        canvas: canvasEl,
        document: { width: 120, height: 120 },
      });
    });

    it("pastes real RGBA pixels to custom coordinates, supports undo/redo, and clips at canvas edge", () => {
      const ctx = canvas.getActiveLayer().canvas.getContext("2d")!;
      ctx.fillStyle = "#00ff00";
      ctx.fillRect(0, 0, 30, 30);
      canvas.copy();

      const targetLayer = canvas.createLayer("Paste Target");
      canvas.setActiveLayer(targetLayer.id);

      const res = canvas.paste({ x: 80, y: 90 });
      expect(res).toEqual({
        layerId: targetLayer.id,
        x: 80,
        y: 90,
        width: 30,
        height: 30,
      });
      expect(canvas.getColorAt(90, 100, "activeLayer").hex).toBe("#00ff00");
      expect(canvas.getColorAt(10, 10, "activeLayer").a).toBe(0);

      // Undo paste removes pixels
      canvas.undo();
      expect(canvas.getColorAt(90, 100, "activeLayer").a).toBe(0);
      // Redo paste restores pixels
      canvas.redo();
      expect(canvas.getColorAt(90, 100, "activeLayer").hex).toBe("#00ff00");
    });

    it("respects alphaLock on target layer when pasting", () => {
      const sourceLayer = canvas.getActiveLayer();
      sourceLayer.ctx.fillStyle = "#ff0000";
      sourceLayer.ctx.fillRect(0, 0, 30, 30);
      canvas.copy();

      const lockedAlphaLayer = canvas.createLayer({
        name: "AlphaLocked",
        alphaLock: true,
      });
      lockedAlphaLayer.ctx.fillStyle = "#0000ff";
      lockedAlphaLayer.ctx.fillRect(50, 50, 10, 30); // half of the 30x30 paste region

      canvas.paste({ x: 50, y: 50 });

      // Existing opaque area receives pasted red
      expect(canvas.getColorAt(55, 60, "activeLayer").hex).toBe("#ff0000");
      // Transparent area stays transparent because alphaLock=true
      expect(canvas.getColorAt(70, 60, "activeLayer").a).toBe(0);
    });

    it("supports createLayer, asSelection, and asTransform paste options", () => {
      canvas.getActiveLayer().ctx.fillStyle = "#00ffff";
      canvas.getActiveLayer().ctx.fillRect(0, 0, 20, 20);
      canvas.copy();

      const res = canvas.paste({
        x: 40,
        y: 40,
        createLayer: true,
        newLayerName: "Sticker",
        asSelection: true,
        asTransform: true,
      });

      expect(res?.layerId).toBe(canvas.getActiveLayer().id);
      expect(canvas.getActiveLayer().name).toBe("Sticker");
      expect(canvas.hasSelection()).toBe(true);
      expect(canvas.getSelectionBounds()).toEqual({
        x: 40,
        y: 40,
        width: 20,
        height: 20,
      });
      expect(canvas.isTransforming()).toBe(true);
    });

    it("throws when pasting onto a locked layer unless createLayer is true", () => {
      canvas.getActiveLayer().ctx.fillStyle = "#ff0000";
      canvas.getActiveLayer().ctx.fillRect(0, 0, 20, 20);
      canvas.copy();

      canvas.updateLayer(canvas.getActiveLayer().id, { locked: true });
      expect(() => canvas.paste()).toThrow("Cannot paste onto locked layer");
      expect(() => canvas.paste({ createLayer: true })).not.toThrow();
    });

    it("pastes exact RGBA pixels across separate Canvas instances", () => {
      canvas.getActiveLayer().ctx.fillStyle = "#ff00ff";
      canvas.getActiveLayer().ctx.fillRect(5, 5, 25, 25);
      canvas.copy();

      const canvas2El = document.createElement("canvas");
      canvas2El.width = 200;
      canvas2El.height = 200;
      const canvas2 = new Canvas({
        canvas: canvas2El,
        document: { width: 200, height: 200 },
      });

      const target = canvas2.createLayer("Imported");
      canvas2.setActiveLayer(target.id);
      canvas2.paste({ x: 100, y: 120 });

      expect(canvas2.getColorAt(110, 130, "activeLayer").hex).toBe("#ff00ff");
      expect(canvas2.getColorAt(10, 10, "activeLayer").a).toBe(0);
    });

    it("falls back cleanly from system clipboard when navigator.clipboard is unavailable or throws", async () => {
      canvas.getActiveLayer().ctx.fillStyle = "#00ff00";
      canvas.getActiveLayer().ctx.fillRect(0, 0, 20, 20);
      canvas.copy();

      // Clear internal clipboard -> copyToSystemClipboard with no navigator.clipboard returns true/false properly
      const originalClipboard = navigator.clipboard;
      Object.defineProperty(navigator, "clipboard", {
        value: {
          read: vi.fn().mockRejectedValue(new Error("permission denied")),
          write: vi.fn().mockRejectedValue(new Error("permission denied")),
        },
        configurable: true,
      });

      const writeOk = await canvas.copyToSystemClipboard();
      expect(writeOk).toBe(false);

      // Should fall back to internal clipboard and still paste green pixels
      const res = await canvas.pasteFromSystemClipboard({ x: 60, y: 60 });
      expect(res).not.toBeNull();
      expect(canvas.getColorAt(70, 70, "activeLayer").hex).toBe("#00ff00");

      Object.defineProperty(navigator, "clipboard", {
        value: originalClipboard,
        configurable: true,
      });
    });

    it("replays recorded copy and paste actions and reproduces pixels on target canvas", async () => {
      const srcLayer = canvas.createLayer({ id: "src-layer", name: "Source" });
      canvas.setActiveLayer(srcLayer.id);
      canvas.drawRectangle({
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        fillColor: "#123456",
        stroke: false,
      });
      canvas.copy({ layerId: srcLayer.id });
      canvas.paste({ x: 60, y: 60, createLayer: true, newLayerName: "Decal" });

      const log = canvas.getActionLog();

      ClipboardStore.clear();
      const replayEl = document.createElement("canvas");
      replayEl.width = 120;
      replayEl.height = 120;
      const replayCanvas = new Canvas({
        canvas: replayEl,
        document: { width: 120, height: 120 },
      });

      await replayCanvas.replay(log);

      expect(replayCanvas.getActionLog()).toHaveLength(0);
      expect(replayCanvas.getLayers()).toHaveLength(4);
      expect(replayCanvas.getActiveLayer().name).toBe("Decal");
      expect(replayCanvas.getColorAt(70, 70, "activeLayer").hex).toBe(
        "#123456",
      );
    });
  });
});

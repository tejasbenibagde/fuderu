// src/Canvas.ts

import { Brush } from "./Brush";
import type { BrushConfig } from "./types/config";
import { MousePressure } from "./utils";
import {
  LayerManager,
  type CreateLayerOptions,
  type UpdateLayerOptions,
} from "./LayerManager";
import { Layer } from "./Layer";
import {
  migrateDocument,
  type FuderuDocument,
  type SerializedLayer,
  type ExportDocumentOptions,
  type ExportPNGOptions,
} from "./types/document";
import type {
  CanvasEventMap,
  CanvasSnapshot,
  StrokeBounds,
  StrokePoint,
} from "./types/events";
import type { LayerId } from "./types/layers";
import type {
  CanvasAction,
  StrokeAction,
  ReplayOptions,
} from "./types/actions";
import type {
  DrawRectangleOptions,
  DrawEllipseOptions,
  DrawLineOptions,
  TextStyleOptions,
  ColorSample,
} from "./types/commands";
import {
  HistoryManager,
  CanvasStateHistoryEntry,
  LayerCreatedHistoryEntry,
  LayerDeletedHistoryEntry,
  LayerPropertyHistoryEntry,
  MoveLayerHistoryEntry,
  type HistoryContext,
} from "./HistoryManager";
import { Selection } from "./Selection";
import type {
  SelectionMode,
  SelectionPoint,
  SelectionBounds,
  SelectionOutlineOptions,
} from "./types/selection";

let sharedColorCanvas: HTMLCanvasElement | null = null;
let sharedColorCtx: CanvasRenderingContext2D | null = null;

function parseCssColor(colorStr: string): [number, number, number, number] {
  if (typeof document === "undefined") {
    return [0, 0, 0, 255];
  }
  if (!sharedColorCanvas) {
    sharedColorCanvas = document.createElement("canvas");
    sharedColorCanvas.width = 1;
    sharedColorCanvas.height = 1;
    sharedColorCtx = sharedColorCanvas.getContext("2d");
  }
  if (!sharedColorCtx) return [0, 0, 0, 255];
  sharedColorCtx.clearRect(0, 0, 1, 1);
  sharedColorCtx.fillStyle = colorStr;
  sharedColorCtx.fillRect(0, 0, 1, 1);
  const data = sharedColorCtx.getImageData(0, 0, 1, 1).data;
  return [data[0], data[1], data[2], data[3]];
}

export interface CanvasOptions {
  canvas: HTMLCanvasElement | string;
  /**
   * The logical drawing resolution.
   * This is the size of the internal pixel buffer, independent of how
   * the canvas element is sized on screen via CSS.
   * Defaults to the displayed canvas size multiplied by devicePixelRatio.
   */
  document?: {
    width: number;
    height: number;
  };
  brush?: BrushConfig;
  pressureSimulation?: boolean;
}

export class Canvas implements HistoryContext {
  private canvas: HTMLCanvasElement;
  public brush: Brush;
  private layers!: LayerManager;
  public history: HistoryManager;
  public selection!: Selection;
  private scratchCanvas: HTMLCanvasElement | null = null;

  private isDrawing = false;
  private activePointerId: number | null = null;
  private currentStrokeBeforeCanvas: HTMLCanvasElement | null = null;
  private currentStrokeLayerId: LayerId | null = null;
  private strokeMinX = Infinity;
  private strokeMinY = Infinity;
  private strokeMaxX = -Infinity;
  private strokeMaxY = -Infinity;

  private cacheBelowCanvas: HTMLCanvasElement | null = null;
  private cacheBelowValid = false;

  private listeners: Map<keyof CanvasEventMap, Set<unknown>> = new Map();
  private currentStrokePoints: StrokePoint[] = [];

  /** The logical drawing resolution width (internal pixel buffer) */
  public documentWidth: number;
  /** The logical drawing resolution height (internal pixel buffer) */
  public documentHeight: number;
  /** whether the caller provided an explicit document size */
  private documentProvided: boolean;

  /**
   * The underlying pressure simulator.
   * Replace at runtime to change K / minRange / maxRange.
   */
  public mousePressure: MousePressure;

  /**
   * When true, mouse/touch events with no real stylus pressure
   * will use simulated pressure based on movement speed.
   */
  public pressureSimulation: boolean;

  /**
   * The last pressure value sent to the brush.
   * Read this in the playground's pressure meter instead of calling
   * getPressure() again, avoiding double-advancing the simulator state.
   */
  public lastPressure: number = 0.5;

  private actionLog: CanvasAction[] = [];
  private isReplaying = false;

  constructor(options: CanvasOptions) {
    if (typeof options.canvas === "string") {
      const el = document.querySelector(options.canvas);
      if (!el || !(el instanceof HTMLCanvasElement)) {
        throw new Error(`Canvas element "${options.canvas}" not found`);
      }
      this.canvas = el;
    } else {
      this.canvas = options.canvas;
    }

    // If the caller provided an explicit document size, honour it.
    // Otherwise the logical buffer will be initialised to the element's
    // display size multiplied by devicePixelRatio in setupCanvas().
    this.documentProvided = !!options.document;
    this.documentWidth = options.document?.width ?? 0;
    this.documentHeight = options.document?.height ?? 0;

    this.pressureSimulation = options.pressureSimulation ?? false;
    this.mousePressure = new MousePressure();

    this.setupCanvas();
    this.brush = new Brush(this.layers.getActive().canvas, options.brush);
    this.history = new HistoryManager(30, this);
    this.history.onHistoryChange = () => {
      this.cacheBelowValid = false;
      this.renderLayers();
      this.emitHistoryChange();
      this.emitStateChange();
    };
    this.brush.onRender = () => this.renderLayers();
    this.bindEvents();
    this.renderLayers();
  }

  // Private setup

  public renderLayers(): void {
    const ctx = this.canvas.getContext("2d");
    if (!ctx) return;

    if (this.isDrawing) {
      if (!this.cacheBelowCanvas) {
        this.cacheBelowCanvas = document.createElement("canvas");
      }
      if (
        this.cacheBelowCanvas.width !== this.canvas.width ||
        this.cacheBelowCanvas.height !== this.canvas.height
      ) {
        this.cacheBelowCanvas.width = this.canvas.width;
        this.cacheBelowCanvas.height = this.canvas.height;
        this.cacheBelowValid = false;
      }

      const allLayers = this.layers.getAll();
      const activeLayer = this.layers.getActive();
      const activeIndex = allLayers.indexOf(activeLayer);

      if (!this.cacheBelowValid) {
        const bCtx = this.cacheBelowCanvas.getContext("2d");
        if (bCtx) {
          bCtx.clearRect(
            0,
            0,
            this.cacheBelowCanvas.width,
            this.cacheBelowCanvas.height,
          );
          for (let i = 0; i < activeIndex; i++) {
            const layer = allLayers[i];
            if (!layer.visible) continue;
            bCtx.globalAlpha = layer.opacity;
            bCtx.globalCompositeOperation = layer.blendMode;
            bCtx.drawImage(layer.canvas, 0, 0);
          }
          bCtx.globalAlpha = 1;
          bCtx.globalCompositeOperation = "source-over";
        }
        this.cacheBelowValid = true;
      }

      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // 1. Draw cached below layers
      ctx.drawImage(this.cacheBelowCanvas, 0, 0);

      // 2. Draw active layer
      if (activeLayer.visible) {
        ctx.globalAlpha = activeLayer.opacity;
        ctx.globalCompositeOperation = activeLayer.blendMode;
        ctx.drawImage(activeLayer.canvas, 0, 0);
      }

      // 3. Draw above layers
      for (let i = activeIndex + 1; i < allLayers.length; i++) {
        const layer = allLayers[i];
        if (!layer.visible) continue;
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layer.canvas, 0, 0);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (const layer of this.layers.getAll()) {
        if (!layer.visible) continue;

        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode;
        ctx.drawImage(layer.canvas, 0, 0);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    }
  }

  private setupCanvas(): void {
    // Determine display size
    const rect = this.canvas.getBoundingClientRect();
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // If no explicit document size was provided, use the element size times DPR.
    if (
      !this.documentProvided ||
      this.documentWidth <= 0 ||
      this.documentHeight <= 0
    ) {
      this.documentWidth = Math.max(1, Math.round(rect.width * dpr));
      this.documentHeight = Math.max(1, Math.round(rect.height * dpr));
    }

    this.layers = new LayerManager(this.documentWidth, this.documentHeight);
    this.selection = new Selection(this.documentWidth, this.documentHeight);
    this.selection.onSelectionChange = (snap) => {
      this.brush?.setSelectionMask?.(
        this.selection.isActive() ? this.selection.getMaskCanvas() : null,
      );
      this.emit("selection:change", snap);
      this.emitStateChange();
    };

    this.canvas.width = this.documentWidth;
    this.canvas.height = this.documentHeight;

    this.canvas.style.touchAction = "none";
    this.canvas.style.userSelect = "none";

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get 2D canvas context");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  /**
   * Resize the internal drawing buffer to match the element's display size.
   * Also reinitialises the brush context so the brush's offscreen canvases
   * match the new pixel buffer.
   */
  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    this.documentWidth = Math.max(1, Math.round(rect.width * dpr));
    this.documentHeight = Math.max(1, Math.round(rect.height * dpr));

    this.layers.resize(this.documentWidth, this.documentHeight);
    this.selection.resize(this.documentWidth, this.documentHeight);

    this.canvas.width = this.documentWidth;
    this.canvas.height = this.documentHeight;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Reload brush context to reinitialise internal canvases
    this.brush.loadContext(this.layers.getActive().canvas);
    this.brush?.setSelectionMask?.(
      this.selection.isActive() ? this.selection.getMaskCanvas() : null,
    );
    this.renderLayers();
    this.emitStateChange();
  }

  /**
   * Subscribe to canvas events (change, stroke:start, stroke:end, history:change, layer:change).
   * Returns an unsubscribe callback for easy cleanup.
   */
  public on<K extends keyof CanvasEventMap>(
    event: K,
    listener: CanvasEventMap[K],
  ): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener);

    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe a listener from canvas events.
   */
  public off<K extends keyof CanvasEventMap>(
    event: K,
    listener: CanvasEventMap[K],
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
    }
  }

  private emit<K extends keyof CanvasEventMap>(
    event: K,
    ...args: Parameters<CanvasEventMap[K]>
  ): void {
    const set = this.listeners.get(event);
    if (set) {
      for (const listener of Array.from(set)) {
        try {
          (listener as (...args: unknown[]) => void)(...args);
        } catch (err) {
          console.error(`[Canvas] Error in "${event}" event listener:`, err);
        }
      }
    }
  }

  /**
   * Returns a synchronous snapshot of the current canvas state suitable for
   * reactive bindings like useSyncExternalStore.
   */
  public getSnapshot(): CanvasSnapshot {
    return Object.freeze({
      documentWidth: this.documentWidth,
      documentHeight: this.documentHeight,
      layers: Object.freeze(this.layers.getAll().map((l) => l.toSnapshot())),
      activeLayerId: this.layers.getActiveId() ?? "",
      history: this.history.getHistoryState(),
      selection: this.selection ? this.selection.getSnapshot() : null,
    });
  }

  private emitHistoryChange(): void {
    this.emit("history:change", this.history.getHistoryState());
  }

  private emitStateChange(): void {
    this.emit("change", this.getSnapshot());
    this.emit(
      "layer:change",
      this.layers.getAll(),
      this.layers.getActiveId() ?? "",
    );
  }

  private bindEvents(): void {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    this.canvas.addEventListener("pointercancel", this.handlePointerCancel);
    this.canvas.addEventListener(
      "lostpointercapture",
      this.handlePointerCancel,
    );
    window.addEventListener("pointerup", this.handlePointerUp);
  }

  private getPoint(
    e: PointerEvent,
    rect: DOMRect = this.canvas.getBoundingClientRect(),
  ) {
    const scaleX = rect.width > 0 ? this.canvas.width / rect.width : 1;
    const scaleY = rect.height > 0 ? this.canvas.height / rect.height : 1;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Real stylus pressure is only trusted for pen type with non-zero value.
    const hasRealPressure = e.pointerType === "pen" && e.pressure > 0;

    const pressure = hasRealPressure
      ? e.pressure
      : this.pressureSimulation
        ? this.mousePressure.getPressure(x, y)
        : 1;

    // Cache so the playground meter can read it without calling getPressure() again
    this.lastPressure = pressure;

    return { x, y, pressure };
  }

  private updateStrokeBounds(x: number, y: number): void {
    if (x < this.strokeMinX) this.strokeMinX = x;
    if (x > this.strokeMaxX) this.strokeMaxX = x;
    if (y < this.strokeMinY) this.strokeMinY = y;
    if (y > this.strokeMaxY) this.strokeMaxY = y;
  }

  /**
   * Returns the part of a drawing operation that intersects the document.
   * Keeping history patches inside the canvas prevents getImageData from
   * throwing for commands positioned completely outside the document.
   */
  private getPatchBounds(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
  ): { x: number; y: number; width: number; height: number } | null {
    const x = Math.max(0, Math.floor(minX));
    const y = Math.max(0, Math.floor(minY));
    const right = Math.min(this.documentWidth, Math.ceil(maxX));
    const bottom = Math.min(this.documentHeight, Math.ceil(maxY));

    if (x >= right || y >= bottom) return null;

    return { x, y, width: right - x, height: bottom - y };
  }

  private clampPatchBoundsToSelection(
    patch: { x: number; y: number; width: number; height: number } | null,
  ): { x: number; y: number; width: number; height: number } | null {
    if (!patch) return null;
    if (!this.hasSelection()) return patch;
    const sb = this.selection.getBounds();
    if (!sb) return patch;

    const x1 = Math.max(patch.x, sb.x);
    const y1 = Math.max(patch.y, sb.y);
    const x2 = Math.min(patch.x + patch.width, sb.x + sb.width);
    const y2 = Math.min(patch.y + patch.height, sb.y + sb.height);

    if (x2 <= x1 || y2 <= y1) {
      return null;
    }
    return {
      x: x1,
      y: y1,
      width: x2 - x1,
      height: y2 - y1,
    };
  }

  private getScratchCanvas(): HTMLCanvasElement {
    if (!this.scratchCanvas) {
      this.scratchCanvas = document.createElement("canvas");
    }
    if (
      this.scratchCanvas.width !== this.documentWidth ||
      this.scratchCanvas.height !== this.documentHeight
    ) {
      this.scratchCanvas.width = this.documentWidth;
      this.scratchCanvas.height = this.documentHeight;
    }
    return this.scratchCanvas;
  }

  private drawWithSelectionClip(
    ctx: CanvasRenderingContext2D,
    alphaLock: boolean | undefined,
    drawCallback: (targetCtx: CanvasRenderingContext2D) => void,
  ): void {
    if (this.hasSelection()) {
      const scratch = this.getScratchCanvas();
      const sCtx = scratch.getContext("2d");
      if (sCtx) {
        sCtx.clearRect(0, 0, this.documentWidth, this.documentHeight);
        drawCallback(sCtx);
        sCtx.save();
        sCtx.globalCompositeOperation = "destination-in";
        sCtx.drawImage(this.selection.getMaskCanvas(), 0, 0);
        sCtx.restore();

        ctx.save();
        if (alphaLock) {
          ctx.globalCompositeOperation = "source-atop";
        }
        ctx.drawImage(scratch, 0, 0);
        ctx.restore();
      }
    } else {
      ctx.save();
      if (alphaLock) {
        ctx.globalCompositeOperation = "source-atop";
      }
      drawCallback(ctx);
      ctx.restore();
    }
  }

  private handlePointerDown = (e: PointerEvent) => {
    if (this.isDrawing) return;

    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      return;
    }
    this.brush.isAlphaLocked = activeLayer.alphaLock;
    this.brush.syncOriCanvas();

    this.isDrawing = true;
    this.activePointerId = e.pointerId;
    this.cacheBelowValid = false;
    this.mousePressure.reset();

    this.strokeMinX = Infinity;
    this.strokeMinY = Infinity;
    this.strokeMaxX = -Infinity;
    this.strokeMaxY = -Infinity;

    if (typeof this.canvas.setPointerCapture === "function") {
      try {
        this.canvas.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture is a progressive enhancement. If the pointer ID is invalid/inactive,
        // or the environment (like JSDOM in tests) doesn't support it, we handle the exception gracefully.
      }
    }

    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      this.currentStrokeBeforeCanvas = document.createElement("canvas");
      this.currentStrokeBeforeCanvas.width = activeLayer.canvas.width;
      this.currentStrokeBeforeCanvas.height = activeLayer.canvas.height;
      const bCtx = this.currentStrokeBeforeCanvas.getContext("2d");
      if (bCtx) {
        bCtx.drawImage(activeLayer.canvas, 0, 0);
      }
      this.currentStrokeLayerId = activeLayer.id;
    }

    const rect = this.canvas.getBoundingClientRect();
    const p = this.getPoint(e, rect);
    this.updateStrokeBounds(p.x, p.y);
    const point: StrokePoint = { x: p.x, y: p.y, pressure: p.pressure };
    this.currentStrokePoints = [point];
    if (activeLayer) {
      this.emit("stroke:start", {
        layerId: activeLayer.id,
        point,
      });
    }
    this.brush.putPoint(p.x, p.y, p.pressure);
    this.brush.render();
    this.renderLayers();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (
      !this.isDrawing ||
      (this.activePointerId !== null && e.pointerId !== this.activePointerId)
    )
      return;

    const coalesced = e.getCoalescedEvents?.();

    const events = coalesced && coalesced.length > 0 ? coalesced : [e];

    const rect = this.canvas.getBoundingClientRect();
    for (const ce of events) {
      const p = this.getPoint(ce, rect);
      this.updateStrokeBounds(p.x, p.y);
      this.currentStrokePoints.push({ x: p.x, y: p.y, pressure: p.pressure });
      this.brush.putPoint(p.x, p.y, p.pressure);
    }

    this.brush.render();
    this.renderLayers();
  };

  private commitStroke() {
    const beforeCanvas = this.currentStrokeBeforeCanvas;
    const layerId = this.currentStrokeLayerId;
    this.currentStrokeBeforeCanvas = null;
    this.currentStrokeLayerId = null;

    const minX = this.strokeMinX;
    const minY = this.strokeMinY;
    const maxX = this.strokeMaxX;
    const maxY = this.strokeMaxY;

    const points = [...this.currentStrokePoints];
    this.currentStrokePoints = [];

    const validMinX = minX === Infinity ? 0 : minX;
    const validMinY = minY === Infinity ? 0 : minY;
    const validMaxX = maxX === -Infinity ? this.documentWidth : maxX;
    const validMaxY = maxY === -Infinity ? this.documentHeight : maxY;

    const strokeBounds: StrokeBounds = {
      x: validMinX,
      y: validMinY,
      width: Math.max(0, validMaxX - validMinX),
      height: Math.max(0, validMaxY - validMinY),
    };

    this.brush.finalizeStroke(() => {
      if (beforeCanvas && layerId) {
        const layer = this.layers.getById(layerId);
        if (layer) {
          const afterCtx = layer.canvas.getContext("2d");
          const beforeCtx = beforeCanvas.getContext("2d");
          if (afterCtx && beforeCtx) {
            const brushSize = this.brush.config?.size ?? 10;
            const padding = Math.max(50, Math.ceil(brushSize * 3));

            const x1 = Math.max(0, Math.floor(validMinX - padding));
            const y1 = Math.max(0, Math.floor(validMinY - padding));
            const x2 = Math.min(
              this.documentWidth - 1,
              Math.ceil(validMaxX + padding),
            );
            const y2 = Math.min(
              this.documentHeight - 1,
              Math.ceil(validMaxY + padding),
            );

            const w = Math.max(1, x2 - x1 + 1);
            const h = Math.max(1, y2 - y1 + 1);

            const beforeSubData = beforeCtx.getImageData(x1, y1, w, h);
            const afterSubData = afterCtx.getImageData(x1, y1, w, h);

            this.history.push(
              new CanvasStateHistoryEntry(
                layerId,
                beforeSubData,
                afterSubData,
                this,
                x1,
                y1,
              ),
            );
          }
        }
      }
      this.renderLayers();

      if (layerId) {
        if (points.length > 0) {
          const strokeAction: StrokeAction = {
            type: "stroke",
            layerId,
            brushConfig: { ...this.brush.config },
            points,
          };
          this.recordAction(strokeAction);
        }
        this.emit("stroke:end", {
          layerId,
          bounds: strokeBounds,
          points,
        });
      }
      this.emitHistoryChange();
      this.emitStateChange();
    });
  }

  private handlePointerUp = (e?: PointerEvent) => {
    if (
      !this.isDrawing ||
      (e?.pointerId != null &&
        this.activePointerId !== null &&
        e.pointerId !== this.activePointerId)
    )
      return;

    this.isDrawing = false;
    this.activePointerId = null;
    this.cacheBelowValid = false;
    this.mousePressure.reset();

    if (e?.pointerId != null) {
      if (
        typeof this.canvas.hasPointerCapture === "function" &&
        typeof this.canvas.releasePointerCapture === "function"
      ) {
        try {
          if (this.canvas.hasPointerCapture(e.pointerId)) {
            this.canvas.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Gracefully ignore DOMExceptions if the pointer was already released or inactive.
        }
      }
    }

    this.commitStroke();
  };

  private handlePointerCancel = (e?: PointerEvent) => {
    if (
      !this.isDrawing ||
      (e?.pointerId != null &&
        this.activePointerId !== null &&
        e.pointerId !== this.activePointerId)
    )
      return;

    this.isDrawing = false;
    this.activePointerId = null;
    this.cacheBelowValid = false;
    this.mousePressure.reset();

    if (e?.pointerId != null) {
      if (
        typeof this.canvas.hasPointerCapture === "function" &&
        typeof this.canvas.releasePointerCapture === "function"
      ) {
        try {
          if (this.canvas.hasPointerCapture(e.pointerId)) {
            this.canvas.releasePointerCapture(e.pointerId);
          }
        } catch {
          // Gracefully ignore DOMExceptions if the pointer was already released or inactive.
        }
      }
    }

    this.commitStroke();
  };

  // Public API

  public setActiveLayer(layerId: string): void {
    this.layers.setActive(layerId);
    this.cacheBelowValid = false;

    const active = this.layers.getActive();
    this.brush.loadContext(active.canvas);
    this.brush.isAlphaLocked = active.alphaLock;
    this.renderLayers();
    this.emitStateChange();
  }

  public getLayers(): readonly Layer[] {
    return this.layers.getAll();
  }

  public getActiveLayer(): Layer {
    return this.layers.getActive();
  }

  public getLayerById(id: string): Layer | undefined {
    return this.layers.getAll().find((l) => l.id === id);
  }

  public reorderLayers(ids: string[]): void {
    this.layers.reorderLayers(ids);
    this.cacheBelowValid = false;
    this.renderLayers();
    this.emitStateChange();
  }

  public createLayer(options?: CreateLayerOptions | string): Layer {
    const layer = this.layers.createLayer(options);
    const index = this.layers.getAll().indexOf(layer);
    this.cacheBelowValid = false;

    this.brush.loadContext(layer.canvas);
    this.brush.isAlphaLocked = layer.alphaLock;
    this.history.push(new LayerCreatedHistoryEntry(layer, this, index));

    this.recordAction({
      type: "createLayer",
      layerId: layer.id,
      name: layer.name,
      options: {
        visible: layer.visible,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        alphaLock: layer.alphaLock,
        locked: layer.locked,
      },
    });

    return layer;
  }

  public deleteLayer(layerId: string): void {
    const layer = this.layers.getById(layerId);
    const index = this.layers.getAll().indexOf(layer);
    const wasActive = this.layers.getActiveId() === layerId;

    this.layers.deleteLayer(layerId);
    if (wasActive) {
      const active = this.layers.getActive();
      this.brush.loadContext(active.canvas);
      this.brush.isAlphaLocked = active.alphaLock;
    }
    this.cacheBelowValid = false;

    this.history.push(
      new LayerDeletedHistoryEntry(layer, index, wasActive, this),
    );

    this.recordAction({
      type: "deleteLayer",
      layerId,
    });
  }

  public duplicateLayer(layerId: string): Layer {
    const layer = this.layers.duplicateLayer(layerId);
    const index = this.layers.getAll().indexOf(layer);
    this.brush.loadContext(layer.canvas);
    this.brush.isAlphaLocked = layer.alphaLock;
    this.cacheBelowValid = false;

    this.history.push(new LayerCreatedHistoryEntry(layer, this, index));

    this.recordAction({
      type: "duplicateLayer",
      layerId,
      newLayerId: layer.id,
    });

    return layer;
  }

  public moveLayer(layerId: string, targetIndex: number): void {
    const beforeIndex = this.layers.getAll().findIndex((l) => l.id === layerId);
    this.layers.moveLayer(layerId, targetIndex);
    const afterIndex = this.layers.getAll().findIndex((l) => l.id === layerId);
    this.cacheBelowValid = false;

    if (beforeIndex !== afterIndex) {
      this.history.push(
        new MoveLayerHistoryEntry(layerId, beforeIndex, afterIndex, this),
      );
      this.recordAction({
        type: "moveLayer",
        layerId,
        targetIndex,
      });
    } else {
      this.renderLayers();
      this.emitStateChange();
    }
  }

  public updateLayer(layerId: string, options: UpdateLayerOptions): Layer {
    const layer = this.layers.getById(layerId);

    const originalValues: Record<string, string | number | boolean> = {};
    const keys: (
      "name" | "visible" | "opacity" | "blendMode" | "alphaLock" | "locked"
    )[] = ["name", "visible", "opacity", "blendMode", "alphaLock", "locked"];
    for (const key of keys) {
      if (options[key] !== undefined) {
        originalValues[key] = layer[key];
      }
    }

    const updated = this.layers.updateLayer(layerId, options);
    if (layerId === this.layers.getActiveId()) {
      this.brush.isAlphaLocked = updated.alphaLock;
    }
    this.cacheBelowValid = false;

    let pushed = false;
    for (const key of keys) {
      if (options[key] !== undefined && originalValues[key] !== options[key]) {
        pushed = true;
        this.history.push(
          new LayerPropertyHistoryEntry(
            layerId,
            key,
            originalValues[key],
            options[key],
            this,
          ),
        );
      }
    }

    if (pushed) {
      this.recordAction({
        type: "setLayerProperties",
        layerId,
        properties: { ...options },
      });
    } else {
      this.renderLayers();
      this.emitStateChange();
    }
    return updated;
  }

  clear(): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      let patch = this.getPatchBounds(
        0,
        0,
        activeLayer.canvas.width,
        activeLayer.canvas.height,
      );
      if (this.hasSelection()) {
        patch = this.clampPatchBoundsToSelection(patch);
      }
      if (!patch) return;

      const beforeData = ctx.getImageData(
        patch.x,
        patch.y,
        patch.width,
        patch.height,
      );

      if (this.hasSelection()) {
        ctx.save();
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(this.selection.getMaskCanvas(), 0, 0);
        ctx.restore();
        this.brush.syncOriCanvas();
        this.cacheBelowValid = false;
        this.renderLayers();
        this.emitStateChange();
      } else {
        this.brush.clear();
      }

      const afterData = ctx.getImageData(
        patch.x,
        patch.y,
        patch.width,
        patch.height,
      );
      this.history.pushPatch({
        layerId: activeLayer.id,
        beforeData,
        afterData,
        x: patch.x,
        y: patch.y,
        description: "Clear layer",
      });
    } else {
      this.brush.clear();
      this.cacheBelowValid = false;
      this.renderLayers();
      this.emitStateChange();
    }

    this.recordAction({
      type: "clearLayer",
      layerId: activeLayer.id,
    });
  }

  undo(): void {
    this.history.undo();
  }

  redo(): void {
    this.history.redo();
  }

  // HistoryContext implementation
  public getLayer(layerId: string): Layer | undefined {
    try {
      return this.layers.getById(layerId);
    } catch {
      return undefined;
    }
  }

  public getBrush(): Brush {
    return this.brush;
  }

  public deleteLayerOnly(layerId: string): void {
    const activeLayerId = this.layers.getActiveId();
    this.layers.removeLayerOnly(layerId);
    if (activeLayerId === layerId) {
      const active = this.layers.getActive();
      this.brush.loadContext(active.canvas);
      this.brush.isAlphaLocked = active.alphaLock;
    }
    this.cacheBelowValid = false;
  }

  public insertLayerOnly(layer: Layer, index: number): void {
    this.layers.addLayerAt(layer, index);
    this.cacheBelowValid = false;
  }

  public moveLayerOnly(layerId: string, index: number): void {
    this.layers.moveLayer(layerId, index);
    this.cacheBelowValid = false;
  }

  setSmooth(enabled: boolean): void {
    this.brush.isSmooth = enabled;
  }
  setSpacing(enabled: boolean): void {
    this.brush.isSpacing = enabled;
  }
  setEraser(enabled: boolean): void {
    this.brush.isEraser = enabled;
  }

  loadConfig(config: BrushConfig): void {
    this.brush.loadConfig(config);
  }

  loadImage(img: HTMLImageElement | HTMLCanvasElement | string): Promise<void> {
    return this.brush.loadImageAsync(img);
  }

  /**
   * Change the logical document size.
   *
   * By default, this preserves existing layer artwork (lossless crop/pad) but resets the undo stack
   * because previous undo/redo states will no longer match the new canvas dimensions.
   * If `clearArtwork` is set to true, it will additionally clear all artwork on the layers.
   *
   * It does NOT change any CSS on the canvas element;
   * sizing the element on screen is the caller's responsibility.
   *
   * @example
   * painter.setDocumentSize(768, 1024); // crops/pads existing layers, clears undo stack
   * painter.setDocumentSize(768, 1024, true); // clears all artwork completely, clears undo stack
   */
  setDocumentSize(width: number, height: number, clearArtwork = false): void {
    if (width <= 0 || height <= 0) {
      console.warn("[Canvas] setDocumentSize: width and height must be > 0");
      return;
    }

    if (clearArtwork) {
      this.layers.clear();
    }
    this.layers.resize(width, height);
    this.selection.resize(width, height);
    this.documentWidth = width;
    this.documentHeight = height;

    // Resize the pixel buffer
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.brush.loadContext(this.layers.getActive().canvas);
    this.brush?.setSelectionMask?.(
      this.selection.isActive() ? this.selection.getMaskCanvas() : null,
    );
    this.history.clear();
    this.cacheBelowValid = false;
    this.renderLayers();
    this.emitHistoryChange();
    this.emitStateChange();
  }

  /**
   * Export the complete canvas document state including width, height,
   * layer metadata, and serialized layer bitmaps.
   */
  public async exportDocument(
    options?: ExportDocumentOptions,
  ): Promise<FuderuDocument> {
    const format = options?.bitmap ?? "png";
    const mimeType = `image/${format}`;
    const quality = options?.quality;

    const serializedLayers: SerializedLayer[] = this.layers
      .getAll()
      .map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        alphaLock: layer.alphaLock,
        locked: layer.locked,
        dataUrl: layer.canvas.toDataURL(mimeType, quality),
      }));

    return {
      version: 1,
      width: this.documentWidth,
      height: this.documentHeight,
      layers: serializedLayers,
      activeLayerId: this.layers.getActiveId() ?? undefined,
    };
  }

  /**
   * Import and atomically load a complete canvas document.
   * Recreates all layers, loads bitmap graphics asynchronously, and sets active layer.
   */
  public async importDocument(
    rawDocument: FuderuDocument | unknown,
  ): Promise<void> {
    const document = migrateDocument(rawDocument);

    const loadedLayers: Layer[] = [];

    for (const sLayer of document.layers) {
      const layer = new Layer({
        id: sLayer.id,
        name: sLayer.name,
        width: document.width,
        height: document.height,
        visible: sLayer.visible,
        opacity: sLayer.opacity,
        blendMode: sLayer.blendMode,
        alphaLock: sLayer.alphaLock,
        locked: sLayer.locked,
      });

      if (sLayer.dataUrl) {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            layer.ctx.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = (err) => {
            reject(
              new Error(
                `Failed to load image for layer "${sLayer.name || sLayer.id}": ${err}`,
              ),
            );
          };
          img.src = sLayer.dataUrl;
        });
      }

      loadedLayers.push(layer);
    }

    this.documentWidth = document.width;
    this.documentHeight = document.height;

    this.canvas.width = document.width;
    this.canvas.height = document.height;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.layers.replaceAllLayers(loadedLayers, document.activeLayerId);
    this.brush.loadContext(this.layers.getActive().canvas);
    this.history.clear();
    this.cacheBelowValid = false;
    this.renderLayers();
    this.emitHistoryChange();
    this.emitStateChange();
  }

  /**
   * Export a flattened composite PNG image of the artwork.
   */
  public async exportPNG(options?: ExportPNGOptions): Promise<string> {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = this.documentWidth;
    exportCanvas.height = this.documentHeight;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not create 2D context for PNG export");
    }

    if (options?.includeBackground) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    for (const layer of this.layers.getAll()) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.canvas, 0, 0);
    }

    return exportCanvas.toDataURL("image/png", options?.quality);
  }

  /* -------------------------------------------------------------------------- */
  /*                      Native Commands for Raster Operations                 */
  /* -------------------------------------------------------------------------- */

  public clearActiveLayer(): void {
    this.clear();
  }

  public fillActiveLayer(color: string): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;

    const w = activeLayer.canvas.width;
    const h = activeLayer.canvas.height;
    let patch = this.getPatchBounds(0, 0, w, h);
    if (this.hasSelection()) {
      patch = this.clampPatchBoundsToSelection(patch);
    }
    if (!patch) return;

    const beforeData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.drawWithSelectionClip(ctx, activeLayer.alphaLock, (tCtx) => {
      tCtx.fillStyle = color;
      tCtx.fillRect(0, 0, w, h);
    });

    const afterData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.history.pushPatch({
      layerId: activeLayer.id,
      beforeData,
      afterData,
      x: patch.x,
      y: patch.y,
      description: `Fill layer with ${color}`,
    });

    this.cacheBelowValid = false;
    this.brush.syncOriCanvas();
    this.renderLayers();
    this.emitStateChange();

    this.recordAction({
      type: "fillLayer",
      layerId: activeLayer.id,
      color,
    });
  }

  public getColorAt(
    x: number,
    y: number,
    scope: "activeLayer" | "composite" = "composite",
  ): ColorSample {
    const px = Math.floor(x);
    const py = Math.floor(y);

    const ctx =
      scope === "activeLayer"
        ? this.layers.getActive().canvas.getContext("2d")
        : this.canvas.getContext("2d");

    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    if (
      ctx &&
      px >= 0 &&
      py >= 0 &&
      px < this.documentWidth &&
      py < this.documentHeight
    ) {
      const imgData = ctx.getImageData(px, py, 1, 1);
      r = imgData.data[0];
      g = imgData.data[1];
      b = imgData.data[2];
      a = imgData.data[3];
    }

    const hex = `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    const alphaNormalized = (a / 255).toFixed(2).replace(/\.?0+$/, "");
    const rgba = `rgba(${r}, ${g}, ${b}, ${alphaNormalized})`;

    return {
      r,
      g,
      b,
      a,
      hex,
      rgba,
    };
  }

  public floodFill(
    x: number,
    y: number,
    color: string,
    tolerance: number = 0,
  ): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;

    const width = activeLayer.canvas.width;
    const height = activeLayer.canvas.height;
    const startX = Math.floor(x);
    const startY = Math.floor(y);

    if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
      return;
    }

    if (this.hasSelection() && !this.selection.containsPoint(startX, startY)) {
      return;
    }

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const [fillR, fillG, fillB, fillA] = parseCssColor(color);

    const startIdx = (startY * width + startX) * 4;
    const targetR = data[startIdx];
    const targetG = data[startIdx + 1];
    const targetB = data[startIdx + 2];
    const targetA = data[startIdx + 3];

    if (activeLayer.alphaLock && targetA === 0) {
      return;
    }

    if (
      Math.abs(fillR - targetR) <= tolerance &&
      Math.abs(fillG - targetG) <= tolerance &&
      Math.abs(fillB - targetB) <= tolerance &&
      (activeLayer.alphaLock || Math.abs(fillA - targetA) <= tolerance)
    ) {
      return;
    }

    const visited = new Uint8Array(width * height);
    const stack: number[] = [startX, startY];

    let minX = startX;
    let maxX = startX;
    let minY = startY;
    let maxY = startY;

    while (stack.length > 0) {
      const cy = stack.pop()!;
      const cx = stack.pop()!;
      const idx = cy * width + cx;

      if (visited[idx]) continue;
      visited[idx] = 1;

      if (this.hasSelection() && !this.selection.isPixelSelected(cx, cy)) {
        continue;
      }

      const pIdx = idx * 4;
      const r = data[pIdx];
      const g = data[pIdx + 1];
      const b = data[pIdx + 2];
      const a = data[pIdx + 3];

      if (activeLayer.alphaLock && a === 0) {
        continue;
      }

      if (
        Math.abs(r - targetR) <= tolerance &&
        Math.abs(g - targetG) <= tolerance &&
        Math.abs(b - targetB) <= tolerance &&
        Math.abs(a - targetA) <= tolerance
      ) {
        data[pIdx] = fillR;
        data[pIdx + 1] = fillG;
        data[pIdx + 2] = fillB;
        if (!activeLayer.alphaLock) {
          data[pIdx + 3] = fillA;
        }

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        if (cx > 0 && !visited[idx - 1]) {
          stack.push(cx - 1, cy);
        }
        if (cx < width - 1 && !visited[idx + 1]) {
          stack.push(cx + 1, cy);
        }
        if (cy > 0 && !visited[idx - width]) {
          stack.push(cx, cy - 1);
        }
        if (cy < height - 1 && !visited[idx + width]) {
          stack.push(cx, cy + 1);
        }
      }
    }

    let patch = this.getPatchBounds(minX, minY, maxX + 1, maxY + 1);
    if (this.hasSelection()) {
      patch = this.clampPatchBoundsToSelection(patch);
    }
    if (!patch) return;

    const beforeData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    ctx.putImageData(imgData, 0, 0);

    const afterData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.history.pushPatch({
      layerId: activeLayer.id,
      beforeData,
      afterData,
      x: patch.x,
      y: patch.y,
      description: "Flood fill",
    });

    this.cacheBelowValid = false;
    this.brush.syncOriCanvas();
    this.renderLayers();
    this.emitStateChange();

    this.recordAction({
      type: "floodFill",
      layerId: activeLayer.id,
      x: startX,
      y: startY,
      color,
      tolerance,
    });
  }

  public drawRectangle(options: DrawRectangleOptions): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;

    const {
      x,
      y,
      width,
      height,
      fillColor = "#000000",
      strokeColor,
      strokeWidth = 1,
      fill = true,
      stroke = strokeColor !== undefined,
      cornerRadius = 0,
    } = options;

    const sw = stroke ? strokeWidth : 0;
    let patch = this.getPatchBounds(
      Math.min(x, x + width) - sw - 2,
      Math.min(y, y + height) - sw - 2,
      Math.max(x, x + width) + sw + 2,
      Math.max(y, y + height) + sw + 2,
    );
    if (this.hasSelection()) {
      patch = this.clampPatchBoundsToSelection(patch);
    }
    if (!patch) return;

    const beforeData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.drawWithSelectionClip(ctx, activeLayer.alphaLock, (tCtx) => {
      if (fill) tCtx.fillStyle = fillColor;
      if (stroke) {
        tCtx.strokeStyle = strokeColor ?? fillColor;
        tCtx.lineWidth = strokeWidth;
      }

      if (cornerRadius > 0 && typeof tCtx.roundRect === "function") {
        tCtx.beginPath();
        tCtx.roundRect(x, y, width, height, cornerRadius);
        if (fill) tCtx.fill();
        if (stroke) tCtx.stroke();
      } else {
        if (fill) tCtx.fillRect(x, y, width, height);
        if (stroke) {
          tCtx.beginPath();
          tCtx.rect(x, y, width, height);
          tCtx.stroke();
        }
      }
    });

    const afterData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.history.pushPatch({
      layerId: activeLayer.id,
      beforeData,
      afterData,
      x: patch.x,
      y: patch.y,
      description: "Draw rectangle",
    });

    this.cacheBelowValid = false;
    this.brush.syncOriCanvas();
    this.renderLayers();
    this.emitStateChange();

    this.recordAction({
      type: "drawRectangle",
      layerId: activeLayer.id,
      options: { ...options },
    });
  }

  public drawEllipse(options: DrawEllipseOptions): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;

    const {
      x,
      y,
      radiusX,
      radiusY,
      rotation = 0,
      fillColor = "#000000",
      strokeColor,
      strokeWidth = 1,
      fill = true,
      stroke = strokeColor !== undefined,
    } = options;

    const sw = stroke ? strokeWidth : 0;
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const extentX = Math.hypot(radiusX * cos, radiusY * sin);
    const extentY = Math.hypot(radiusX * sin, radiusY * cos);
    let patch = this.getPatchBounds(
      x - extentX - sw - 2,
      y - extentY - sw - 2,
      x + extentX + sw + 2,
      y + extentY + sw + 2,
    );
    if (this.hasSelection()) {
      patch = this.clampPatchBoundsToSelection(patch);
    }
    if (!patch) return;

    const beforeData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.drawWithSelectionClip(ctx, activeLayer.alphaLock, (tCtx) => {
      if (fill) tCtx.fillStyle = fillColor;
      if (stroke) {
        tCtx.strokeStyle = strokeColor ?? fillColor;
        tCtx.lineWidth = strokeWidth;
      }

      tCtx.beginPath();
      tCtx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);

      if (fill) tCtx.fill();
      if (stroke) tCtx.stroke();
    });

    const afterData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.history.pushPatch({
      layerId: activeLayer.id,
      beforeData,
      afterData,
      x: patch.x,
      y: patch.y,
      description: "Draw ellipse",
    });

    this.cacheBelowValid = false;
    this.brush.syncOriCanvas();
    this.renderLayers();
    this.emitStateChange();

    this.recordAction({
      type: "drawEllipse",
      layerId: activeLayer.id,
      options: { ...options },
    });
  }

  public drawLine(options: DrawLineOptions): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx) return;

    const {
      x1,
      y1,
      x2,
      y2,
      strokeColor = "#000000",
      strokeWidth = 1,
      lineCap = "round",
    } = options;

    const sw = strokeWidth;
    let patch = this.getPatchBounds(
      Math.min(x1, x2) - sw - 2,
      Math.min(y1, y2) - sw - 2,
      Math.max(x1, x2) + sw + 2,
      Math.max(y1, y2) + sw + 2,
    );
    if (this.hasSelection()) {
      patch = this.clampPatchBoundsToSelection(patch);
    }
    if (!patch) return;

    const beforeData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.drawWithSelectionClip(ctx, activeLayer.alphaLock, (tCtx) => {
      tCtx.strokeStyle = strokeColor;
      tCtx.lineWidth = strokeWidth;
      tCtx.lineCap = lineCap;

      tCtx.beginPath();
      tCtx.moveTo(x1, y1);
      tCtx.lineTo(x2, y2);
      tCtx.stroke();
    });

    const afterData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.history.pushPatch({
      layerId: activeLayer.id,
      beforeData,
      afterData,
      x: patch.x,
      y: patch.y,
      description: "Draw line",
    });

    this.cacheBelowValid = false;
    this.brush.syncOriCanvas();
    this.renderLayers();
    this.emitStateChange();

    this.recordAction({
      type: "drawLine",
      layerId: activeLayer.id,
      options: { ...options },
    });
  }

  public drawText(
    text: string,
    x: number,
    y: number,
    style?: TextStyleOptions,
  ): void {
    const activeLayer = this.layers.getActive();
    if (activeLayer.locked) {
      throw new Error("Active layer is locked");
    }
    const ctx = activeLayer.canvas.getContext("2d");
    if (!ctx || !text) return;

    const {
      fontSize = 24,
      fontFamily = "sans-serif",
      fontWeight = "normal",
      fontStyle = "normal",
      color = "#000000",
      align = "left",
      baseline = "top",
      maxWidth,
    } = style ?? {};

    const metricsCtx = this.getScratchCanvas().getContext("2d") ?? ctx;
    metricsCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = metricsCtx.measureText(text);
    const textWidth = maxWidth
      ? Math.min(metrics.width, maxWidth)
      : metrics.width;
    const fontHeight = fontSize * 1.5;

    let left = x;
    if (align === "center") left = x - textWidth / 2;
    else if (align === "right" || align === "end") left = x - textWidth;

    let top = y;
    if (baseline === "middle") top = y - fontHeight / 2;
    else if (baseline === "bottom" || baseline === "alphabetic")
      top = y - fontHeight;

    let patch = this.getPatchBounds(
      left - 5,
      top - 5,
      left + textWidth + 5,
      top + fontHeight + 5,
    );
    if (this.hasSelection()) {
      patch = this.clampPatchBoundsToSelection(patch);
    }
    if (!patch) {
      return;
    }

    const beforeData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.drawWithSelectionClip(ctx, activeLayer.alphaLock, (tCtx) => {
      tCtx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
      tCtx.fillStyle = color;
      tCtx.textAlign = align;
      tCtx.textBaseline = baseline;

      if (maxWidth !== undefined) {
        tCtx.fillText(text, x, y, maxWidth);
      } else {
        tCtx.fillText(text, x, y);
      }
    });

    const afterData = ctx.getImageData(
      patch.x,
      patch.y,
      patch.width,
      patch.height,
    );

    this.history.pushPatch({
      layerId: activeLayer.id,
      beforeData,
      afterData,
      x: patch.x,
      y: patch.y,
      description: `Draw text "${text}"`,
    });

    this.cacheBelowValid = false;
    this.brush.syncOriCanvas();
    this.renderLayers();
    this.emitStateChange();

    this.recordAction({
      type: "drawText",
      layerId: activeLayer.id,
      text,
      x,
      y,
      options: style ? { ...style } : undefined,
    });
  }

  /**
   * Appends a serializable action to the canvas operation log and emits "action:record"
   * (and "stroke:record" if the action is a stroke).
   */
  public recordAction(action: CanvasAction): void {
    if (this.isReplaying) return;

    if (!action.id) {
      action.id = `act-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    }
    if (!action.timestamp) {
      action.timestamp = Date.now();
    }

    this.actionLog.push(action);
    this.emit("action:record", action);
    if (action.type === "stroke") {
      this.emit("stroke:record", action);
    }
  }

  /**
   * Returns a copy of the serializable canvas action log recorded so far.
   */
  public getActionLog(): CanvasAction[] {
    return [...this.actionLog];
  }

  /**
   * Clears the internal action log.
   */
  public clearActionLog(): void {
    this.actionLog = [];
  }

  /**
   * Replays a single serializable CanvasAction onto the canvas.
   */
  public async replayAction(action: CanvasAction): Promise<void> {
    const previousReplaying = this.isReplaying;
    this.isReplaying = true;
    try {
      switch (action.type) {
        case "stroke": {
          const layer = this.getLayerById(action.layerId);
          if (!layer || layer.locked) break;
          this.setActiveLayer(layer.id);
          const savedConfig = { ...this.brush.config };
          if (action.brushConfig) {
            this.loadConfig(action.brushConfig);
          }
          if (action.points && action.points.length > 0) {
            this.brush.isAlphaLocked = layer.alphaLock;
            this.brush.syncOriCanvas();

            this.strokeMinX = Infinity;
            this.strokeMinY = Infinity;
            this.strokeMaxX = -Infinity;
            this.strokeMaxY = -Infinity;

            if (typeof document !== "undefined") {
              this.currentStrokeBeforeCanvas = document.createElement("canvas");
              this.currentStrokeBeforeCanvas.width = layer.canvas.width;
              this.currentStrokeBeforeCanvas.height = layer.canvas.height;
              const bCtx = this.currentStrokeBeforeCanvas.getContext("2d");
              if (bCtx) {
                bCtx.drawImage(layer.canvas, 0, 0);
              }
            }
            this.currentStrokeLayerId = layer.id;
            this.currentStrokePoints = [...action.points];

            for (const p of action.points) {
              this.updateStrokeBounds(p.x, p.y);
              this.brush.putPoint(p.x, p.y, p.pressure ?? 1);
            }
            this.brush.render();
            this.renderLayers();
            this.commitStroke();
          }
          this.loadConfig(savedConfig);
          break;
        }
        case "floodFill": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.floodFill(action.x, action.y, action.color, action.tolerance);
          }
          break;
        }
        case "drawRectangle": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.drawRectangle(action.options);
          }
          break;
        }
        case "drawEllipse": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.drawEllipse(action.options);
          }
          break;
        }
        case "drawLine": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.drawLine(action.options);
          }
          break;
        }
        case "drawText": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.drawText(action.text, action.x, action.y, action.options);
          }
          break;
        }
        case "clearLayer": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.clearActiveLayer();
          }
          break;
        }
        case "fillLayer": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.setActiveLayer(layer.id);
            this.fillActiveLayer(action.color);
          }
          break;
        }
        case "createLayer": {
          this.createLayer({
            id: action.layerId,
            name: action.name,
            ...action.options,
          });
          break;
        }
        case "deleteLayer": {
          this.deleteLayer(action.layerId);
          break;
        }
        case "moveLayer": {
          this.moveLayer(action.layerId, action.targetIndex);
          break;
        }
        case "setLayerProperties": {
          const layer = this.getLayerById(action.layerId);
          if (layer) {
            this.updateLayer(action.layerId, action.properties);
          }
          break;
        }
        case "duplicateLayer": {
          this.duplicateLayer(action.layerId);
          break;
        }
        case "selectRectangle": {
          this.selectRectangle(
            action.x,
            action.y,
            action.width,
            action.height,
            action.mode,
          );
          break;
        }
        case "selectEllipse": {
          this.selectEllipse(
            action.cx,
            action.cy,
            action.radiusX,
            action.radiusY,
            action.rotation,
            action.mode,
          );
          break;
        }
        case "selectLasso": {
          this.selectLasso(action.points, action.mode);
          break;
        }
        case "selectAll": {
          this.selectAllSelection();
          break;
        }
        case "clearSelection": {
          this.clearSelection();
          break;
        }
        case "invertSelection": {
          this.invertSelection();
          break;
        }
      }
    } finally {
      this.isReplaying = previousReplaying;
    }
  }

  /**
   * Replays an array of serializable CanvasActions onto the canvas.
   */
  public async replay(
    actionLog: CanvasAction[],
    options?: ReplayOptions,
  ): Promise<void> {
    const total = actionLog.length;
    if (total === 0) return;

    const speed = options?.speed ?? 0;
    const delayMs =
      options?.delayMs ??
      (speed > 0 ? Math.max(10, Math.floor(100 / speed)) : 0);

    for (let i = 0; i < total; i++) {
      const action = actionLog[i];
      options?.onAction?.(action, i, total);
      options?.onProgress?.((i + 1) / total, i + 1, total);

      await this.replayAction(action);

      if (delayMs > 0 && i < total - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                            Selection Tools API                             */
  /* -------------------------------------------------------------------------- */

  public selectRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    mode?: SelectionMode,
  ): void {
    this.selection.selectRectangle(x, y, width, height, mode);
    this.recordAction({
      type: "selectRectangle",
      x,
      y,
      width,
      height,
      mode,
    });
  }

  public selectEllipse(
    cx: number,
    cy: number,
    radiusX: number,
    radiusY: number,
    rotation: number = 0,
    mode?: SelectionMode,
  ): void {
    this.selection.selectEllipse(cx, cy, radiusX, radiusY, rotation, mode);
    this.recordAction({
      type: "selectEllipse",
      cx,
      cy,
      radiusX,
      radiusY,
      rotation,
      mode,
    });
  }

  public selectLasso(points: SelectionPoint[], mode?: SelectionMode): void {
    this.selection.selectLasso(points, mode);
    this.recordAction({
      type: "selectLasso",
      points: points.map((p) => ({ x: p.x, y: p.y })),
      mode,
    });
  }

  public selectAllSelection(): void {
    this.selection.selectAll();
    this.recordAction({
      type: "selectAll",
    });
  }

  public selectAll(): void {
    this.selectAllSelection();
  }

  public clearSelection(): void {
    this.selection.clear();
    this.recordAction({
      type: "clearSelection",
    });
  }

  public deselect(): void {
    this.clearSelection();
  }

  public invertSelection(): void {
    this.selection.invert();
    this.recordAction({
      type: "invertSelection",
    });
  }

  public hasSelection(): boolean {
    return this.selection.isActive();
  }

  public getSelectionBounds(): SelectionBounds | null {
    return this.selection.getBounds();
  }

  public renderSelectionOutline(
    ctx: CanvasRenderingContext2D,
    options?: SelectionOutlineOptions,
  ): void {
    this.selection.renderOutline(ctx, options);
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    this.canvas.removeEventListener("pointercancel", this.handlePointerCancel);
    this.canvas.removeEventListener(
      "lostpointercapture",
      this.handlePointerCancel,
    );
    window.removeEventListener("pointerup", this.handlePointerUp);
    this.listeners.clear();
    this.isDrawing = false;
    this.activePointerId = null;
  }
}

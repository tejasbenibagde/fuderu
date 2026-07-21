// src/Canvas.ts

import { Brush } from "./Brush";
import type { BrushConfig } from "./types/config";
import { MousePressure } from "./utils";
import {
  LayerManager,
  type CreateLayerOptions,
  type UpdateLayerOptions,
} from "./LayerManager";
import type { Layer } from "./Layer";
import {
  HistoryManager,
  CanvasStateHistoryEntry,
  LayerCreatedHistoryEntry,
  LayerDeletedHistoryEntry,
  LayerPropertyHistoryEntry,
  MoveLayerHistoryEntry,
  type HistoryContext,
} from "./HistoryManager";

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
  public layers!: LayerManager;
  public history: HistoryManager;

  private isDrawing = false;
  private currentStrokeBeforeCanvas: HTMLCanvasElement | null = null;
  private currentStrokeLayerId: string | null = null;
  private strokeMinX = Infinity;
  private strokeMinY = Infinity;
  private strokeMaxX = -Infinity;
  private strokeMaxY = -Infinity;

  private cacheBelowCanvas: HTMLCanvasElement | null = null;
  private cacheBelowValid = false;

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
    this.history = new HistoryManager(30);
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

    this.canvas.width = this.documentWidth;
    this.canvas.height = this.documentHeight;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Reload brush context to reinitialise internal canvases
    this.brush.loadContext(this.layers.getActive().canvas);
    this.renderLayers();
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

  private handlePointerDown = (e: PointerEvent) => {
    this.isDrawing = true;
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

    const activeLayer = this.layers.getActive();
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
    this.brush.putPoint(p.x, p.y, p.pressure);
    this.brush.render();
    this.renderLayers();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDrawing) return;

    const coalesced = e.getCoalescedEvents?.();

    const events = coalesced && coalesced.length > 0 ? coalesced : [e];

    const rect = this.canvas.getBoundingClientRect();
    for (const ce of events) {
      const p = this.getPoint(ce, rect);
      this.updateStrokeBounds(p.x, p.y);
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

    this.brush.finalizeStroke(() => {
      if (beforeCanvas && layerId) {
        const layer = this.layers.getById(layerId);
        if (layer) {
          const afterCtx = layer.canvas.getContext("2d");
          const beforeCtx = beforeCanvas.getContext("2d");
          if (afterCtx && beforeCtx) {
            const validMinX = minX === Infinity ? 0 : minX;
            const validMinY = minY === Infinity ? 0 : minY;
            const validMaxX = maxX === -Infinity ? this.documentWidth : maxX;
            const validMaxY = maxY === -Infinity ? this.documentHeight : maxY;

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
    });
  }

  private handlePointerUp = (e?: PointerEvent) => {
    if (!this.isDrawing) return;

    this.isDrawing = false;
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
    if (!this.isDrawing) return;

    this.isDrawing = false;
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

    this.brush.loadContext(this.layers.getActive().canvas);
    this.renderLayers();
  }

  public getLayers(): readonly Layer[] {
    return this.layers.getAll();
  }

  public getActiveLayer(): Layer {
    return this.layers.getActive();
  }

  public createLayer(options?: CreateLayerOptions | string): Layer {
    const layer = this.layers.createLayer(options);
    this.cacheBelowValid = false;

    this.history.push(new LayerCreatedHistoryEntry(layer, this));

    this.brush.loadContext(layer.canvas);
    this.renderLayers();

    return layer;
  }

  public deleteLayer(layerId: string): void {
    const layer = this.layers.getById(layerId);
    const index = this.layers.getAll().indexOf(layer);
    const wasActive = this.layers.getActiveId() === layerId;

    this.layers.deleteLayer(layerId);
    this.cacheBelowValid = false;

    this.history.push(
      new LayerDeletedHistoryEntry(layer, index, wasActive, this),
    );

    if (wasActive) {
      this.brush.loadContext(this.layers.getActive().canvas);
    }

    this.renderLayers();
  }

  public duplicateLayer(layerId: string): Layer {
    const layer = this.layers.duplicateLayer(layerId);
    this.cacheBelowValid = false;

    this.history.push(new LayerCreatedHistoryEntry(layer, this));

    this.brush.loadContext(layer.canvas);
    this.renderLayers();

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
    }

    this.renderLayers();
  }

  public updateLayer(layerId: string, options: UpdateLayerOptions): Layer {
    const layer = this.layers.getById(layerId);

    const originalValues: Record<string, string | number | boolean> = {};
    const keys: ("name" | "visible" | "opacity" | "blendMode")[] = [
      "name",
      "visible",
      "opacity",
      "blendMode",
    ];
    for (const key of keys) {
      if (options[key] !== undefined) {
        originalValues[key] = layer[key];
      }
    }

    const updated = this.layers.updateLayer(layerId, options);
    this.cacheBelowValid = false;

    for (const key of keys) {
      if (options[key] !== undefined && originalValues[key] !== options[key]) {
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

    this.renderLayers();
    return updated;
  }

  clear(): void {
    const activeLayer = this.layers.getActive();
    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      const beforeData = ctx.getImageData(
        0,
        0,
        activeLayer.canvas.width,
        activeLayer.canvas.height,
      );

      this.brush.clear();

      const afterData = ctx.getImageData(
        0,
        0,
        activeLayer.canvas.width,
        activeLayer.canvas.height,
      );
      this.history.push(
        new CanvasStateHistoryEntry(
          activeLayer.id,
          beforeData,
          afterData,
          this,
        ),
      );
    } else {
      this.brush.clear();
    }
    this.cacheBelowValid = false;
    this.renderLayers();
  }

  undo(): void {
    this.history.undo();
    this.brush.undo();
    this.cacheBelowValid = false;
    this.renderLayers();
  }

  redo(): void {
    this.history.redo();
    this.brush.redo();
    this.cacheBelowValid = false;
    this.renderLayers();
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
      this.brush.loadContext(this.layers.getActive().canvas);
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
    this.documentWidth = width;
    this.documentHeight = height;

    // Resize the pixel buffer
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.brush.loadContext(this.layers.getActive().canvas);
    this.history.clear();
    this.cacheBelowValid = false;
    this.renderLayers();
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
  }
}

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
  private currentStrokeBeforeData: ImageData | null = null;
  private currentStrokeLayerId: string | null = null;

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

  private getPoint(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();

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

  private handlePointerDown = (e: PointerEvent) => {
    this.isDrawing = true;
    this.mousePressure.reset();

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignore environments where pointer capture is unavailable.
    }

    const activeLayer = this.layers.getActive();
    const ctx = activeLayer.canvas.getContext("2d");
    if (ctx) {
      this.currentStrokeBeforeData = ctx.getImageData(
        0,
        0,
        activeLayer.canvas.width,
        activeLayer.canvas.height,
      );
      this.currentStrokeLayerId = activeLayer.id;
    }

    const p = this.getPoint(e);
    this.brush.putPoint(p.x, p.y, p.pressure);
    this.brush.render();
    this.renderLayers();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDrawing) return;

    const coalesced = e.getCoalescedEvents?.();

    const events = coalesced && coalesced.length > 0 ? coalesced : [e];

    for (const ce of events) {
      const p = this.getPoint(ce);
      this.brush.putPoint(p.x, p.y, p.pressure);
    }

    this.brush.render();
    this.renderLayers();
  };

  private commitStroke() {
    const beforeData = this.currentStrokeBeforeData;
    const layerId = this.currentStrokeLayerId;
    this.currentStrokeBeforeData = null;
    this.currentStrokeLayerId = null;

    this.brush.finalizeStroke(() => {
      if (beforeData && layerId) {
        const layer = this.layers.getById(layerId);
        if (layer) {
          const afterCtx = layer.canvas.getContext("2d");
          if (afterCtx) {
            const afterData = afterCtx.getImageData(
              0,
              0,
              layer.canvas.width,
              layer.canvas.height,
            );
            this.history.push(
              new CanvasStateHistoryEntry(layerId, beforeData, afterData, this),
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
    this.mousePressure.reset();

    if (e?.pointerId != null) {
      try {
        if (this.canvas.hasPointerCapture(e.pointerId)) {
          this.canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore environments where pointer capture is unavailable.
      }
    }

    this.commitStroke();
  };

  private handlePointerCancel = (e?: PointerEvent) => {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.mousePressure.reset();

    if (e?.pointerId != null) {
      try {
        if (this.canvas.hasPointerCapture(e.pointerId)) {
          this.canvas.releasePointerCapture(e.pointerId);
        }
      } catch {
        // Ignore environments where pointer capture is unavailable.
      }
    }

    this.commitStroke();
  };

  // Public API

  public setActiveLayer(layerId: string): void {
    this.layers.setActive(layerId);

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

    this.history.push(new LayerCreatedHistoryEntry(layer, this));

    this.brush.loadContext(layer.canvas);
    this.renderLayers();

    return layer;
  }

  public moveLayer(layerId: string, targetIndex: number): void {
    const beforeIndex = this.layers.getAll().findIndex((l) => l.id === layerId);
    this.layers.moveLayer(layerId, targetIndex);
    const afterIndex = this.layers.getAll().findIndex((l) => l.id === layerId);

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
    this.renderLayers();
  }

  undo(): void {
    this.history.undo();
    this.brush.undo();
    this.renderLayers();
  }

  redo(): void {
    this.history.redo();
    this.brush.redo();
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
  }

  public insertLayerOnly(layer: Layer, index: number): void {
    this.layers.addLayerAt(layer, index);
  }

  public moveLayerOnly(layerId: string, index: number): void {
    this.layers.moveLayer(layerId, index);
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
   * This clears all artwork and resets the undo stack.
   * It does NOT change any CSS on the canvas element.
   * sizing the element on screen is the caller's responsibility.
   *
   * @example
   * painter.setDocumentSize(768, 1024);
   * canvas.style.width  = "384px";   // you control display size
   * canvas.style.height = "512px";
   */
  setDocumentSize(width: number, height: number): void {
    if (width <= 0 || height <= 0) {
      console.warn("[Canvas] setDocumentSize: width and height must be > 0");
      return;
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

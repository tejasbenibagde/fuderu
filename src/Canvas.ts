// src/Canvas.ts

import { Brush } from "./Brush";
import type { BrushConfig } from "./types/config";
import { MousePressure } from "./utils";

export interface CanvasOptions {
  canvas: HTMLCanvasElement | string;
  /**
   * The logical drawing resolution.
   * This is the size of the internal pixel buffer — independent of how
   * the canvas element is sized on screen via CSS.
   * Defaults to 1536 × 1536 if omitted.
   */
  document?: {
    width: number;
    height: number;
  };
  brush?: BrushConfig;
  pressureSimulation?: boolean;
}

export class Canvas {
  private canvas: HTMLCanvasElement;
  public brush: Brush;

  private isDrawing = false;

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
   * getPressure() again — avoids double-advancing the simulator state.
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
    // display size × devicePixelRatio in setupCanvas()
    this.documentProvided = !!options.document;
    this.documentWidth = options.document?.width ?? 0;
    this.documentHeight = options.document?.height ?? 0;

    this.pressureSimulation = options.pressureSimulation ?? true;
    this.mousePressure = new MousePressure();

    this.setupCanvas();
    this.brush = new Brush(this.canvas, options.brush);
    this.bindEvents();
  }

  // ─────────────────────────────────────────────────────────
  // Private setup
  // ─────────────────────────────────────────────────────────

  private setupCanvas(): void {
    // Determine display size
    const rect = this.canvas.getBoundingClientRect();
    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    // If no explicit document size was provided use the element size × DPR
    if (
      !this.documentProvided ||
      this.documentWidth <= 0 ||
      this.documentHeight <= 0
    ) {
      this.documentWidth = Math.max(1, Math.round(rect.width * dpr));
      this.documentHeight = Math.max(1, Math.round(rect.height * dpr));
    }

    // Set the pixel buffer to the logical document size
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

    this.canvas.width = this.documentWidth;
    this.canvas.height = this.documentHeight;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Reload brush context to reinitialise internal canvases
    this.brush.loadContext(this.canvas);
  }

  private bindEvents(): void {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
  }

  private getPoint(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();

    // Return coordinates in CSS/display pixels (unscaled). The brush
    // engine expects user coordinates in CSS pixels; internal buffers are
    // sized to device pixels (DPR) so the drawing pipeline scales where needed.
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Real stylus pressure — only trust it for pen type with non-zero value
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

    const p = this.getPoint(e);
    this.brush.putPoint(p.x, p.y, p.pressure);
    this.brush.render();
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (!this.isDrawing) return;

    const p = this.getPoint(e);
    this.brush.putPoint(p.x, p.y, p.pressure);
    this.brush.render();
  };

  private handlePointerUp = () => {
    if (!this.isDrawing) return;
    this.isDrawing = false;
    this.mousePressure.reset();
    this.brush.finalizeStroke();
  };

  // ─────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────

  clear(): void {
    this.brush.clear();
  }
  undo(): void {
    this.brush.undo();
  }
  redo(): void {
    this.brush.redo();
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
   * It does NOT change any CSS on the canvas element —
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

    this.documentWidth = width;
    this.documentHeight = height;

    // Resize the pixel buffer
    this.canvas.width = width;
    this.canvas.height = height;

    const ctx = this.canvas.getContext("2d");
    if (ctx) ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Re-initialise all internal off-screen canvases to the new size.
    // This also resets the undo stack — expected, since artwork is cleared.
    this.brush.loadContext(this.canvas);
  }

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
  }
}

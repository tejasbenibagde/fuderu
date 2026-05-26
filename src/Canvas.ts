// src/Canvas.ts

import { Brush } from "./Brush";
import type { BrushConfig } from "./types/config";
import { MousePressure } from "./utils";

export interface CanvasOptions {
  canvas: HTMLCanvasElement | string;
  brush?: BrushConfig;
  pressureSimulation?: boolean;
}

export class Canvas {
  private canvas: HTMLCanvasElement;
  public brush: Brush;

  private isDrawing = false;

  /**
   * The underlying pressure simulator.
   * You can call .open() / .close() at runtime,
   * or adjust K/minRange/maxRange by replacing it entirely.
   */
  public mousePressure: MousePressure;

  /**
   * When true, mouse/touch events with no real pressure
   * will use simulated pressure instead of a flat 1.0.
   */
  public pressureSimulation: boolean;

  constructor(options: CanvasOptions) {
    // Canvas resolution
    if (typeof options.canvas === "string") {
      const el = document.querySelector(options.canvas);

      if (!el || !(el instanceof HTMLCanvasElement)) {
        throw new Error(`Canvas "${options.canvas}" not found`);
      }

      this.canvas = el;
    } else {
      this.canvas = options.canvas;
    }
    this.pressureSimulation = options.pressureSimulation ?? true;
    this.mousePressure = new MousePressure();
    this.setupCanvas();

    // NEW BRUSH
    this.brush = new Brush(this.canvas, options.brush);

    this.bindEvents();
  }

  private setupCanvas(): void {
    const ratio = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * ratio;
    this.canvas.height = rect.height * ratio;
    this.canvas.style.touchAction = "none";
    this.canvas.style.userSelect = "none";

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.scale(ratio, ratio);
  }

  private bindEvents(): void {
    this.canvas.addEventListener("pointerdown", this.handlePointerDown);
    this.canvas.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerUp);
  }

  private getPoint(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hasRealPressure = e.pointerType === "pen" && e.pressure > 0;
    const pressure = hasRealPressure
      ? e.pressure
      : this.pressureSimulation
        ? this.mousePressure.getPressure(x, y)
        : 1;

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

  // =========================
  // PUBLIC API
  // =========================

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

  destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
  }
}

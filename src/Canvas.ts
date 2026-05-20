// src/Canvas.ts

import { Brush } from "./Brush";
import type { BrushConfig } from "./types/config";

export interface CanvasOptions {
  canvas: HTMLCanvasElement | string;
  brush?: BrushConfig;
}

export class Canvas {
  private canvas: HTMLCanvasElement;
  public brush: Brush;

  private isDrawing = false;

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

    this.setupCanvas();

    // NEW BRUSH
    this.brush = new Brush(
      this.canvas,
      options.brush
    );

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

    if (!ctx) {
      throw new Error("Could not get canvas context");
    }

    ctx.scale(ratio, ratio);
  }

  private bindEvents(): void {
    this.canvas.addEventListener(
      "pointerdown",
      this.handlePointerDown
    );

    this.canvas.addEventListener(
      "pointermove",
      this.handlePointerMove
    );

    window.addEventListener(
      "pointerup",
      this.handlePointerUp
    );
  }

  private getPoint(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();

    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure || 1,
    };
  }

  private handlePointerDown = (
    e: PointerEvent
  ) => {
    this.isDrawing = true;

    const p = this.getPoint(e);

    this.brush.putPoint(
      p.x,
      p.y,
      p.pressure
    );

    this.brush.render();
  };

  private handlePointerMove = (
    e: PointerEvent
  ) => {
    if (!this.isDrawing) return;

    const p = this.getPoint(e);

    this.brush.putPoint(
      p.x,
      p.y,
      p.pressure
    );

    this.brush.render();
  };

  private handlePointerUp = () => {
    if (!this.isDrawing) return;

    this.isDrawing = false;

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

  loadConfig(config: BrushConfig): void {
    this.brush.loadConfig(config);
  }

  loadImage(
    img: HTMLImageElement | HTMLCanvasElement | string
  ): Promise<void> {
    return this.brush.loadImageAsync(img);
  }

  destroy(): void {
    this.canvas.removeEventListener(
      "pointerdown",
      this.handlePointerDown
    );

    this.canvas.removeEventListener(
      "pointermove",
      this.handlePointerMove
    );

    window.removeEventListener(
      "pointerup",
      this.handlePointerUp
    );
  }
}
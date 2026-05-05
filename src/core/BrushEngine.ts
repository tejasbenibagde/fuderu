import type { Point, BrushOptions } from '../types';
import {
  createBrushEngine,
  isWasmInitialized,
  type WasmBrushRenderer
} from '../wasm-loader';

export class BrushEngine {
  private currentOptions: BrushOptions = {
    color: '#000000',
    size: 10,
    opacity: 1,
    invert: false,
    smoothing: 0
  };

  private renderer: WasmBrushRenderer | null = null;
  private currentBrushType: string = "dip-pen-soft";

  private isDrawing = false;
  private lastPoint: Point | null = null;
  private lastTimestamp = 0;
  private pathStarted = false;

  constructor(brushType: string = "dip-pen-soft") {
    this.currentBrushType = brushType;
  }

  private applyCurrentOptions(): void {
    if (!this.renderer) return;

    this.renderer.set_size(this.currentOptions.size);
    this.renderer.set_opacity(this.currentOptions.opacity);

    if (typeof this.currentOptions.smoothing === 'number') {
      this.renderer.set_smoothing(this.currentOptions.smoothing);
    }
  }

  private ensureRenderer(): void {
    if (!this.renderer && isWasmInitialized()) {
      this.renderer = createBrushEngine(this.currentBrushType);
      this.applyCurrentOptions();
    }
  }

  // 🟢 Start stroke
  startStroke(point: Point): void {
    this.ensureRenderer();

    this.isDrawing = true;
    this.lastPoint = point;
    this.lastTimestamp = point.timestamp || Date.now();
    this.pathStarted = false;

    this.renderer?.reset();
  }

  // 🟢 Draw stroke
  drawStroke(ctx: CanvasRenderingContext2D, point: Point): void {
    if (!this.isDrawing) return;

    this.ensureRenderer();
    if (!this.renderer) return; // safety

    const now = point.timestamp || Date.now();
    const deltaTime = Math.max(1, now - this.lastTimestamp);

    let speed = 0;

    if (this.lastPoint) {
      const dx = point.x - this.lastPoint.x;
      const dy = point.y - this.lastPoint.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      speed = distance / deltaTime;
    }

    let finalSize = this.currentOptions.size;
    let finalOpacity = this.currentOptions.opacity;
    let smoothX = point.x;
    let smoothY = point.y;

    try {
      const pressure = point.pressure || 0.5;

      const result = this.renderer.process(
        point.x,
        point.y,
        pressure,
        speed
      );

      if (result && result.length >= 4) {
        smoothX = result[0];
        smoothY = result[1];
        finalSize = result[2];
        finalOpacity = result[3];
      }
    } catch (e) {
      console.warn('WASM failed, fallback used:', e);
    }

    // 🎨 draw
    if (this.currentOptions.invert) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = finalOpacity;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = finalOpacity;
      ctx.strokeStyle = this.currentOptions.color;
    }

    ctx.lineWidth = finalSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (!this.pathStarted) {
      ctx.beginPath();
      ctx.moveTo(smoothX, smoothY);
      this.pathStarted = true;
    } else {
      ctx.lineTo(smoothX, smoothY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(smoothX, smoothY);
    }

    this.lastPoint = { x: smoothX, y: smoothY, pressure: point.pressure };
    this.lastTimestamp = now;
  }

  // 🟢 End stroke
  endStroke(): void {
    this.isDrawing = false;
    this.lastPoint = null;
    this.pathStarted = false;
  }

  // 🎨 Controls
  setColor(color: string): void {
    this.currentOptions.color = color;
  }

  setSize(size: number): void {
    this.currentOptions.size = Math.max(1, size);

    this.ensureRenderer();
    this.renderer?.set_size(size);
  }

  setOpacity(opacity: number): void {
    this.currentOptions.opacity = Math.min(1, Math.max(0, opacity));

    this.ensureRenderer();
    this.renderer?.set_opacity(opacity);
  }

  setSmoothing(value: number): void {
    this.currentOptions.smoothing = value;

    this.ensureRenderer();
    this.renderer?.set_smoothing(value);
  }

  setInvert(invert: boolean): void {
    this.currentOptions.invert = invert;
  }

  // 🔁 Switch brush
  setBrush(brushType: string): void {
    this.currentBrushType = brushType;

    if (isWasmInitialized()) {
      this.renderer = createBrushEngine(brushType);
      this.applyCurrentOptions();
    } else {
      this.renderer = null;
    }
  }

  getOptions(): BrushOptions {
    return { ...this.currentOptions };
  }
}
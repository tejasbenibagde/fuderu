import type { Point, BrushOptions } from '../types';
import { createBrushEngine, isWasmInitialized } from '../wasm-loader';

export class BrushEngine {
  private currentOptions: BrushOptions = {
    color: '#000000',
    size: 10,
    opacity: 1,
    invert: false
  };

  private renderer: any;
  private currentBrushType: string = "dip-pen-soft";

  private isDrawing: boolean = false;
  private lastPoint: Point | null = null;
  private lastTimestamp: number = 0;
  private pathStarted: boolean = false;

  constructor(brushType: string = "dip-pen-soft") {
    this.currentBrushType = brushType;
    // Defer renderer creation until WASM is ready
  }

  private ensureRenderer(): void {
    if (!this.renderer && isWasmInitialized()) {
      this.renderer = createBrushEngine(this.currentBrushType);
    }
  }

  // 🟢 Start stroke
  startStroke(point: Point): void {
    this.ensureRenderer();
    this.isDrawing = true;
    this.lastPoint = point;
    this.lastTimestamp = point.timestamp || Date.now();
    this.pathStarted = false;

    if (this.renderer && this.renderer.reset) {
      this.renderer.reset();
    }
  }

  // 🟢 Draw stroke
  drawStroke(ctx: CanvasRenderingContext2D, point: Point): void {
    if (!this.isDrawing) return;

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

      // 🔥 Single WASM call (clean + fast)
      const result = this.renderer.process(
        point.x,
        point.y,
        pressure,
        speed
      );

      // Expected: [x, y, size, opacity]
      if (result && result.length >= 4) {
        smoothX = result[0];
        smoothY = result[1];
        finalSize = result[2];
        finalOpacity = result[3];
      }

    } catch (e) {
      console.warn('WASM processing failed, using fallback:', e);
    }

    // 🧽 Eraser mode
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

    // 🧠 Smooth continuous stroke
    if (!this.pathStarted) {
      ctx.beginPath();
      ctx.moveTo(smoothX, smoothY);
      this.pathStarted = true;
    } else {
      ctx.lineTo(smoothX, smoothY);
      ctx.stroke();

      // continue path smoothly
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

  // 🎨 Brush controls
  setColor(color: string): void {
    this.currentOptions.color = color;
  }

  setSize(size: number): void {
    this.currentOptions.size = Math.max(1, size);
    this.ensureRenderer();
    if (this.renderer && this.renderer.set_size) {
      this.renderer.set_size(size);
    }
  }

  setOpacity(opacity: number): void {
    this.currentOptions.opacity = Math.min(1, Math.max(0, opacity));
    this.ensureRenderer();
    if (this.renderer && this.renderer.set_opacity) {
      this.renderer.set_opacity(opacity);
    }
  }

  setInvert(invert: boolean): void {
    this.currentOptions.invert = invert;
  }

  setSmoothing(value: number): void {
    if (this.renderer && this.renderer.set_smoothing) {
      this.renderer.set_smoothing(value);
    }
  }

  // 🔁 Switch brush dynamically
  setBrush(brushType: string): void {
    this.currentBrushType = brushType;
    this.renderer = createBrushEngine(brushType);
  }

  getOptions(): BrushOptions {
    return { ...this.currentOptions };
  }
}
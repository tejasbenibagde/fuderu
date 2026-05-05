// src/core/BrushEngine.ts

import type { Point, BrushOptions } from '../types';
import { createBrushEngine, WasmBrushRenderer } from '../wasm-loader';

export class BrushEngine {
  private currentBrushType = 'dip-pen-soft';
  private renderer: WasmBrushRenderer | null = null;
  private spacing = 0.25
  private currentOptions: BrushOptions = {
    color: '#000000',
    size: 10,
    opacity: 1,
    invert: false
  };
  private isDrawing: boolean = false;
  private lastPoint: Point | null = null;
  private pathStarted: boolean = false;

  startStroke(point: Point): void {
    this.isDrawing = true;
    this.lastPoint = point;
    this.pathStarted = false;

    this.ensureRenderer();
    this.renderer!.reset();
  }

  private ensureRenderer() {
    if (!this.renderer) {
      this.renderer = createBrushEngine(this.currentBrushType);
    }
  }

  drawStroke(ctx: CanvasRenderingContext2D, point: Point): void {
    if (!this.isDrawing) return;

    this.ensureRenderer();
    const renderer = this.renderer!;

    const pressure = point.pressure || 0.5;
    const speed = this.calculateSpeed(point);

    const result = renderer.process(point.x, point.y, pressure, speed);

    let smoothX = point.x;
    let smoothY = point.y;
    let brushSize = this.currentOptions.size;
    let brushOpacity = this.currentOptions.opacity;

    if (result && result.length >= 4) {
      smoothX = result[0];
      smoothY = result[1];
      brushSize = result[2];
      brushOpacity = result[3];
    }

    // Handle eraser vs draw mode
    if (this.currentOptions.invert) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = brushOpacity; 
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = brushOpacity; 
      ctx.fillStyle = this.currentOptions.color;
    }

    if (!this.lastPoint) {
      this.lastPoint = { x: smoothX, y: smoothY, pressure: point.pressure };
      return;
    }

    const dx = smoothX - this.lastPoint.x;
    const dy = smoothY - this.lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const spacing = this.spacing * brushSize;
    if (distance < spacing) return;

    const angle = Math.atan2(dy, dx);

    for (let i = 0; i < distance; i += spacing) {
      const x = this.lastPoint.x + Math.cos(angle) * i;
      const y = this.lastPoint.y + Math.sin(angle) * i;

      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    this.lastPoint = {
      x: smoothX,
      y: smoothY,
      pressure: point.pressure,
      timestamp: point.timestamp
    };
  }

  private setupContext(ctx: CanvasRenderingContext2D, opacity: number, size: number): void {
    if (this.currentOptions.invert) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = opacity;
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = opacity;
      ctx.fillStyle = this.currentOptions.color;
    }

    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private calculateSpeed(point: Point): number {
    if (!this.lastPoint) return 0;

    const now = point.timestamp || Date.now();
    const lastTimestamp = this.lastPoint.timestamp || now;
    const deltaTime = Math.max(1, now - lastTimestamp);

    const dx = point.x - this.lastPoint.x;
    const dy = point.y - this.lastPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance / deltaTime;
  }

  private drawFallback(ctx: CanvasRenderingContext2D, point: Point): void {
    this.setupContext(ctx, this.currentOptions.opacity, this.currentOptions.size);

    ctx.beginPath();
    ctx.arc(point.x, point.y, this.currentOptions.size / 2, 0, Math.PI * 2);
    ctx.fill();

    if (this.lastPoint) {
      ctx.beginPath();
      ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }

    this.lastPoint = point;
    this.pathStarted = true;
  }

  endStroke(): void {
    this.isDrawing = false;
    this.lastPoint = null;
    this.pathStarted = false;

    this.ensureRenderer();
    if (this.renderer) {
      this.renderer.reset();
    }
  }

  setColor(color: string): void {
    this.currentOptions.color = color;
  }

  setSize(size: number): void {
    this.currentOptions.size = Math.max(1, size);
    this.ensureRenderer();
    const renderer = this.renderer!;
    if (renderer && renderer.set_size) {
      renderer.set_size(size);
    }
  }

  setOpacity(opacity: number): void {
    this.currentOptions.opacity = Math.min(1, Math.max(0, opacity));

    this.ensureRenderer();
    this.renderer!.set_opacity(opacity);
  }

  setInvert(invert: boolean): void {
    this.currentOptions.invert = invert;
  }

  setBrush(brushType: string): void {
    this.currentBrushType = brushType;

    this.renderer = createBrushEngine(brushType);

    this.renderer.set_size(this.currentOptions.size);
    this.renderer.set_opacity(this.currentOptions.opacity);

    if (typeof this.currentOptions.smoothing === 'number') {
      this.renderer.set_smoothing(this.currentOptions.smoothing);
    }

  }

  setSmoothing(value: number): void {
    this.currentOptions.smoothing = value;
    this.ensureRenderer();
    const renderer = this.renderer!;
    if (renderer && renderer.set_smoothing) {
      renderer.set_smoothing(value);
    }
  }

  getOptions(): BrushOptions {
    return { ...this.currentOptions };
  }
}
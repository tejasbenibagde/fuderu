// src/core/BrushEngine.ts

import type { Point, BrushOptions } from '../types';
import { getBrushRenderer } from '../wasm-loader';

export class BrushEngine {
  private currentOptions: BrushOptions = {
    color: '#000000',
    size: 10,
    opacity: 1,
    invert: false
  };
  private isDrawing: boolean = false;
  private lastPoint: Point | null = null;
  private lastTimestamp: number = 0;
  private pathStarted: boolean = false; // Track if we've started the path
  
  startStroke(point: Point): void {
    this.isDrawing = true;
    this.lastPoint = point;
    this.lastTimestamp = point.timestamp || Date.now();
    this.pathStarted = false; // Reset path for new stroke
    
    const renderer = getBrushRenderer();
    if (renderer && renderer.reset_stroke) {
      renderer.reset_stroke();
    }
  }
  
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
    
    const renderer = getBrushRenderer();
    let finalSize = this.currentOptions.size;
    let finalOpacity = this.currentOptions.opacity;
    let smoothX = point.x;
    let smoothY = point.y;
    
    if (renderer && renderer.process_stroke) {
      try {
        const pressure = point.pressure || 0.5;
        
        // Calculate brush params using WASM
        const params = renderer.calculate_brush_params(pressure, speed);
        const parsed = typeof params === 'string' ? JSON.parse(params) : params;
        if (parsed && parsed.length >= 2) {
          finalSize = parsed[0] || this.currentOptions.size;
          finalOpacity = parsed[1] || this.currentOptions.opacity;
        }
        
        // Process point for smoothing
        const processed = renderer.process_stroke(point.x, point.y, pressure);
        const smoothed = typeof processed === 'string' ? JSON.parse(processed) : processed;
        if (smoothed && smoothed.length >= 2) {
          smoothX = smoothed[0];
          smoothY = smoothed[1];
        }
      } catch (e) {
        console.warn('WASM processing failed, using fallback:', e);
      }
    }
    
    // Apply eraser mode if invert is true
    if (this.currentOptions.invert) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = 1.0;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = finalOpacity; // Use globalAlpha for consistent opacity
      ctx.strokeStyle = this.currentOptions.color;
    }
    
    ctx.lineWidth = finalSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Start the path once, then keep adding to it
    if (!this.pathStarted) {
      ctx.beginPath();
      ctx.moveTo(smoothX, smoothY);
      this.pathStarted = true;
    } else {
      ctx.lineTo(smoothX, smoothY);
      ctx.stroke(); // This still strokes from last point
      // Reset path to continue smoothly
      ctx.beginPath();
      ctx.moveTo(smoothX, smoothY);
    }
    
    this.lastPoint = { x: smoothX, y: smoothY, pressure: point.pressure };
    this.lastTimestamp = now;
  }
  
  endStroke(): void {
    this.isDrawing = false;
    this.lastPoint = null;
    this.pathStarted = false;
  }
  
  setColor(color: string): void {
    this.currentOptions.color = color;
  }
  
  setSize(size: number): void {
    this.currentOptions.size = Math.max(1, size);
  }
  
  setOpacity(opacity: number): void {
    this.currentOptions.opacity = Math.min(1, Math.max(0, opacity));
  }
  
  setInvert(invert: boolean): void {
    this.currentOptions.invert = invert;
  }
  
  setSmoothing(value: number): void {
    const renderer = getBrushRenderer();
    if (renderer && renderer.set_smoothing) {
      renderer.set_smoothing(value);
    }
  }
  
  getOptions(): BrushOptions {
    return { ...this.currentOptions };
  }
  
  private getColorWithOpacity(color: string, opacity: number): string {
    // We're now using globalAlpha, so this method might not be needed
    // But keeping for backward compatibility
    if (color.startsWith('rgba')) {
      return color.replace(/rgba?\(([^,]+),([^,]+),([^,]+)(?:,([^)]+))?\)/, 
        `rgba($1,$2,$3,${opacity})`);
    }
    
    if (color.startsWith('#')) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    return color;
  }
}
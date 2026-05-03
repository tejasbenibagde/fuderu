// src/index.ts

import { CanvasManager } from "./core/canvasManager"
import { BrushEngine } from './core/BrushEngine';
import { initWasm } from './wasm-loader';
import type { FuderuOptions, Point } from './types';

export class Fuderu {
  private canvasManager: CanvasManager;
  private brushEngine: BrushEngine;
  private isDrawing: boolean = false;
  private wasmReady: boolean = false;
  
  constructor(options: FuderuOptions) {
    this.canvasManager = new CanvasManager(options.canvas);
    this.brushEngine = new BrushEngine();
    
    // Apply initial options if provided
    if (options.color) this.brushEngine.setColor(options.color);
    if (options.size) this.brushEngine.setSize(options.size);
    if (options.opacity) this.brushEngine.setOpacity(options.opacity);
    
    // Initialize WASM asynchronously
    this.init();
  }
  
  private async init(): Promise<void> {
    await initWasm();
    this.wasmReady = true;
    this.setupEventListeners();
    console.log('Fuderu ready with WASM brush engine! 🚀');
  }
  
  private setupEventListeners(): void {
    const canvas = this.canvasManager.getCanvas();
    
    canvas.addEventListener('mousedown', this.startDrawing.bind(this));
    canvas.addEventListener('mousemove', this.draw.bind(this));
    canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
    window.addEventListener('mouseup', this.stopDrawing.bind(this));
    
    canvas.addEventListener('touchstart', this.startDrawing.bind(this));
    canvas.addEventListener('touchmove', this.draw.bind(this));
    canvas.addEventListener('touchend', this.stopDrawing.bind(this));
  }
  
  private startDrawing(event: MouseEvent | TouchEvent): void {
    if (!this.wasmReady) return;
    
    this.isDrawing = true;
    event.preventDefault();
    
    const point = this.getPointFromEvent(event);
    this.brushEngine.startStroke(point);
    
    const ctx = this.canvasManager.getContext();
    this.brushEngine.drawStroke(ctx, point);
  }
  
  private draw(event: MouseEvent | TouchEvent): void {
    if (!this.isDrawing || !this.wasmReady) return;
    event.preventDefault();
    
    const point = this.getPointFromEvent(event);
    const ctx = this.canvasManager.getContext();
    this.brushEngine.drawStroke(ctx, point);
  }
  
  private stopDrawing(): void {
    this.isDrawing = false;
    this.brushEngine.endStroke();
  }
  
  private getPointFromEvent(event: MouseEvent | TouchEvent): Point {
    const canvas = this.canvasManager.getCanvas();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number, pressure: number = 0.5;
    let timestamp: number;
    
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
      timestamp = event.timeStamp;
    } else {
      const touch = event.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
       pressure = (touch as any).pressure || 0.5;
      timestamp = event.timeStamp;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      pressure,
      timestamp
    };
  }
  
  // Public API methods
  useBrush(brushName: string): void {
    // For now only round brush, but ready for more
    console.log(`Brush "${brushName}" selected`);
  }
  
  setColor(color: string): void {
    this.brushEngine.setColor(color);
  }
  
  setSize(size: number): void {
    this.brushEngine.setSize(size);
  }
  
  setOpacity(opacity: number): void {
    this.brushEngine.setOpacity(opacity);
  }
  
  setInvert(invert: boolean): void {
    this.brushEngine.setInvert(invert);
  }
  
  setSmoothing(value: number): void {
    this.brushEngine.setSmoothing(value);
  }
  
  clear(): void {
    this.canvasManager.clear();
  }
  
  destroy(): void {
    const canvas = this.canvasManager.getCanvas();
    canvas.removeEventListener('mousedown', this.startDrawing.bind(this));
    canvas.removeEventListener('mousemove', this.draw.bind(this));
    canvas.removeEventListener('mouseup', this.stopDrawing.bind(this));
    canvas.removeEventListener('touchstart', this.startDrawing.bind(this));
    canvas.removeEventListener('touchmove', this.draw.bind(this));
    canvas.removeEventListener('touchend', this.stopDrawing.bind(this));
  }
  
  hello(): string {
    return 'Fuderu is ready with Rust WASM! 🦀🖌️';
  }
}

export type { BrushOptions, FuderuOptions, Point } from './types';

export default Fuderu;
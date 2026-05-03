// src/core/CanvasManager.ts

export class CanvasManager {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  constructor(canvasElement: HTMLCanvasElement | string) {
    if (typeof canvasElement === 'string') {
      const element = document.querySelector(canvasElement);
      if (!element || !(element instanceof HTMLCanvasElement)) {
        throw new Error(`Canvas element not found: ${canvasElement}`);
      }
      this.canvas = element;
    } else {
      this.canvas = canvasElement;
    }
    
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get 2D context from canvas');
    }
    this.ctx = context;
  }
  
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
  
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }
  
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  setSize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
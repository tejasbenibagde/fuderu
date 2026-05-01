export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface BrushOptions {
  size: number;
  color: string;
  opacity: number;
  smoothing?: number;
}

export interface Brush {
  name: string;
  draw(ctx: CanvasRenderingContext2D, point: Point, options: BrushOptions): void;
}

export interface FuderuOptions {
  canvas: HTMLCanvasElement | string;
  brush?: string;
  smoothing?: number;
  backgroundColor?: string;
}
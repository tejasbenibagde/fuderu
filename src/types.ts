// src/types.ts

export interface Point {
  x: number;
  y: number;
  pressure?: number;
  timestamp?: number;
}

export interface BrushOptions {
  color: string;
  size: number;
  opacity: number;
  invert?: boolean; // When true, acts like eraser
  smoothing?: number;
}

export interface FuderuOptions {
  canvas: HTMLCanvasElement | string;
  brush?: string;
  color?: string;
  size?: number;
  opacity?: number;
}
// src/Layer.ts

import type { BlendMode } from "./types/layers";

export interface LayerOptions {
  id?: string;
  name?: string;
  width: number;
  height: number;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
}

export class Layer {
  public readonly id: string;
  public name: string;

  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;

  public visible: boolean;
  public opacity: number;
  public blendMode: BlendMode;

  constructor(options: LayerOptions) {
    this.id = options.id ?? crypto.randomUUID();
    this.name = options.name ?? "Layer";
    this.visible = options.visible ?? true;
    this.opacity = clampOpacity(options.opacity ?? 1);
    this.blendMode = options.blendMode ?? "source-over";

    this.canvas = document.createElement("canvas");
    this.canvas.width = options.width;
    this.canvas.height = options.height;

    const ctx = this.canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create layer context");
    }

    this.ctx = ctx;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    );

    this.canvas.width = width;
    this.canvas.height = height;

    this.ctx.putImageData(imageData, 0, 0);
  }

  setOpacity(opacity: number): void {
    this.opacity = clampOpacity(opacity);
  }
}

const clampOpacity = (opacity: number): number => {
  if (Number.isNaN(opacity)) return 1;
  return Math.min(1, Math.max(0, opacity));
};

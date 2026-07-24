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
    this.id = options.id ?? generateUUID();
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
    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = this.canvas.width;
    tempCanvas.height = this.canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (tempCtx) {
      tempCtx.drawImage(this.canvas, 0, 0);
    }

    this.canvas.width = width;
    this.canvas.height = height;

    if (tempCtx) {
      this.ctx.drawImage(tempCanvas, 0, 0);
    }
  }

  setOpacity(opacity: number): void {
    this.opacity = clampOpacity(opacity);
  }
}

const generateUUID = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const clampOpacity = (opacity: number): number => {
  if (Number.isNaN(opacity)) return 1;
  return Math.min(1, Math.max(0, opacity));
};

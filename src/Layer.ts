// src/Layer.ts

import type { BlendMode, LayerId, LayerSnapshot } from "./types/layers";

export interface LayerOptions {
  id?: LayerId;
  name?: string;
  width: number;
  height: number;
  visible?: boolean;
  opacity?: number;
  blendMode?: BlendMode;
  alphaLock?: boolean;
  locked?: boolean;
}

export class Layer {
  public readonly id: LayerId;
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;

  private _name: string;
  private _visible: boolean;
  private _opacity: number;
  private _blendMode: BlendMode;
  private _alphaLock: boolean;
  private _locked: boolean;
  private _cachedSnapshot: LayerSnapshot | null = null;

  constructor(options: LayerOptions) {
    this.id = options.id ?? generateUUID();
    this._name = options.name ?? "Layer";
    this._visible = options.visible ?? true;
    this._opacity = clampOpacity(options.opacity ?? 1);
    this._blendMode = options.blendMode ?? "source-over";
    this._alphaLock = options.alphaLock ?? false;
    this._locked = options.locked ?? false;

    this.canvas = document.createElement("canvas");
    this.canvas.width = options.width;
    this.canvas.height = options.height;

    const ctx = this.canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Could not create layer context");
    }

    this.ctx = ctx;
  }

  get name(): string {
    return this._name;
  }
  set name(value: string) {
    if (this._name !== value) {
      this._name = value;
      this.invalidateSnapshot();
    }
  }

  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    if (this._visible !== value) {
      this._visible = value;
      this.invalidateSnapshot();
    }
  }

  get opacity(): number {
    return this._opacity;
  }
  set opacity(value: number) {
    const clamped = clampOpacity(value);
    if (this._opacity !== clamped) {
      this._opacity = clamped;
      this.invalidateSnapshot();
    }
  }

  get blendMode(): BlendMode {
    return this._blendMode;
  }
  set blendMode(value: BlendMode) {
    if (this._blendMode !== value) {
      this._blendMode = value;
      this.invalidateSnapshot();
    }
  }

  get alphaLock(): boolean {
    return this._alphaLock;
  }
  set alphaLock(value: boolean) {
    if (this._alphaLock !== value) {
      this._alphaLock = value;
      this.invalidateSnapshot();
    }
  }

  get locked(): boolean {
    return this._locked;
  }
  set locked(value: boolean) {
    if (this._locked !== value) {
      this._locked = value;
      this.invalidateSnapshot();
    }
  }

  public invalidateSnapshot(): void {
    this._cachedSnapshot = null;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  resize(width: number, height: number): void {
    if (this.canvas.width === width && this.canvas.height === height) {
      return;
    }

    this.invalidateSnapshot();

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
    this.opacity = opacity;
  }

  toSnapshot(): LayerSnapshot {
    if (!this._cachedSnapshot) {
      this._cachedSnapshot = Object.freeze({
        id: this.id,
        name: this._name,
        visible: this._visible,
        opacity: this._opacity,
        blendMode: this._blendMode,
        alphaLock: this._alphaLock,
        locked: this._locked,
        width: this.canvas.width,
        height: this.canvas.height,
      });
    }
    return this._cachedSnapshot;
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

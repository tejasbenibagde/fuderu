// src/Selection.ts

import type {
  SelectionMode,
  SelectionType,
  SelectionBounds,
  SelectionPoint,
  SelectionSnapshot,
  SelectionOutlineOptions,
} from "./types/selection";

export class Selection {
  public width: number;
  public height: number;

  private maskCanvas: HTMLCanvasElement;
  private maskCtx: CanvasRenderingContext2D;

  private _active: boolean = false;
  private _bounds: SelectionBounds | null = null;
  private _lastShape: {
    type: SelectionType;
    points?: SelectionPoint[];
    rect?: { x: number; y: number; width: number; height: number };
    ellipse?: {
      cx: number;
      cy: number;
      radiusX: number;
      radiusY: number;
      rotation: number;
    };
  } | null = null;

  public onSelectionChange?: (snapshot: SelectionSnapshot) => void;

  constructor(width: number, height: number) {
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));

    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = this.width;
    this.maskCanvas.height = this.height;

    const ctx = this.maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      throw new Error("Could not create 2D context for selection mask");
    }
    this.maskCtx = ctx;
  }

  public isActive(): boolean {
    return this._active;
  }

  public getBounds(): SelectionBounds | null {
    if (!this._active || !this._bounds) return null;
    return { ...this._bounds };
  }

  public getMaskCanvas(): HTMLCanvasElement {
    return this.maskCanvas;
  }

  public getSnapshot(): SelectionSnapshot {
    return Object.freeze({
      active: this._active,
      bounds: this.getBounds(),
      lastShapeType: this._lastShape?.type,
    });
  }

  public resize(width: number, height: number): void {
    const newWidth = Math.max(1, Math.round(width));
    const newHeight = Math.max(1, Math.round(height));
    if (newWidth === this.width && newHeight === this.height) return;

    const oldCanvas = this.maskCanvas;
    this.width = newWidth;
    this.height = newHeight;

    this.maskCanvas = document.createElement("canvas");
    this.maskCanvas.width = newWidth;
    this.maskCanvas.height = newHeight;

    const ctx = this.maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Could not create 2D context for selection mask");
    this.maskCtx = ctx;

    if (this._active) {
      this.maskCtx.drawImage(oldCanvas, 0, 0);
      this.recomputeBounds();
    }
  }

  private applyCompositeMode(mode: SelectionMode): void {
    switch (mode) {
      case "replace":
        this.maskCtx.clearRect(0, 0, this.width, this.height);
        this.maskCtx.globalCompositeOperation = "source-over";
        break;
      case "add":
        this.maskCtx.globalCompositeOperation = "source-over";
        break;
      case "subtract":
        this.maskCtx.globalCompositeOperation = "destination-out";
        break;
      case "intersect":
        this.maskCtx.globalCompositeOperation = "destination-in";
        break;
    }
  }

  public selectRectangle(
    x: number,
    y: number,
    width: number,
    height: number,
    mode: SelectionMode = "replace",
  ): void {
    const rx = Math.min(x, x + width);
    const ry = Math.min(y, y + height);
    const rw = Math.abs(width);
    const rh = Math.abs(height);

    if (rw <= 0 || rh <= 0) {
      if (mode === "replace") {
        this.clear();
      }
      return;
    }

    this.applyCompositeMode(mode);

    this.maskCtx.fillStyle = "#ffffff";
    this.maskCtx.fillRect(rx, ry, rw, rh);
    this.maskCtx.globalCompositeOperation = "source-over";

    if (mode === "replace") {
      this._active = true;
      this._bounds = {
        x: Math.max(0, Math.floor(rx)),
        y: Math.max(0, Math.floor(ry)),
        width: Math.min(this.width - rx, Math.ceil(rw)),
        height: Math.min(this.height - ry, Math.ceil(rh)),
      };
      this._lastShape = {
        type: "rectangle",
        rect: { x: rx, y: ry, width: rw, height: rh },
      };
    } else {
      this._lastShape = { type: "custom" };
      this.recomputeBounds();
    }

    this.emitChange();
  }

  public selectEllipse(
    cx: number,
    cy: number,
    radiusX: number,
    radiusY: number,
    rotation: number = 0,
    mode: SelectionMode = "replace",
  ): void {
    const rx = Math.abs(radiusX);
    const ry = Math.abs(radiusY);

    if (rx <= 0 || ry <= 0) {
      if (mode === "replace") {
        this.clear();
      }
      return;
    }

    this.applyCompositeMode(mode);

    this.maskCtx.fillStyle = "#ffffff";
    this.maskCtx.beginPath();
    this.maskCtx.ellipse(cx, cy, rx, ry, rotation, 0, Math.PI * 2);
    this.maskCtx.fill();
    this.maskCtx.globalCompositeOperation = "source-over";

    if (mode === "replace") {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const extentX = Math.hypot(rx * cos, ry * sin);
      const extentY = Math.hypot(rx * sin, ry * cos);

      const minX = Math.max(0, Math.floor(cx - extentX));
      const minY = Math.max(0, Math.floor(cy - extentY));
      const maxX = Math.min(this.width, Math.ceil(cx + extentX));
      const maxY = Math.min(this.height, Math.ceil(cy + extentY));

      this._active = true;
      this._bounds = {
        x: minX,
        y: minY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
      };
      this._lastShape = {
        type: "ellipse",
        ellipse: { cx, cy, radiusX: rx, radiusY: ry, rotation },
      };
    } else {
      this._lastShape = { type: "custom" };
      this.recomputeBounds();
    }

    this.emitChange();
  }

  public selectLasso(
    points: SelectionPoint[],
    mode: SelectionMode = "replace",
  ): void {
    if (!points || points.length < 3) {
      if (mode === "replace") {
        this.clear();
      }
      return;
    }

    this.applyCompositeMode(mode);

    this.maskCtx.fillStyle = "#ffffff";
    this.maskCtx.beginPath();
    this.maskCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.maskCtx.lineTo(points[i].x, points[i].y);
    }
    this.maskCtx.closePath();
    this.maskCtx.fill();
    this.maskCtx.globalCompositeOperation = "source-over";

    if (mode === "replace") {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
      this._active = true;
      this._bounds = {
        x: Math.max(0, Math.floor(minX)),
        y: Math.max(0, Math.floor(minY)),
        width: Math.max(1, Math.min(this.width - minX, Math.ceil(maxX - minX))),
        height: Math.max(
          1,
          Math.min(this.height - minY, Math.ceil(maxY - minY)),
        ),
      };
      this._lastShape = {
        type: "lasso",
        points: points.map((p) => ({ x: p.x, y: p.y })),
      };
    } else {
      this._lastShape = { type: "custom" };
      this.recomputeBounds();
    }

    this.emitChange();
  }

  public selectAll(): void {
    this.maskCtx.clearRect(0, 0, this.width, this.height);
    this.maskCtx.globalCompositeOperation = "source-over";
    this.maskCtx.fillStyle = "#ffffff";
    this.maskCtx.fillRect(0, 0, this.width, this.height);

    this._active = true;
    this._bounds = { x: 0, y: 0, width: this.width, height: this.height };
    this._lastShape = {
      type: "all",
      rect: { x: 0, y: 0, width: this.width, height: this.height },
    };

    this.emitChange();
  }

  public clear(): void {
    this.maskCtx.clearRect(0, 0, this.width, this.height);
    this._active = false;
    this._bounds = null;
    this._lastShape = null;

    this.emitChange();
  }

  public deselect(): void {
    this.clear();
  }

  public invert(): void {
    if (!this._active) {
      this.selectAll();
      return;
    }

    const imgData = this.maskCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const invAlpha = 255 - data[i + 3];
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = invAlpha;
    }
    this.maskCtx.putImageData(imgData, 0, 0);

    this._lastShape = { type: "custom" };
    this.recomputeBounds();
    this.emitChange();
  }

  public containsPoint(x: number, y: number): boolean {
    if (!this._active || !this._bounds) return false;

    if (
      x < this._bounds.x ||
      y < this._bounds.y ||
      x > this._bounds.x + this._bounds.width ||
      y > this._bounds.y + this._bounds.height
    ) {
      return false;
    }

    const px = Math.floor(x);
    const py = Math.floor(y);
    if (px < 0 || py < 0 || px >= this.width || py >= this.height) return false;

    const data = this.maskCtx.getImageData(px, py, 1, 1).data;
    return data[3] > 128;
  }

  public isPixelSelected(x: number, y: number): boolean {
    return this.containsPoint(x, y);
  }

  public recomputeBounds(): void {
    const imgData = this.maskCtx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let hasPixel = false;

    for (let y = 0; y < this.height; y++) {
      const rowOffset = y * this.width * 4;
      for (let x = 0; x < this.width; x++) {
        const alpha = data[rowOffset + x * 4 + 3];
        if (alpha > 0) {
          hasPixel = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasPixel) {
      this._active = false;
      this._bounds = null;
      this._lastShape = null;
    } else {
      this._active = true;
      this._bounds = {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      };
    }
  }

  public renderOutline(
    ctx: CanvasRenderingContext2D,
    options?: SelectionOutlineOptions,
  ): void {
    if (!this._active) return;

    const strokeStyle = options?.strokeStyle ?? "#000000";
    const secondaryStrokeStyle = options?.secondaryStrokeStyle ?? "#ffffff";
    const lineWidth = options?.lineWidth ?? 1;
    const dashPattern = options?.dashPattern ?? [4, 4];
    const dashOffset = options?.dashOffset ?? 0;

    ctx.save();
    ctx.lineWidth = lineWidth;

    const drawDashedShape = () => {
      if (this._lastShape?.type === "rectangle" && this._lastShape.rect) {
        const r = this._lastShape.rect;
        ctx.strokeRect(r.x, r.y, r.width, r.height);
      } else if (
        this._lastShape?.type === "ellipse" &&
        this._lastShape.ellipse
      ) {
        const e = this._lastShape.ellipse;
        ctx.beginPath();
        ctx.ellipse(
          e.cx,
          e.cy,
          e.radiusX,
          e.radiusY,
          e.rotation,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      } else if (this._lastShape?.type === "lasso" && this._lastShape.points) {
        const pts = this._lastShape.points;
        if (pts.length > 0) {
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
          }
          ctx.closePath();
          ctx.stroke();
        }
      } else if (this._bounds) {
        // Fallback or complex selection outline
        ctx.strokeRect(
          this._bounds.x,
          this._bounds.y,
          this._bounds.width,
          this._bounds.height,
        );
      }
    };

    // Primary stroke (e.g. black marching dash)
    ctx.strokeStyle = strokeStyle;
    ctx.setLineDash(dashPattern);
    ctx.lineDashOffset = dashOffset;
    drawDashedShape();

    // Dual-tone marching ants: secondary stroke (e.g. white alternating dash)
    ctx.strokeStyle = secondaryStrokeStyle;
    ctx.lineDashOffset = dashOffset + (dashPattern[0] || 4);
    drawDashedShape();

    ctx.restore();
  }

  public applyClipping(ctx: CanvasRenderingContext2D): void {
    if (!this._active) return;

    if (this._lastShape?.type === "rectangle" && this._lastShape.rect) {
      const r = this._lastShape.rect;
      ctx.beginPath();
      ctx.rect(r.x, r.y, r.width, r.height);
      ctx.clip();
    } else if (this._lastShape?.type === "ellipse" && this._lastShape.ellipse) {
      const e = this._lastShape.ellipse;
      ctx.beginPath();
      ctx.ellipse(e.cx, e.cy, e.radiusX, e.radiusY, e.rotation, 0, Math.PI * 2);
      ctx.clip();
    } else if (this._lastShape?.type === "lasso" && this._lastShape.points) {
      const pts = this._lastShape.points;
      if (pts.length > 0) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.clip();
      }
    } else if (this._bounds) {
      ctx.beginPath();
      ctx.rect(
        this._bounds.x,
        this._bounds.y,
        this._bounds.width,
        this._bounds.height,
      );
      ctx.clip();
    }
  }

  public clipCanvas(
    _targetCanvas: HTMLCanvasElement,
    targetCtx: CanvasRenderingContext2D,
  ): void {
    if (!this._active) return;
    const prevGco = targetCtx.globalCompositeOperation;
    targetCtx.globalCompositeOperation = "destination-in";
    targetCtx.drawImage(this.maskCanvas, 0, 0);
    targetCtx.globalCompositeOperation = prevGco;
  }

  private emitChange(): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.getSnapshot());
    }
  }
}

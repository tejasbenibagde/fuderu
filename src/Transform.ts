// src/Transform.ts

import type { Layer } from "./Layer";
import type { Selection } from "./Selection";
import type {
  Point2D,
  TransformBounds,
  TransformBoxOptions,
  TransformHandle,
  TransformOptions,
  TransformSnapshot,
} from "./types/transform";

/**
 * Manages an active floating transformation session on a layer or active selection.
 */
export class TransformSession {
  public readonly layerId: string;
  public readonly isSelection: boolean;
  public readonly sourceBounds: TransformBounds;

  public translation: Point2D = { x: 0, y: 0 };
  public scale: Point2D = { x: 1, y: 1 };
  public rotation: number = 0; // in radians
  public origin: Point2D; // pivot point in canvas coords

  private floatingCanvas: HTMLCanvasElement;
  private floatingMask: HTMLCanvasElement | null = null;
  private layerBeforeData: ImageData;
  private active: boolean = true;

  constructor(layer: Layer, selection?: Selection | null) {
    this.layerId = layer.id;
    const layerCtx = layer.canvas.getContext("2d");
    if (!layerCtx) {
      throw new Error(`Failed to get 2D context for layer "${layer.id}"`);
    }

    const docW = layer.canvas.width;
    const docH = layer.canvas.height;
    this.layerBeforeData = layerCtx.getImageData(0, 0, docW, docH);

    const hasSelection = !!(selection && selection.isActive());
    this.isSelection = hasSelection;

    if (hasSelection && selection) {
      const sb = selection.getBounds();
      if (!sb || sb.width <= 0 || sb.height <= 0) {
        throw new Error("Cannot transform empty selection");
      }
      this.sourceBounds = { ...sb };
    } else {
      // Find non-empty bounding box on layer
      const aabb = this.calculateLayerAABB(layerCtx, docW, docH);
      this.sourceBounds = aabb ?? { x: 0, y: 0, width: docW, height: docH };
    }

    this.origin = {
      x: this.sourceBounds.x + this.sourceBounds.width / 2,
      y: this.sourceBounds.y + this.sourceBounds.height / 2,
    };

    // Extract lifted content into floating canvas
    this.floatingCanvas = document.createElement("canvas");
    this.floatingCanvas.width = Math.max(1, this.sourceBounds.width);
    this.floatingCanvas.height = Math.max(1, this.sourceBounds.height);
    const floatCtx = this.floatingCanvas.getContext("2d");
    if (!floatCtx) {
      throw new Error("Failed to create floating transform canvas context");
    }

    floatCtx.drawImage(
      layer.canvas,
      this.sourceBounds.x,
      this.sourceBounds.y,
      this.sourceBounds.width,
      this.sourceBounds.height,
      0,
      0,
      this.sourceBounds.width,
      this.sourceBounds.height,
    );

    if (hasSelection && selection) {
      // Clip floating content strictly to selection mask
      floatCtx.save();
      floatCtx.globalCompositeOperation = "destination-in";
      floatCtx.drawImage(
        selection.getMaskCanvas(),
        -this.sourceBounds.x,
        -this.sourceBounds.y,
      );
      floatCtx.restore();

      // Store floating selection mask
      this.floatingMask = document.createElement("canvas");
      this.floatingMask.width = Math.max(1, this.sourceBounds.width);
      this.floatingMask.height = Math.max(1, this.sourceBounds.height);
      const maskCtx = this.floatingMask.getContext("2d");
      if (maskCtx) {
        maskCtx.drawImage(
          selection.getMaskCanvas(),
          -this.sourceBounds.x,
          -this.sourceBounds.y,
        );
      }

      // Erase original lifted region from layer
      layerCtx.save();
      layerCtx.globalCompositeOperation = "destination-out";
      layerCtx.drawImage(selection.getMaskCanvas(), 0, 0);
      layerCtx.restore();
    } else {
      // Erase original region from layer
      layerCtx.clearRect(
        this.sourceBounds.x,
        this.sourceBounds.y,
        this.sourceBounds.width,
        this.sourceBounds.height,
      );
    }
  }

  private calculateLayerAABB(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
  ): TransformBounds | null {
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    let minX = w;
    let minY = h;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3];
        if (alpha > 0) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < minX || maxY < minY) {
      return null;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    };
  }

  public isActive(): boolean {
    return this.active;
  }

  public translate(dx: number, dy: number): void {
    this.translation.x += dx;
    this.translation.y += dy;
  }

  public setTranslation(x: number, y: number): void {
    this.translation.x = x;
    this.translation.y = y;
  }

  public rotate(angleRad: number): void {
    this.rotation = (this.rotation + angleRad) % (Math.PI * 2);
  }

  public setRotation(angleRad: number): void {
    this.rotation = angleRad;
  }

  public scaleBy(sx: number, sy: number): void {
    this.scale.x *= sx;
    this.scale.y *= sy;
  }

  public setScale(sx: number, sy: number): void {
    this.scale.x = sx;
    this.scale.y = sy;
  }

  public flipHorizontal(): void {
    this.scale.x *= -1;
  }

  public flipVertical(): void {
    this.scale.y *= -1;
  }

  public setOrigin(x: number, y: number): void {
    this.origin.x = x;
    this.origin.y = y;
  }

  public reset(): void {
    this.translation = { x: 0, y: 0 };
    this.scale = { x: 1, y: 1 };
    this.rotation = 0;
    this.origin = {
      x: this.sourceBounds.x + this.sourceBounds.width / 2,
      y: this.sourceBounds.y + this.sourceBounds.height / 2,
    };
  }

  public applyOptions(options: TransformOptions): void {
    if (options.translation) {
      if (options.translation.x !== undefined)
        this.translation.x = options.translation.x;
      if (options.translation.y !== undefined)
        this.translation.y = options.translation.y;
    }
    if (options.rotation !== undefined) {
      this.rotation = options.rotation;
    }
    if (options.scale) {
      if (options.scale.x !== undefined) this.scale.x = options.scale.x;
      if (options.scale.y !== undefined) this.scale.y = options.scale.y;
    }
    if (options.origin) {
      if (options.origin.x !== undefined) this.origin.x = options.origin.x;
      if (options.origin.y !== undefined) this.origin.y = options.origin.y;
    }
    if (options.flipX) {
      this.flipHorizontal();
    }
    if (options.flipY) {
      this.flipVertical();
    }
  }

  /**
   * Transforms a 2D point from source space to transformed canvas space.
   */
  public transformPoint(px: number, py: number): Point2D {
    // Relative to pivot
    const relX = (px - this.origin.x) * this.scale.x;
    const relY = (py - this.origin.y) * this.scale.y;

    // Rotate
    const cos = Math.cos(this.rotation);
    const sin = Math.sin(this.rotation);
    const rotX = relX * cos - relY * sin;
    const rotY = relX * sin + relY * cos;

    // Translate back to origin + translation
    return {
      x: rotX + this.origin.x + this.translation.x,
      y: rotY + this.origin.y + this.translation.y,
    };
  }

  /**
   * Returns the 4 transformed corner points [TopLeft, TopRight, BottomRight, BottomLeft].
   */
  public getCorners(): readonly [Point2D, Point2D, Point2D, Point2D] {
    const x1 = this.sourceBounds.x;
    const y1 = this.sourceBounds.y;
    const x2 = x1 + this.sourceBounds.width;
    const y2 = y1 + this.sourceBounds.height;

    return [
      this.transformPoint(x1, y1),
      this.transformPoint(x2, y1),
      this.transformPoint(x2, y2),
      this.transformPoint(x1, y2),
    ];
  }

  public getCenter(): Point2D {
    return this.transformPoint(
      this.sourceBounds.x + this.sourceBounds.width / 2,
      this.sourceBounds.y + this.sourceBounds.height / 2,
    );
  }

  /**
   * Returns the axis-aligned bounding box (AABB) of the transformed content.
   */
  public getAABB(): TransformBounds {
    const corners = this.getCorners();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const c of corners) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }

    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      width: Math.ceil(maxX - minX),
      height: Math.ceil(maxY - minY),
    };
  }

  /**
   * Returns interactive handle locations in transformed canvas coordinates.
   */
  public getHandles(options?: TransformBoxOptions): TransformHandle[] {
    const corners = this.getCorners();
    const [tl, tr, br, bl] = corners;

    const topMid = { x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2 };
    const rightMid = { x: (tr.x + br.x) / 2, y: (tr.y + br.y) / 2 };
    const bottomMid = { x: (bl.x + br.x) / 2, y: (bl.y + br.y) / 2 };
    const leftMid = { x: (tl.x + bl.x) / 2, y: (tl.y + bl.y) / 2 };

    const rotatorDistance = options?.rotatorDistance ?? 24;
    // Normal vector pointing "up" from topMid along rotation angle
    const normX = Math.sin(this.rotation) * (this.scale.y >= 0 ? -1 : 1);
    const normY = -Math.cos(this.rotation) * (this.scale.y >= 0 ? -1 : 1);

    const rotator: Point2D = {
      x: topMid.x - normX * rotatorDistance,
      y: topMid.y - normY * rotatorDistance,
    };

    const pivot = this.transformPoint(this.origin.x, this.origin.y);

    return [
      { type: "top-left", x: tl.x, y: tl.y },
      { type: "top-right", x: tr.x, y: tr.y },
      { type: "bottom-right", x: br.x, y: br.y },
      { type: "bottom-left", x: bl.x, y: bl.y },
      { type: "top", x: topMid.x, y: topMid.y },
      { type: "right", x: rightMid.x, y: rightMid.y },
      { type: "bottom", x: bottomMid.x, y: bottomMid.y },
      { type: "left", x: leftMid.x, y: leftMid.y },
      { type: "rotator", x: rotator.x, y: rotator.y },
      { type: "pivot", x: pivot.x, y: pivot.y },
    ];
  }

  /**
   * Renders the floating transformed pixels and optional interactive transformation box.
   */
  public render(
    ctx: CanvasRenderingContext2D,
    renderHandles = false,
    options?: TransformBoxOptions,
  ): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(
      this.origin.x + this.translation.x,
      this.origin.y + this.translation.y,
    );
    ctx.rotate(this.rotation);
    ctx.scale(this.scale.x, this.scale.y);

    ctx.drawImage(
      this.floatingCanvas,
      this.sourceBounds.x - this.origin.x,
      this.sourceBounds.y - this.origin.y,
    );
    ctx.restore();

    if (renderHandles) {
      this.renderTransformBox(ctx, options);
    }
  }

  /**
   * Renders the bounding polygon, rotator stem, and interactive handles.
   */
  public renderTransformBox(
    ctx: CanvasRenderingContext2D,
    options?: TransformBoxOptions,
  ): void {
    const corners = this.getCorners();
    const [tl, tr, br, bl] = corners;
    const topMid = { x: (tl.x + tr.x) / 2, y: (tl.y + tr.y) / 2 };

    const handleSize = options?.handleSize ?? 8;
    const handleColor = options?.handleColor ?? "#ffffff";
    const handleStrokeColor = options?.handleStrokeColor ?? "#0088ff";
    const boxColor = options?.boxColor ?? "#0088ff";
    const lineWidth = options?.lineWidth ?? 1.5;
    const showPivot = options?.showPivot ?? true;

    ctx.save();

    // 1. Draw polygon bounding box
    ctx.strokeStyle = boxColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(tl.x, tl.y);
    ctx.lineTo(tr.x, tr.y);
    ctx.lineTo(br.x, br.y);
    ctx.lineTo(bl.x, bl.y);
    ctx.closePath();
    ctx.stroke();

    // 2. Draw stem line to rotator
    const handles = this.getHandles(options);
    const rotator = handles.find((h) => h.type === "rotator");
    if (rotator) {
      ctx.beginPath();
      ctx.moveTo(topMid.x, topMid.y);
      ctx.lineTo(rotator.x, rotator.y);
      ctx.stroke();

      // Draw rotator circle
      ctx.fillStyle = handleColor;
      ctx.strokeStyle = handleStrokeColor;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(rotator.x, rotator.y, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Draw square handles
    const squareHandles = handles.filter(
      (h) => h.type !== "rotator" && h.type !== "pivot",
    );
    ctx.fillStyle = handleColor;
    ctx.strokeStyle = handleStrokeColor;
    ctx.lineWidth = lineWidth;

    for (const h of squareHandles) {
      const half = handleSize / 2;
      ctx.fillRect(h.x - half, h.y - half, handleSize, handleSize);
      ctx.strokeRect(h.x - half, h.y - half, handleSize, handleSize);
    }

    // 4. Draw pivot crosshair
    if (showPivot) {
      const pivot = handles.find((h) => h.type === "pivot");
      if (pivot) {
        const pSize = handleSize * 0.8;
        ctx.strokeStyle = handleStrokeColor;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, pSize, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pivot.x - pSize - 2, pivot.y);
        ctx.lineTo(pivot.x + pSize + 2, pivot.y);
        ctx.moveTo(pivot.x, pivot.y - pSize - 2);
        ctx.lineTo(pivot.x, pivot.y + pSize + 2);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Commits the transformation onto the layer and updates selection mask if applicable.
   * Returns the before and after image data for the history patch.
   */
  public commit(
    layer: Layer,
    selection?: Selection | null,
  ): {
    beforeData: ImageData;
    afterData: ImageData;
    patchBounds: TransformBounds;
  } {
    if (!this.active) {
      throw new Error("TransformSession is not active");
    }

    const layerCtx = layer.canvas.getContext("2d");
    if (!layerCtx) {
      throw new Error("Failed to get target layer 2D context");
    }

    // 1. Draw transformed content onto layer canvas
    layerCtx.save();
    if (layer.alphaLock) {
      layerCtx.globalCompositeOperation = "source-atop";
    }
    layerCtx.translate(
      this.origin.x + this.translation.x,
      this.origin.y + this.translation.y,
    );
    layerCtx.rotate(this.rotation);
    layerCtx.scale(this.scale.x, this.scale.y);

    layerCtx.drawImage(
      this.floatingCanvas,
      this.sourceBounds.x - this.origin.x,
      this.sourceBounds.y - this.origin.y,
    );
    layerCtx.restore();

    // 2. If selection was active, transform the selection mask
    const aabb = this.getAABB();
    if (this.isSelection && selection && this.floatingMask) {
      const maskCanvas = selection.getMaskCanvas();
      const maskCtx = maskCanvas.getContext("2d");
      if (maskCtx) {
        maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.save();
        maskCtx.translate(
          this.origin.x + this.translation.x,
          this.origin.y + this.translation.y,
        );
        maskCtx.rotate(this.rotation);
        maskCtx.scale(this.scale.x, this.scale.y);

        maskCtx.drawImage(
          this.floatingMask,
          this.sourceBounds.x - this.origin.x,
          this.sourceBounds.y - this.origin.y,
        );
        maskCtx.restore();

        selection.setTransformedMask(maskCanvas, aabb);
      }
    }

    // 3. Compute patch bounds encompassing both initial source and transformed bounds
    const minX = Math.max(0, Math.min(this.sourceBounds.x, aabb.x));
    const minY = Math.max(0, Math.min(this.sourceBounds.y, aabb.y));
    const maxX = Math.min(
      layer.canvas.width,
      Math.max(
        this.sourceBounds.x + this.sourceBounds.width,
        aabb.x + aabb.width,
      ),
    );
    const maxY = Math.min(
      layer.canvas.height,
      Math.max(
        this.sourceBounds.y + this.sourceBounds.height,
        aabb.y + aabb.height,
      ),
    );

    const patchW = Math.max(1, maxX - minX);
    const patchH = Math.max(1, maxY - minY);

    // Extract before and after for history patch
    const beforeCanvas = document.createElement("canvas");
    beforeCanvas.width = layer.canvas.width;
    beforeCanvas.height = layer.canvas.height;
    const bCtx = beforeCanvas.getContext("2d");
    if (bCtx) {
      bCtx.putImageData(this.layerBeforeData, 0, 0);
    }
    const beforeData = bCtx
      ? bCtx.getImageData(minX, minY, patchW, patchH)
      : this.layerBeforeData;

    const afterData = layerCtx.getImageData(minX, minY, patchW, patchH);

    this.active = false;

    return {
      beforeData,
      afterData,
      patchBounds: {
        x: minX,
        y: minY,
        width: patchW,
        height: patchH,
      },
    };
  }

  /**
   * Cancels the transform session and restores the layer pixels.
   */
  public cancel(layer: Layer): void {
    if (!this.active) return;

    const layerCtx = layer.canvas.getContext("2d");
    if (layerCtx) {
      layerCtx.putImageData(this.layerBeforeData, 0, 0);
    }

    this.active = false;
  }

  public getSnapshot(): TransformSnapshot {
    return Object.freeze({
      active: this.active,
      layerId: this.layerId,
      isSelection: this.isSelection,
      sourceBounds: { ...this.sourceBounds },
      translation: { ...this.translation },
      scale: { ...this.scale },
      rotation: this.rotation,
      origin: { ...this.origin },
      corners: this.getCorners(),
      center: this.getCenter(),
    });
  }
}

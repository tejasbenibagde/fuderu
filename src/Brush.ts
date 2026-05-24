// src/Brush.ts
// Important Note:- Some of the heavy tasks ma be moved in different language like Rust for faster performance in later versions

import { BrushBasicConfig, BrushConfig } from "./types/config";
import { Module } from "./types/modules";
import { PurePoint, Point, PointCallBack } from "./types/point";
import { getControlPoint, getEquidistantBezierPoints } from "./utils/bezier";
import { toHashColor } from "./utils/color";
import { getAngle, getDistance } from "./utils/math";
import { calculateRotation } from "./utils/rotation";

const createCanvas = (
  width: number = 0,
  height: number = 0,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};
const getContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  return canvas.getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D;
};

const defaultBasicConfig: BrushBasicConfig = {
  size: 20,
  opacity: 1.0,
  flow: 1.0,
  color: "#000000",
  angle: 0.0,
  roundness: 1.0,
  spacing: 0.5,
};

/**
 * Basic brush object
 *
 * @param canvas Canvas Element (If not, please use loadContext to load it later)
 * @param config Brush Config (If not, please access the config property later or use the loadConfig function to modify it)
 */
export class Brush {
  /***********************************Undo/Redo**********************************/
  private canvasStack: ImageData[] = [];
  private canvasStackIndex: number = -1;
  /**
   * Maximum number of undo/redo operations (0 means no limit)
   */
  maxUndoRedoStackSize: number = 10;
  private initCanvasStack() {
    this.canvasStack = [];
    this.canvasStackIndex = -1;
    if (this.maxUndoRedoStackSize <= 0) {
      return;
    }
    if (this.oriCanvas && this.oriContext) {
      this.canvasStack.push(
        this.oriContext.getImageData(
          0,
          0,
          this.oriCanvas.width,
          this.oriCanvas.height,
        ),
      );
      this.canvasStackIndex++;
    }
  }
  /**
   * Undo
   */
  undo() {
    if (this.canvasStackIndex > 0) {
      this.canvasStackIndex--;
      this.context?.putImageData(this.canvasStack[this.canvasStackIndex], 0, 0);
      this.oriContext?.putImageData(
        this.canvasStack[this.canvasStackIndex],
        0,
        0,
      );
    }
  }
  /**
   * Redo
   */
  redo() {
    if (this.canvasStackIndex < this.canvasStack.length - 1) {
      this.canvasStackIndex++;
      this.context?.putImageData(this.canvasStack[this.canvasStackIndex], 0, 0);
      this.oriContext?.putImageData(
        this.canvasStack[this.canvasStackIndex],
        0,
        0,
      );
    }
  }
  /******************************************************************************/

  /***********************************canvas*************************************/
  // Source Canvas
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  // Original Content Canvas
  private oriCanvas?: HTMLCanvasElement;
  private oriContext?: CanvasRenderingContext2D;
  // Current Draw Canvas
  private strokeCanvas?: HTMLCanvasElement;
  private strokeContext?: CanvasRenderingContext2D;
  // Transfer Canvas
  private transferCanvas?: HTMLCanvasElement;
  private transferContext?: CanvasRenderingContext2D;
  // Shape Canvas
  private shapeCanvas?: HTMLCanvasElement;
  private shapeContext?: CanvasRenderingContext2D;

  // Rotation
  private previousRotationAngle: number = 0;
  private lastProcessedPointForRotation?: PurePoint;

  // Stroke history for retroactive redraw
  // First-point rotation patch
  private _pendingFirstPointIndex?: number;
  // Stroke history for retroactive redraw
  private strokeHistory: Point[] = [];

  private initSourceCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = getContext(this.canvas);
  }

  private initOriCanvas(canvas: HTMLCanvasElement) {
    this.oriCanvas = createCanvas(canvas.width, canvas.height);
    this.oriContext = getContext(this.oriCanvas);
    this.oriContext.drawImage(canvas, 0, 0, canvas.width, canvas.height);
  }

  private initStrokeCanvas(canvas: HTMLCanvasElement) {
    this.strokeCanvas = createCanvas(canvas.width, canvas.height);
    this.strokeContext = getContext(this.strokeCanvas);
  }

  private initTransferCanvasCanvas(canvas: HTMLCanvasElement) {
    this.transferCanvas = createCanvas(canvas.width, canvas.height);
    this.transferContext = getContext(this.transferCanvas);
  }

  /**
   * Load the canvas you want to draw
   * @param canvas
   */
  loadContext(canvas: HTMLCanvasElement) {
    this.initSourceCanvas(canvas);
    this.initOriCanvas(canvas);
    this.initStrokeCanvas(canvas);
    this.initTransferCanvasCanvas(canvas);
    this.initCanvasStack();
  }
  /******************************************************************************/

  private points: Point[] = [];
  private drawCount: number = 0;

  private prePoint?: PurePoint;
  private prePrePoint?: PurePoint;

  private isRender: boolean = false;

  private modules: Map<string, Module> = new Map();

  /** min space pixel */
  private readonly minSpacePixel: number = 0.5;
  /** min render interval */
  private readonly maxPointsPerFrame: number = 3000;
  /** lag distance */
  private readonly lagDistance: number = 5;

  private get shapeRatio(): number {
    if (this.shapeCanvas) {
      return this.shapeCanvas.width / this.shapeCanvas.height;
    } else {
      return 1;
    }
  }

  /** Brush Config */
  config: BrushBasicConfig = { ...defaultBasicConfig };
  /** Is curve smoothing enabled (default: true) */
  isSmooth: boolean = true;
  /** Is interpolation filling enabled (default: true) */
  isSpacing: boolean = true;
  /** Blend Mode (default: 'source-over') */
  blendMode: CanvasRenderingContext2D["globalCompositeOperation"] =
    "source-over";
  /** Filter (default: 'none') */
  filter: CanvasRenderingContext2D["filter"] = "none";

  private assertCanvasReady(): void {
    if (
      !this.canvas ||
      !this.context ||
      !this.oriCanvas ||
      !this.oriContext ||
      !this.strokeCanvas ||
      !this.strokeContext ||
      !this.transferCanvas ||
      !this.transferContext
    ) {
      throw new Error('Canvas not loaded, please use "loadContext" to load it');
    }
  }

  private processPoint(x: number, y: number, pressure: number) {
    let handled = false;

    for (const [, module] of this.modules) {
      if (!module.onChangePoint) continue;

      const result = module.onChangePoint(
        { x, y, pressure },
        { ...this.config },
      );

      const points = Array.isArray(result) ? result : [result];

      for (const point of points) {
        let rotation = this.config.angle * Math.PI * 2;

        if (this.config.rotation) {
          if (!this.lastProcessedPointForRotation) {
            rotation += this.config.rotation.offset ?? 0;

            this._pendingFirstPointIndex = this.points.length;
          } else {
            // Patch the first point's rotation now
            // that we know the real direction
            if (this._pendingFirstPointIndex !== undefined) {
              const firstPt = this.points[this._pendingFirstPointIndex];

              if (firstPt) {
                const realAngle =
                  Math.atan2(
                    point.y - this.lastProcessedPointForRotation.y,
                    point.x - this.lastProcessedPointForRotation.x,
                  ) + (this.config.rotation.offset ?? 0);

                firstPt.rotation = realAngle;
              }

              this._pendingFirstPointIndex = undefined;
            }

            rotation = calculateRotation(
              this.lastProcessedPointForRotation.x,
              this.lastProcessedPointForRotation.y,
              point.x,
              point.y,
              this.config.rotation,
              this.previousRotationAngle,
            );
          }

          this.previousRotationAngle = rotation;
        }

        this.lastProcessedPointForRotation = {
          x: point.x,
          y: point.y,
          pressure: point.pressure,
        };

        this.points.push(
          this.newPoint(point.x, point.y, point.pressure, rotation),
        );
      }

      handled = true;
    }

    if (!handled) {
      let rotation = this.config.angle * Math.PI * 2;

      if (this.config.rotation) {
        if (!this.lastProcessedPointForRotation) {
          rotation += this.config.rotation.offset ?? 0;

          // Record index of this first point
          // so we can patch it when point 2 arrives
          this._pendingFirstPointIndex = this.points.length;
        } else {
          // Second point just arrived — patch
          // the first point's rotation in the queue
          if (this._pendingFirstPointIndex !== undefined) {
            const firstPt = this.points[this._pendingFirstPointIndex];

            if (firstPt) {
              const realAngle =
                Math.atan2(
                  y - this.lastProcessedPointForRotation.y,
                  x - this.lastProcessedPointForRotation.x,
                ) + (this.config.rotation.offset ?? 0);

              firstPt.rotation = realAngle;
            }

            this._pendingFirstPointIndex = undefined;
          }

          rotation = calculateRotation(
            this.lastProcessedPointForRotation.x,
            this.lastProcessedPointForRotation.y,
            x,
            y,
            this.config.rotation,
            this.previousRotationAngle,
          );
        }

        this.previousRotationAngle = rotation;
      }

      this.lastProcessedPointForRotation = {
        x,
        y,
        pressure,
      };

      this.points.push(this.newPoint(x, y, pressure, rotation));
    }
  }

  private clamp01(value: number): number {
    return Math.min(Math.max(value, 0), 1);
  }

  constructor(canvas?: HTMLCanvasElement, config?: BrushConfig) {
    if (config) this.loadConfig(config);
    if (canvas) this.loadContext(canvas);
  }

  private newPoint(
    x: number,
    y: number,
    pressure: number,
    rotation?: number,
  ): Point {
    const cnf = { ...this.config };
    for (const [, module] of this.modules) {
      if (module.onChangeConfig) {
        module.onChangeConfig(cnf, pressure);
      }
    }

    cnf.opacity = this.clamp01(cnf.opacity);
    cnf.flow = cnf.flow * this.clamp01(pressure);
    cnf.roundness = this.clamp01(cnf.roundness);
    cnf.size = cnf.size * this.clamp01(pressure);
    return { x, y, pressure, config: cnf, rotation };
  }
  private getMixedCanvas(): [HTMLCanvasElement, CanvasRenderingContext2D] {
    let strokeCanvas = this.strokeCanvas!;
    let strokeContext = this.strokeContext!;

    for (const [, module] of this.modules) {
      if (module.onMixinCanvas) {
        [strokeCanvas, strokeContext] = module.onMixinCanvas(
          strokeCanvas,
          strokeContext,
        );
      }
    }

    return [strokeCanvas, strokeContext];
  }

  private mixin(): void {
    this.assertCanvasReady();
    this.context!.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    this.context!.drawImage(this.oriCanvas!, 0, 0);

    const [strokeCanvas] = this.getMixedCanvas();

    // transfer canvas
    this.transferContext!.clearRect(
      0,
      0,
      this.transferCanvas!.width,
      this.transferCanvas!.height,
    );
    this.transferContext!.drawImage(strokeCanvas, 0, 0);

    // blend mode
    const globalCompositeOperation = this.context!.globalCompositeOperation;
    this.context!.globalCompositeOperation = this.blendMode;
    // filter
    const filter = this.context!.filter;
    this.context!.filter = this.filter;

    this.context!.drawImage(this.transferCanvas!, 0, 0);

    // blend mode restore
    this.context!.globalCompositeOperation = globalCompositeOperation;
    // filter restore
    this.context!.filter = filter;
  }

  private endStroke() {
    this.assertCanvasReady();

    const [strokeCanvas] = this.getMixedCanvas();
    // transfer canvas
    this.transferContext!.clearRect(
      0,
      0,
      this.transferCanvas!.width,
      this.transferCanvas!.height,
    );
    this.transferContext!.drawImage(strokeCanvas, 0, 0);
    this.oriContext!.drawImage(this.transferCanvas!, 0, 0);
    this.strokeContext!.clearRect(
      0,
      0,
      strokeCanvas.width,
      strokeCanvas.height,
    );

    // command stack
    if (this.maxUndoRedoStackSize > 0) {
      if (this.canvasStackIndex != this.canvasStack.length - 1) {
        this.canvasStack.splice(
          this.canvasStackIndex + 1,
          this.canvasStack.length - this.canvasStackIndex - 1,
        );
      }
      this.canvasStackIndex =
        this.canvasStack.push(
          this.context!.getImageData(
            0,
            0,
            this.canvas!.width,
            this.canvas!.height,
          ),
        ) - 1;
      if (this.canvasStack.length > this.maxUndoRedoStackSize) {
        this.canvasStack.shift();
        this.canvasStackIndex--;
      }
    }

    // onEndStroke
    for (const [, module] of this.modules) {
      if (module.onEndStroke) {
        module.onEndStroke();
      }
    }
  }

  // draw point
  private draw() {
    this.assertCanvasReady();

    if (this.points.length === 0) {
      return;
    }

    const p = this.points.shift() as Point;

    // Record into stroke history for future post-processing
    this.strokeHistory.push(p);

    const rotation = p.rotation ?? -p.config.angle * Math.PI * 2;

    this.strokeContext!.save();

    // flow
    this.strokeContext!.globalAlpha = p.config.flow;

    // // opacity
    // this.transferContext!.globalAlpha = p.config.opacity;

    // final alpha
    this.strokeContext!.globalAlpha = p.config.flow * p.config.opacity;

    // IMAGE BRUSH
    if (this.shapeCanvas && this.shapeContext) {
      // recolor image
      if (this.shapeContext.fillStyle !== p.config.color.toLowerCase()) {
        const globalCompositeOperation =
          this.shapeContext.globalCompositeOperation;

        this.shapeContext.globalCompositeOperation = "source-atop";

        this.shapeContext.fillStyle = toHashColor(p.config.color);

        this.shapeContext.beginPath();

        this.shapeContext.fillRect(
          0,
          0,
          this.shapeCanvas.width,
          this.shapeCanvas.height,
        );

        this.shapeContext.globalCompositeOperation = globalCompositeOperation;
      }

      const width = p.config.size * p.config.roundness;

      const height = p.config.size / this.shapeRatio;

      this.strokeContext!.translate(p.x, p.y);
      this.strokeContext!.rotate(rotation);

      // Apply per-stamp edge alpha if set
      // (used for tip fade; edgeAlpha is 0.0–1.0)
      if (p.edgeAlpha !== undefined) {
        const prev = this.strokeContext!.globalAlpha;
        this.strokeContext!.globalAlpha = prev * p.edgeAlpha;
      }

      this.strokeContext!.drawImage(
        this.shapeCanvas,
        -width / 2,
        -height / 2,
        width,
        height,
      );
    } else {
      // DEFAULT ELLIPSE BRUSH

      const size = p.config.size;

      const roundness = p.config.roundness;

      const smallerRadius = size * roundness;

      this.strokeContext!.beginPath();

      this.strokeContext!.fillStyle = p.config.color;

      this.strokeContext!.translate(p.x, p.y);

      this.strokeContext!.rotate(rotation);

      this.strokeContext!.ellipse(
        0,
        0,
        size,
        smallerRadius,
        0,
        0,
        Math.PI * 2,
        false,
      );

      this.strokeContext!.fill();

      this.strokeContext!.closePath();
    }

    this.strokeContext!.restore();

    // mixin to visible canvas
    if (this.points.length === 0 || this.drawCount >= this.maxPointsPerFrame) {
      this.mixin();
      this.drawCount = 0;
    } else {
      this.drawCount++;
    }

    // stroke end
    if (p.strokeEnd === true) {
      this.endStroke();
    }

    // callback
    if (p.callback) {
      try {
        p.callback();
      } catch (err) {
        console.error(err);
      }
    }
  }

  private imageInitColoring() {
    if (!this.shapeCanvas || !this.shapeContext) return;
    const oriGlobalCompositeOperation =
      this.shapeContext.globalCompositeOperation;
    this.shapeContext.globalCompositeOperation = "source-atop";
    this.shapeContext.fillStyle = "#000000";
    this.shapeContext.beginPath();
    this.shapeContext.rect(
      0,
      0,
      this.shapeCanvas.width,
      this.shapeCanvas.height,
    );
    this.shapeContext.fill();
    this.shapeContext.closePath();
    this.shapeContext.globalCompositeOperation = oriGlobalCompositeOperation;
  }

  private loadImageWithCanvas(img: HTMLCanvasElement) {
    const canvas = img;
    if (canvas.width === 0 || canvas.height === 0) {
      console.warn("[loadImage] Canvas size is 0, please check your canvas.");
      return;
    }
    this.shapeCanvas = canvas;
    this.shapeContext = canvas.getContext("2d") as CanvasRenderingContext2D;

    this.imageInitColoring();
  }

  private loadImageWithElement(img: HTMLImageElement) {
    const image = img as HTMLImageElement;
    const shapeCvs = document.createElement("canvas");
    if (image.naturalWidth === 0 || image.naturalHeight === 0) {
      console.warn(
        "[loadImage] Image natural size is 0, please check your image url.",
      );
      return;
    }
    shapeCvs.width = image.naturalWidth;
    shapeCvs.height = image.naturalHeight;
    const shapeCtx = shapeCvs.getContext("2d") as CanvasRenderingContext2D;
    shapeCtx.globalAlpha = 1;
    shapeCtx.drawImage(image, 0, 0, shapeCvs.width, shapeCvs.height);
    this.shapeCanvas = shapeCvs;
    this.shapeContext = shapeCtx;

    this.imageInitColoring();
  }

  private loadImageWithUrl(
    url: string,
    callback?: () => void,
    onError?: () => void,
  ) {
    const image = new Image();
    image.src = url;
    image.onload = () => {
      this.loadImageWithElement(image);
      callback?.();
    };
    image.onerror = () => {
      onError?.();
    };
  }

  /**
   * Load/Modify Brush Configuration
   *
   * This function only exists in the config field.
   *
   * You can also modify brush.config
   *
   * @example
   * brush.loadConfig({size: 10})
   * brush.config.size = 10
   */
  loadConfig(config: BrushConfig) {
    if (config.size != null) this.config.size = config.size;
    if (config.opacity != null) this.config.opacity = config.opacity;
    if (config.flow != null) this.config.flow = config.flow;
    if (config.color != null) this.config.color = config.color;
    if (config.angle != null) this.config.angle = config.angle;
    if (config.roundness != null) this.config.roundness = config.roundness;
    if (config.spacing != null) this.config.spacing = config.spacing;
    if (config.rotation != null) this.config.rotation = config.rotation;
  }

  /**
   * Bind config to brush.
   *
   * If you do this, the brush config will change with the external config
   */
  bindConfig(config: BrushBasicConfig) {
    this.config = config;
  }

  /**
   * This function allows loading images as brush styles.
   *
   * The image format has strict requirements.
   * Please use '.png' images with a transparent background or other image formats
   * with a transparent background. Pixels with content in the image will be used as the pattern shape.
   *
   * Tip: It takes some time to load images based on URL (string) ! ! !
   * Pls use 'callback' param or 'loadImageAsync' Function If img as string ! ! !
   */
  loadImage(
    img: HTMLImageElement | HTMLCanvasElement | string,
    callback?: (isSuc: boolean) => void,
  ) {
    if (img instanceof HTMLCanvasElement) {
      this.loadImageWithCanvas(img);
      callback?.(true);
    } else if (img instanceof HTMLImageElement) {
      this.loadImageWithElement(img);
      callback?.(true);
    } else {
      this.loadImageWithUrl(
        img,
        () => {
          callback?.(true);
        },
        () => {
          callback?.(false);
        },
      );
    }
  }

  /**
   * Asynchronous version of 'loadImage'
   */
  loadImageAsync(
    img: HTMLImageElement | HTMLCanvasElement | string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.loadImage(img, (isSuc) => {
        if (isSuc) resolve();
        else reject();
      });
    });
  }

  removeImage() {
    this.shapeCanvas = void 0;
    this.shapeContext = void 0;
  }

  /**
   * Add the current point to the point pool,
   * which will be rendered when the render function is called
   * (interpolation and Bessel calculations will be performed)
   */
  // Inside the putPoint method, replace the interpolation section with this:

  putPoint(x: number, y: number, pressure: number) {
    // FIRST POINT
    if (!this.prePoint || !this.isSpacing) {
      // store first point only
      // do NOT render yet because
      // direction is unknown

      this.prePrePoint = this.prePoint;
      this.prePoint = { x, y, pressure };

      return;
    }

    const p1: PurePoint = { x, y, pressure };
    const p2: PurePoint = this.prePoint;
    const p3: PurePoint = this.prePrePoint || p2;

    let distance = getDistance(p2.x, p2.y, p1.x, p1.y);

    let space = this.config.spacing * this.config.size;

    if (space < this.minSpacePixel) {
      space = this.minSpacePixel;
    }

    if (Math.floor(distance / space) <= 0) {
      return;
    }

    if (distance < this.lagDistance + space) {
      return;
    }

    const angle = getAngle(p2.x, p2.y, p1.x, p1.y);

    p1.x = p2.x + Math.cos(angle) * (distance - this.lagDistance);

    p1.y = p2.y + Math.sin(angle) * (distance - this.lagDistance);

    distance -= this.lagDistance;

    const control = getControlPoint(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);

    const lastP = {
      x: p1.x,
      y: p1.y,
      pressure: p1.pressure,
    };

    // SMOOTH CURVE
    if (this.isSmooth) {
      const points = getEquidistantBezierPoints(
        p2.x,
        p2.y,
        control.x,
        control.y,
        p1.x,
        p1.y,
        space,
      );

      for (const point of points) {
        const t = points.indexOf(point) / points.length;

        const curPressure = p2.pressure + (p1.pressure - p2.pressure) * t;

        lastP.x = point.x;
        lastP.y = point.y;
        lastP.pressure = curPressure;

        // IMPORTANT:
        // let processPoint calculate rotation naturally
        this.processPoint(point.x, point.y, curPressure);
      }
    } else {
      for (let i = space; i <= distance; i += space) {
        const t = i / distance;

        const curPressure = p2.pressure + (p1.pressure - p2.pressure) * t;

        const pointX = p2.x + Math.cos(angle) * i;

        const pointY = p2.y + Math.sin(angle) * i;

        lastP.x = pointX;
        lastP.y = pointY;
        lastP.pressure = curPressure;

        this.processPoint(pointX, pointY, curPressure);
      }
    }

    this.prePrePoint = this.prePoint;

    this.prePoint = {
      x: lastP.x,
      y: lastP.y,
      pressure: lastP.pressure,
    };
  }

  /**
   * Start rendering the coordinate queue data until all the queue data has been rendered,
   * which means that once the render function is run,
   * it will only end when all the coordinate queues have been rendered
   *
   * The render will not run the second one repeatedly.
   * If the rendering is not completed and the render is called repeatedly,
   * it will not produce any effect, so feel free to call it
   */
  render() {
    if (this.isRender) return;
    this.isRender = true;
    const loop = () => {
      for (let i = 0; i < this.maxPointsPerFrame; i++) {
        if (this.points.length === 0) break;
        this.draw();
      }
      if (this.points.length > 0) {
        run();
      } else {
        this.isRender = false;
      }
    };
    const run = () => {
      try {
        requestAnimationFrame(loop);
      } catch {
        loop();
      }
    };
    run();
  }

  /**
   * Reset brush run data
   *
   * This reset does not clear the queue data that has not been fully rendered yet.
   * It only eliminates the impact of the current pen on the next one.
   * If not cleared, there may be a connection between the end of the previous pen
   * and the beginning of the current pen, as well as other bugs
   */
  finalizeStroke(callback?: PointCallBack) {
    this.prePoint = void 0;
    this.prePrePoint = void 0;
    this.previousRotationAngle = 0;
    this.lastProcessedPointForRotation = undefined;
    this._pendingFirstPointIndex = undefined;
    this.strokeHistory = [];

    if (this.points.length > 0) {
      this.points[this.points.length - 1].strokeEnd = true;
    } else {
      this.endStroke();
    }

    if (callback) {
      if (this.points.length === 0) {
        try {
          callback();
        } catch (err) {
          console.error(err);
        }
      } else {
        this.points[this.points.length - 1].callback = callback;
      }
    }
  }

  /**
   * Clear all canvas
   */
  clear() {
    this.points = [];
    this.prePoint = void 0;
    this.prePrePoint = void 0;

    if (this.canvas && this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    if (this.oriCanvas && this.oriContext) {
      this.oriContext.clearRect(
        0,
        0,
        this.oriCanvas.width,
        this.oriCanvas.height,
      );
    }

    if (this.strokeCanvas && this.strokeContext) {
      this.strokeContext.clearRect(
        0,
        0,
        this.strokeCanvas.width,
        this.strokeCanvas.height,
      );
    }

    if (this.transferCanvas && this.transferContext) {
      this.transferContext.clearRect(
        0,
        0,
        this.transferCanvas.width,
        this.transferCanvas.height,
      );
    }
  }

  /**
   * Use a module
   * @returns module unique id
   */
  useModule(module: Module): string {
    for (const [id, existingModule] of this.modules) {
      if (existingModule === module) {
        return id;
      }
    }

    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    this.modules.set(uniqueId, module);

    return uniqueId;
  }

  /**
   * Remove a module
   */
  removeModule(uniqueId: string): boolean {
    if (this.modules.has(uniqueId)) {
      this.modules.delete(uniqueId);
      return true;
    }
    return false;
  }
}

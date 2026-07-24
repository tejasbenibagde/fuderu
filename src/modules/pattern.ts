// src/modules/pattern.ts

import { PatternBasicConfig, PatternConfig } from "../types/pattern";

const defaultConfig: PatternBasicConfig = {
  scale: 1.0,
  brightness: 0,
  contrast: 0,
  blendMode: "source-over",
};

/**
 * Applies repeating image textures to strokes.
 *
 * Useful for:
 * - paper textures
 * - watercolor grain
 * - chalk effects
 * - textured brushes
 */
export class PatternModule {
  config: PatternBasicConfig;

  private pattern?: CanvasPattern;

  private patternCanvas = document.createElement("canvas");

  private patternContext = this.patternCanvas.getContext("2d")!;

  private blendCanvas = document.createElement("canvas");

  private blendContext = this.blendCanvas.getContext("2d")!;

  constructor(config?: PatternConfig) {
    this.config = {
      ...defaultConfig,
      ...Object.fromEntries(
        Object.entries(config ?? {}).filter(([, v]) => v != null),
      ),
    } as PatternBasicConfig;
  }

  bindConfig(config: PatternBasicConfig): void {
    this.config = config;
  }

  // ─────────────────────────────────────────────

  private async loadImageFromUrl(url: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();

      image.src = url;

      image.onload = () => {
        resolve(this.imageToCanvas(image));
      };

      image.onerror = reject;
    });
  }

  private imageToCanvas(image: HTMLImageElement): HTMLCanvasElement {
    const canvas = document.createElement("canvas");

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext("2d")!;

    ctx.drawImage(image, 0, 0);

    return canvas;
  }

  // ─────────────────────────────────────────────

  async loadPattern(
    resource: HTMLImageElement | HTMLCanvasElement | string,
    canvasWidth: number,
    canvasHeight: number,
    tint?: string,
  ): Promise<void> {
    let image: HTMLCanvasElement;

    if (typeof resource === "string") {
      image = await this.loadImageFromUrl(resource);
    } else if (resource instanceof HTMLImageElement) {
      image = this.imageToCanvas(resource);
    } else {
      image = resource;
    }

    const scaled = document.createElement("canvas");

    scaled.width = image.width * this.config.scale;

    scaled.height = image.height * this.config.scale;

    const ctx = scaled.getContext("2d")!;

    let filter = "";

    if (this.config.brightness) {
      filter += `brightness(${this.config.brightness}%) `;
    }

    if (this.config.contrast) {
      filter += `contrast(${this.config.contrast}%) `;
    }

    if (filter.trim()) {
      ctx.filter = filter.trim();
    }

    ctx.drawImage(image, 0, 0, scaled.width, scaled.height);

    if (tint) {
      ctx.globalCompositeOperation = "multiply";

      ctx.globalAlpha = 0.5;

      ctx.fillStyle = tint;

      ctx.fillRect(0, 0, scaled.width, scaled.height);

      ctx.globalCompositeOperation = "source-over";

      ctx.globalAlpha = 1;
    }

    this.patternCanvas.width = canvasWidth;
    this.patternCanvas.height = canvasHeight;

    this.blendCanvas.width = canvasWidth;
    this.blendCanvas.height = canvasHeight;

    this.pattern =
      this.patternContext.createPattern(scaled, "repeat") ?? undefined;

    if (!this.pattern) return;

    this.patternContext.clearRect(0, 0, canvasWidth, canvasHeight);

    this.patternContext.fillStyle = this.pattern;

    this.patternContext.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  removePattern(): void {
    this.pattern = undefined;
  }

  // ─────────────────────────────────────────────

  onMixinCanvas(
    strokeCanvas: HTMLCanvasElement,
    strokeContext: CanvasRenderingContext2D,
  ): [HTMLCanvasElement, CanvasRenderingContext2D] {
    if (!this.pattern) {
      return [strokeCanvas, strokeContext];
    }

    if (
      this.patternCanvas.width !== strokeCanvas.width ||
      this.patternCanvas.height !== strokeCanvas.height
    ) {
      this.patternCanvas.width = strokeCanvas.width;
      this.patternCanvas.height = strokeCanvas.height;
      this.blendCanvas.width = strokeCanvas.width;
      this.blendCanvas.height = strokeCanvas.height;

      this.patternContext.clearRect(
        0,
        0,
        strokeCanvas.width,
        strokeCanvas.height,
      );
      this.patternContext.fillStyle = this.pattern;
      this.patternContext.fillRect(
        0,
        0,
        strokeCanvas.width,
        strokeCanvas.height,
      );
    }

    this.blendContext.clearRect(
      0,
      0,
      this.blendCanvas.width,
      this.blendCanvas.height,
    );

    this.blendContext.drawImage(this.patternCanvas, 0, 0);

    this.blendContext.globalCompositeOperation = "destination-in";

    this.blendContext.drawImage(strokeCanvas, 0, 0);

    this.blendContext.globalCompositeOperation = this.config.blendMode;

    this.blendContext.drawImage(strokeCanvas, 0, 0);

    this.blendContext.globalCompositeOperation = "source-over";

    return [this.blendCanvas, this.blendContext];
  }
}

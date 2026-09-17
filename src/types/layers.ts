/**
 * Strongly-typed identifier for layers.
 */
export type LayerId = string;

/**
 * Blend modes for layer composition
 * Maps to standard Canvas 2D composite operations
 */
export type BlendMode =
  | "source-over"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

/**
 * Immutable Data Transfer Object (DTO) capturing a layer's state at an exact point in time.
 */
export interface LayerSnapshot {
  readonly id: LayerId;
  readonly name: string;
  readonly visible: boolean;
  readonly opacity: number;
  readonly blendMode: BlendMode;
  readonly alphaLock: boolean;
  readonly locked: boolean;
  readonly width: number;
  readonly height: number;
}

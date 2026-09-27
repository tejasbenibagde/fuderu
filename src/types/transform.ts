// src/types/transform.ts

import type { LayerId } from "./layers";

export interface Point2D {
  x: number;
  y: number;
}

export interface TransformBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TransformOptions {
  /** Translation delta or position */
  translation?: Partial<Point2D>;
  /** Rotation angle in radians */
  rotation?: number;
  /** Scale factors along X and Y axes */
  scale?: Partial<Point2D>;
  /** Custom transformation origin / pivot point (defaults to center of sourceBounds) */
  origin?: Partial<Point2D>;
  /** Toggle horizontal flip (inverts scale.x) */
  flipX?: boolean;
  /** Toggle vertical flip (inverts scale.y) */
  flipY?: boolean;
}

export type TransformHandleType =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "rotator"
  | "pivot";

export interface TransformHandle {
  type: TransformHandleType;
  x: number;
  y: number;
}

export interface TransformBoxOptions {
  /** Size of resize and rotate handle squares in pixels (default: 8) */
  handleSize?: number;
  /** Color of handle fill (default: "#ffffff") */
  handleColor?: string;
  /** Color of handle border (default: "#0088ff") */
  handleStrokeColor?: string;
  /** Color of bounding box outline (default: "#0088ff") */
  boxColor?: string;
  /** Width of bounding box line in pixels (default: 1.5) */
  lineWidth?: number;
  /** Distance of rotation handle above top edge in pixels (default: 24) */
  rotatorDistance?: number;
  /** Whether to draw the center pivot crosshair (default: true) */
  showPivot?: boolean;
}

export interface TransformSnapshot {
  readonly active: boolean;
  readonly layerId: LayerId | null;
  readonly isSelection: boolean;
  readonly sourceBounds: TransformBounds;
  readonly translation: Point2D;
  readonly scale: Point2D;
  readonly rotation: number;
  readonly origin: Point2D;
  readonly corners: readonly [Point2D, Point2D, Point2D, Point2D];
  readonly center: Point2D;
}

// src/types/selection.ts

export type SelectionMode = "replace" | "add" | "subtract" | "intersect";

export type SelectionType =
  "rectangle" | "ellipse" | "lasso" | "all" | "custom";

export interface SelectionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SelectionPoint {
  x: number;
  y: number;
}

export interface SelectionSnapshot {
  readonly active: boolean;
  readonly bounds: SelectionBounds | null;
  readonly lastShapeType?: SelectionType;
}

export interface SelectionOutlineOptions {
  strokeStyle?: string;
  secondaryStrokeStyle?: string;
  lineWidth?: number;
  dashPattern?: number[];
  dashOffset?: number;
}

export interface SelectRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  mode?: SelectionMode;
}

export interface SelectEllipseOptions {
  cx: number;
  cy: number;
  radiusX: number;
  radiusY: number;
  rotation?: number;
  mode?: SelectionMode;
}

export interface SelectLassoOptions {
  points: SelectionPoint[];
  mode?: SelectionMode;
}

export interface DrawRectangleOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fill?: boolean;
  stroke?: boolean;
  cornerRadius?: number;
}

export interface DrawEllipseOptions {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  rotation?: number;
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  fill?: boolean;
  stroke?: boolean;
}

export interface DrawLineOptions {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strokeColor?: string;
  strokeWidth?: number;
  lineCap?: CanvasLineCap;
}

export interface TextStyleOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
}

export interface ColorSample {
  r: number;
  g: number;
  b: number;
  a: number;
  hex: string;
  rgba: string;
}

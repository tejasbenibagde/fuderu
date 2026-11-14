import type { BlendMode, SelectionMode } from "fuderu";

export type StudioTool =
  | "brush"
  | "eraser"
  | "bucket"
  | "eyedropper"
  | "rectangle"
  | "ellipse"
  | "line"
  | "text"
  | "rectSelect"
  | "ellipseSelect"
  | "lassoSelect"
  | "transform";

export type RotationMode = "fixed" | "flow" | "random";

export type JitterTrigger = "none" | "pressure";

export interface StudioBrushState {
  color: string;
  size: number;
  opacity: number;
  flow: number;
  spacing: number;
  roundness: number;
  angle: number;
  smooth: boolean;
  spacingEnabled: boolean;
  pressureSimulation: boolean;
  rotationMode: RotationMode;
  sizeJitter: number;
  sizeJitterTrigger: JitterTrigger;
  opacityJitter: number;
  opacityJitterTrigger: JitterTrigger;
  spreadRange: number;
  spreadCount: number;
  customTipName: string | null;
}

export interface StudioShapeOptions {
  fill: boolean;
  stroke: boolean;
  strokeWidth: number;
  cornerRadius: number;
}

export interface CanvasPreset {
  label: string;
  width: number;
  height: number;
}

export const CANVAS_PRESETS: readonly CanvasPreset[] = [
  { label: "Standard HD", width: 1200, height: 800 },
  { label: "Full HD 16:9", width: 1920, height: 1080 },
  { label: "Square Studio", width: 1536, height: 1536 },
  { label: "Portrait 4:5", width: 1080, height: 1350 },
];

export const BLEND_MODES: readonly { value: BlendMode; label: string }[] = [
  { value: "source-over", label: "Normal" },
  { value: "multiply", label: "Multiply" },
  { value: "screen", label: "Screen" },
  { value: "overlay", label: "Overlay" },
  { value: "darken", label: "Darken" },
  { value: "lighten", label: "Lighten" },
  { value: "color-dodge", label: "Color Dodge" },
  { value: "color-burn", label: "Color Burn" },
  { value: "hard-light", label: "Hard Light" },
  { value: "soft-light", label: "Soft Light" },
  { value: "difference", label: "Difference" },
  { value: "exclusion", label: "Exclusion" },
  { value: "hue", label: "Hue" },
  { value: "saturation", label: "Saturation" },
  { value: "color", label: "Color" },
  { value: "luminosity", label: "Luminosity" },
];

export const SELECTION_MODES: readonly {
  value: SelectionMode;
  label: string;
}[] = [
  { value: "replace", label: "Replace" },
  { value: "add", label: "Add" },
  { value: "subtract", label: "Subtract" },
  { value: "intersect", label: "Intersect" },
];

export const QUICK_SWATCHES: readonly string[] = [
  "#0f172a",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#ec4899",
];
